import { NextResponse, type NextRequest } from "next/server";

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

function hasSessionCookie(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get("__Secure-authjs.session-token")?.value ||
      request.cookies.get("authjs.session-token")?.value,
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    "/api/account/:path*",
    "/api/discovery/:path*",
    "/api/tracks/:path*",
    "/api/challenges/:path*",
    "/api/portfolio/:path*",
    "/api/educator/:path*",
    "/api/admin/:path*",
  ],
};
