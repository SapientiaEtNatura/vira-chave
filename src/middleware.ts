import { NextResponse, type NextRequest } from "next/server";
import { SHARE_TOKEN_COOKIE_NAME } from "@/lib/portfolio/share-cookie";

const PROTECTED_PAGE_PREFIXES = ["/app", "/educador", "/admin"];
const PROTECTED_API_PREFIXES = [
  "/api/account",
  "/api/discovery",
  "/api/tracks",
  "/api/challenges",
  "/api/portfolio",
  "/api/educator",
  "/api/admin",
];
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function hasSessionCookie(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get("__Secure-authjs.session-token")?.value ||
      request.cookies.get("authjs.session-token")?.value,
  );
}

export function isValidMutationOrigin(request: NextRequest): boolean {
  if (!MUTATING_METHODS.has(request.method.toUpperCase())) {
    return true;
  }

  const origin = request.headers.get("origin");
  const expectedHost =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    request.nextUrl.host;

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      return originHost === expectedHost;
    } catch {
      return false;
    }
  }

  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return false;
  }

  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") && !isValidMutationOrigin(request)) {
    return NextResponse.json(
      { error: "Origem da requisição inválida." },
      { status: 403 },
    );
  }

  if (request.method === "GET" && pathname.startsWith("/p/")) {
    const tokenSeg = pathname.slice(3).split("/")[0] ?? "";
    if (
      tokenSeg &&
      tokenSeg !== "exemplo-demonstracao" &&
      /^[A-Za-z0-9_-]{16,128}$/.test(tokenSeg)
    ) {
      const response = NextResponse.next();
      response.cookies.set(SHARE_TOKEN_COOKIE_NAME, tokenSeg, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/api/files",
        maxAge: 60 * 60,
      });
      return response;
    }
  }

  const isProtectedPage = PROTECTED_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isProtectedApi = PROTECTED_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  if (!hasSessionCookie(request)) {
    if (isProtectedApi) {
      return NextResponse.json(
        { error: "Autenticação necessária." },
        { status: 401 },
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/app/:path*",
    "/educador/:path*",
    "/admin/:path*",
    "/p/:path*",
    "/api/auth/:path*",
    "/api/files/:path*",
    "/api/account/:path*",
    "/api/discovery/:path*",
    "/api/tracks/:path*",
    "/api/challenges/:path*",
    "/api/portfolio/:path*",
    "/api/educator/:path*",
    "/api/admin/:path*",
  ],
};
