import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { authorizeAndReadFile } from "@/lib/files/authorize-file";

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
  const { fileId } = await context.params;
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const shareToken = searchParams.get("shareToken");

  const result = await authorizeAndReadFile({
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

  const safeFilename = sanitizeHeaderFilename(result.file.originalName);

  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "Content-Type": result.file.mimeType,
      "Content-Disposition": `inline; filename="${safeFilename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
