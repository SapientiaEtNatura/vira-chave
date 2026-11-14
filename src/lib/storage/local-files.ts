import crypto from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_EVIDENCE_SIZE_BYTES = 5 * 1024 * 1024;

export type ValidatedEvidenceType =
  | { mimeType: "application/pdf"; ext: "pdf" }
  | { mimeType: "image/png"; ext: "png" }
  | { mimeType: "image/jpeg"; ext: "jpg" };

export interface SavedEvidenceFile {
  storageKey: string;
  originalName: string;
  mimeType: ValidatedEvidenceType["mimeType"];
  sizeBytes: number;
}

export class FileValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "FileValidationError";
    this.status = status;
  }
}

const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
const PNG_MAGIC = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);

const ALLOWED_EXTENSIONS: Record<ValidatedEvidenceType["ext"], string[]> = {
  pdf: [".pdf"],
  png: [".png"],
  jpg: [".jpg", ".jpeg"],
};

function getUploadDir(): string {
  return path.resolve(
    process.env.UPLOAD_DIR || path.resolve(process.cwd(), "uploads"),
  );
}

function resolveSafeStoragePath(storageKey: string): string {
  if (!storageKey || storageKey.includes("\0")) {
    throw new FileValidationError("Chave de armazenamento inválida.");
  }

  const uploadDir = getUploadDir();
  const normalizedKey = storageKey.replace(/\\/g, "/");
  if (
    path.isAbsolute(normalizedKey) ||
    normalizedKey.startsWith("/") ||
    normalizedKey.split("/").includes("..")
  ) {
    throw new FileValidationError("Caminho de arquivo inválido.");
  }

  const targetPath = path.resolve(uploadDir, normalizedKey);
  if (!targetPath.startsWith(`${uploadDir}${path.sep}`)) {
    throw new FileValidationError("Caminho de arquivo inválido.");
  }

  return targetPath;
}

export function validateEvidenceBuffer(
  fileName: string,
  buffer: Buffer,
): ValidatedEvidenceType {
  if (buffer.length === 0) {
    throw new FileValidationError("O arquivo enviado está vazio.");
  }

  if (buffer.length > MAX_EVIDENCE_SIZE_BYTES) {
    throw new FileValidationError(
      "O arquivo excede o limite máximo de 5 MB.",
    );
  }

  let detected: ValidatedEvidenceType | null = null;
  if (buffer.length >= PDF_MAGIC.length && buffer.subarray(0, 5).equals(PDF_MAGIC)) {
    detected = { mimeType: "application/pdf", ext: "pdf" };
  } else if (
    buffer.length >= PNG_MAGIC.length &&
    buffer.subarray(0, 8).equals(PNG_MAGIC)
  ) {
    detected = { mimeType: "image/png", ext: "png" };
  } else if (
    buffer.length >= JPEG_MAGIC.length &&
    buffer.subarray(0, 3).equals(JPEG_MAGIC)
  ) {
    detected = { mimeType: "image/jpeg", ext: "jpg" };
  }

  if (!detected) {
    throw new FileValidationError(
      "Formato de arquivo não suportado. Envie um arquivo PDF, PNG ou JPG válido.",
    );
  }

  const ext = path.extname(fileName || "").toLowerCase();
  if (ext && !ALLOWED_EXTENSIONS[detected.ext].includes(ext)) {
    throw new FileValidationError(
      "A extensão do arquivo não corresponde ao seu conteúdo.",
    );
  }

  return detected;
}

export async function saveEvidenceFile(
  file: File,
  ownerId: string,
): Promise<SavedEvidenceFile> {
  if (!/^[a-zA-Z0-9_-]+$/.test(ownerId)) {
    throw new FileValidationError("Identificador de proprietário inválido.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const validated = validateEvidenceBuffer(file.name, buffer);

  const storageKey = `${ownerId}/${crypto.randomUUID()}.${validated.ext}`;
  const targetPath = resolveSafeStoragePath(storageKey);

  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, buffer);

  const safeOriginalName =
    path.basename(file.name || "").trim() || `evidencia.${validated.ext}`;

  return {
    storageKey,
    originalName: safeOriginalName,
    mimeType: validated.mimeType,
    sizeBytes: buffer.length,
  };
}

export async function readStoredFile(storageKey: string): Promise<Buffer> {
  const targetPath = resolveSafeStoragePath(storageKey);
  return readFile(targetPath);
}

export async function deleteStoredFile(storageKey: string): Promise<void> {
  const targetPath = resolveSafeStoragePath(storageKey);
  try {
    await unlink(targetPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
