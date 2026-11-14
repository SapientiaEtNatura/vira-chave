import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashShareToken } from "@/lib/portfolio/share-token";
import { readStoredFile } from "@/lib/storage/local-files";

export interface FileSessionUser {
  id: string;
  role?: string;
}

export interface AuthorizeFileInput {
  fileId: string;
  sessionUser?: FileSessionUser | null;
  shareToken?: string | null;
}

export type AuthorizeFileResult =
  | {
      ok: true;
      buffer: Buffer;
      file: {
        id: string;
        originalName: string;
        mimeType: string;
        sizeBytes: number;
      };
    }
  | {
      ok: false;
      status: 401 | 403 | 404;
      error: string;
    };

type FilePrismaClient = Pick<
  PrismaClient,
  "evidenceFile" | "portfolioShareLink"
>;

/**
 * Autoriza o acesso a um arquivo de evidência (somente dono ou via shareToken ativo
 * de um projeto marcado como `isIncludedInShare: true`) e lê seu conteúdo do storage.
 */
export async function authorizeAndReadFile(
  input: AuthorizeFileInput,
  prismaClient: FilePrismaClient = prisma,
  readFileFn: (storageKey: string) => Promise<Buffer> = readStoredFile,
): Promise<AuthorizeFileResult> {
  const fileId = input.fileId?.trim();
  const sessionUserId = input.sessionUser?.id?.trim() || null;
  const rawShareToken = input.shareToken?.trim() || null;

  if (!fileId) {
    return {
      ok: false,
      status: 404,
      error: "Arquivo não encontrado.",
    };
  }

  if (!sessionUserId && !rawShareToken) {
    return {
      ok: false,
      status: 401,
      error: "Não autenticado.",
    };
  }

  const evidenceFile = await prismaClient.evidenceFile.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      storageKey: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      project: {
        select: {
          studentId: true,
          isIncludedInShare: true,
        },
      },
    },
  });

  if (!evidenceFile) {
    return {
      ok: false,
      status: 404,
      error: "Arquivo não encontrado.",
    };
  }

  const isOwner =
    Boolean(sessionUserId) && sessionUserId === evidenceFile.project.studentId;

  if (!isOwner) {
    if (!rawShareToken) {
      return {
        ok: false,
        status: 403,
        error: "Você não tem permissão para acessar este arquivo.",
      };
    }

    const tokenHash = hashShareToken(rawShareToken);
    const shareLink = await prismaClient.portfolioShareLink.findUnique({
      where: { tokenHash },
      select: {
        studentId: true,
        active: true,
        revokedAt: true,
      },
    });

    if (
      !shareLink ||
      !shareLink.active ||
      shareLink.revokedAt !== null ||
      shareLink.studentId !== evidenceFile.project.studentId
    ) {
      return {
        ok: false,
        status: 404,
        error: "Link de compartilhamento inválido ou revogado.",
      };
    }

    if (!evidenceFile.project.isIncludedInShare) {
      return {
        ok: false,
        status: 403,
        error: "Este projeto não está incluído no portfólio compartilhado.",
      };
    }
  }

  try {
    const buffer = await readFileFn(evidenceFile.storageKey);
    return {
      ok: true,
      buffer,
      file: {
        id: evidenceFile.id,
        originalName: evidenceFile.originalName,
        mimeType: evidenceFile.mimeType,
        sizeBytes: evidenceFile.sizeBytes,
      },
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return {
        ok: false,
        status: 404,
        error: "Arquivo não encontrado no armazenamento.",
      };
    }
    throw error;
  }
}
