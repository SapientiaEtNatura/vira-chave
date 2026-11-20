import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { z } from "zod";
import { AUDIT_ACTIONS, recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { requireApiRole } from "@/lib/rbac";
import { strongPasswordSchema } from "@/lib/validations/auth";

const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Informe sua senha atual.")
    .max(128, "Senha muito longa."),
  newPassword: strongPasswordSchema,
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

  try {
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
      await recordAuditLog({
        actorId: authResult.userId,
        actorRole: authResult.role,
        action: AUDIT_ACTIONS.AUTH_PASSWORD_CHANGE_FAILED,
        targetType: "User",
        targetId: user.id,
        metadata: { reason: "invalid_current_password" },
      });
      return NextResponse.json(
        { error: "A senha atual está incorreta." },
        { status: 400 },
      );
    }

    if (parsed.data.newPassword === parsed.data.currentPassword) {
      return NextResponse.json(
        { error: "A nova senha deve ser diferente da senha atual." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });

    await recordAuditLog({
      actorId: authResult.userId,
      actorRole: authResult.role,
      action: AUDIT_ACTIONS.AUTH_PASSWORD_CHANGED,
      targetType: "User",
      targetId: user.id,
    });

    return NextResponse.json({ message: "Senha alterada com sucesso." });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao alterar senha." },
      { status: 500 },
    );
  }
}
