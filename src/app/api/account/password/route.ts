import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/rbac";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Informe sua senha atual."),
  newPassword: z
    .string()
    .min(8, "A nova senha deve ter pelo menos 8 caracteres.")
    .max(128, "Senha muito longa."),
});

export async function POST(request: Request) {
  const authResult = await requireApiRole([
    Role.ESTUDANTE,
    Role.EDUCADOR,
    Role.ADMIN,
  ]);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 },
    );
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "Dados de senha inválidos.",
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: authResult.userId },
    select: { id: true, passwordHash: true, status: true },
  });

  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Conta não encontrada ou inativa." },
      { status: 404 },
    );
  }

  const isCurrentValid = await bcrypt.compare(
    parsed.data.currentPassword,
    user.passwordHash,
  );
  if (!isCurrentValid) {
    return NextResponse.json(
      { error: "A senha atual está incorreta." },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ message: "Senha alterada com sucesso." });
}
