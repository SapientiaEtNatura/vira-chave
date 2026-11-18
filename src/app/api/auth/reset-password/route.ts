import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { AUDIT_ACTIONS, recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import {
  resetConfirmSchema,
  resetRequestSchema,
} from "@/lib/validations/auth";

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 },
    );
  }

  // Confirm password reset when token + newPassword are provided
  if (
    typeof body === "object" &&
    body !== null &&
    "token" in body &&
    "newPassword" in body
  ) {
    const parsed = resetConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ?? "Dados de redefinição inválidos.",
        },
        { status: 400 },
      );
    }

    const tokenHash = hashToken(parsed.data.token);
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });

    if (
      !resetRecord ||
      resetRecord.usedAt !== null ||
      resetRecord.expiresAt <= new Date()
    ) {
      return NextResponse.json(
        { error: "Token de recuperação inválido ou expirado." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

    const now = new Date();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      }),
      prisma.passwordResetToken.updateMany({
        where: {
          userId: resetRecord.userId,
          usedAt: null,
        },
        data: { usedAt: now },
      }),
    ]);

    await recordAuditLog({
      actorId: resetRecord.userId,
      action: AUDIT_ACTIONS.AUTH_PASSWORD_RESET,
      targetType: "User",
      targetId: resetRecord.userId,
    });

    return NextResponse.json({
      ok: true,
      message: "Senha redefinida com sucesso. Você já pode entrar.",
    });
  }

  // Request password reset link
  const parsed = resetRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "E-mail inválido." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, status: true },
  });

  if (user && user.status === "ACTIVE") {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: { usedAt: now },
      }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      }),
    ]);

    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[VIRA CHAVE] Recuperação de senha (dev): /recuperar-senha?token=${rawToken}`,
      );
    }
  }

  return NextResponse.json({
    ok: true,
    message:
      "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.",
  });
}
