import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { authorizeFileAccess } from "@/lib/files/authorize-file";
import {
  extractCookieValue,
  SHARE_TOKEN_COOKIE_NAME,
} from "@/lib/portfolio/share-token";
import { openStoredFileStream } from "@/lib/storage/local-files";

function sanitizeHeaderFilename(name: string): string {
  const cleaned = name
    .replace(/[\r\n"\\]/g, "_")
    .replace(/[^\x20-\x7E]/g, "_")
    .trim();
  return cleaned || "evidencia";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ fileId: string }> },
) {
  try {
    const { fileId } = await context.params;
    const session = await auth();
    const shareToken = extractCookieValue(
      request.headers.get("cookie"),
      SHARE_TOKEN_COOKIE_NAME,
    );

    const result = await authorizeFileAccess({
      fileId,
      sessionUser: session?.user?.id
        ? { id: session.user.id, role: session.user.role }
        : null,
      shareToken,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    let opened: { stream: ReadableStream<Uint8Array>; sizeBytes: number };
    try {
      opened = await openStoredFileStream(result.storageKey);
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
        return NextResponse.json(
          { error: "Arquivo não encontrado no armazenamento." },
          { status: 404 },
        );
      }
      throw error;
    }

    const safeFilename = sanitizeHeaderFilename(result.file.originalName);
    const isPdf = result.file.mimeType === "application/pdf";
    const disposition = isPdf ? "attachment" : "inline";

    return new NextResponse(opened.stream, {
      status: 200,
      headers: {
        "Content-Type": result.file.mimeType,
        "Content-Length": String(opened.sizeBytes),
        "Content-Disposition": `${disposition}; filename="${safeFilename}"`,
        "Content-Security-Policy": "sandbox",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao carregar arquivo." },
      { status: 500 },
    );
  }
}
