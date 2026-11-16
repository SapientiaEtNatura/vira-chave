import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const AUDIT_ACTIONS = {
  CONTENT_CREATED: "CONTENT_CREATED",
  CONTENT_UPDATED: "CONTENT_UPDATED",
  CONTENT_DELETED: "CONTENT_DELETED",
  LINKS_CHECKED: "LINKS_CHECKED",
  INSTITUTION_CREATED: "INSTITUTION_CREATED",
  INSTITUTION_UPDATED: "INSTITUTION_UPDATED",
  USER_UPDATED: "USER_UPDATED",
  CLASSROOM_UPDATED: "CLASSROOM_UPDATED",
  ACCOUNT_DELETED: "ACCOUNT_DELETED",
  AUTH_LOGIN_FAILED: "AUTH_LOGIN_FAILED",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS] | (string & {});

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "email",
  "answers",
  "reflection",
  "secret",
]);

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        continue;
      }
      if (val !== undefined) {
        sanitized[key] = sanitizeValue(val);
      }
    }
    return sanitized;
  }

  return value;
}

export function sanitizeAuditMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | undefined {
  if (!metadata) {
    return undefined;
  }

  return sanitizeValue(metadata) as Prisma.InputJsonValue;
}

export interface RecordAuditLogInput {
  actorId?: string | null;
  actorRole?: string | null;
  action: AuditAction;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function recordAuditLog(input: RecordAuditLogInput): Promise<void> {
  try {
    const sanitizedMetadata = sanitizeAuditMetadata(input.metadata);

    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ?? null,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        ...(sanitizedMetadata !== undefined ? { metadata: sanitizedMetadata } : {}),
      },
    });
  } catch (error) {
    console.error("[audit] Falha ao registrar log de auditoria", {
      action: input.action,
      targetType: input.targetType,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
}
