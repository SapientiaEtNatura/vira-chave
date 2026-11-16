import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { AUDIT_ACTIONS, recordAuditLog } from "@/lib/audit";
import { signOut } from "@/lib/auth";
import { requireApiRole } from "@/lib/rbac";
import {
  AccountDeletionError,
  deleteStudentAccount,
} from "@/lib/lgpd/delete-account";

const deleteAccountSchema = z.object({
  confirmation: z.literal("EXCLUIR", {
    message: 'Digite "EXCLUIR" para confirmar a exclusão permanente da conta.',
  }),
});

export async function DELETE(request: Request) {
  const authResult = await requireApiRole([Role.ESTUDANTE]);
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

  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ??
          "Confirmação de exclusão inválida.",
      },
      { status: 400 },
    );
  }

  try {
    await deleteStudentAccount(authResult.userId);
  } catch (error) {
    if (error instanceof AccountDeletionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Não foi possível excluir a conta. Tente novamente." },
      { status: 500 },
    );
  }

  await recordAuditLog({
    actorId: null,
    actorRole: authResult.role,
    action: AUDIT_ACTIONS.ACCOUNT_DELETED,
    targetType: "User",
    targetId: null,
    metadata: { via: "self_service" },
  });

  try {
    await signOut({ redirect: false });
  } catch {
    // Session cookie cleanup is also triggered on the client
  }

  return NextResponse.json({
    message: "Sua conta e seus dados pessoais foram excluídos com sucesso.",
  });
}
