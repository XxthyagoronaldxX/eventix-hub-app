import { type NextRequest, NextResponse } from "next/server";
import { apiUrl } from "@/lib/api/api-url";
import {
  ACCESS_TOKEN_COOKIE,
  type AuthTokens,
  readTokenExpiration,
  REFRESH_TOKEN_COOKIE,
  writeSessionCookies,
} from "@/lib/session/session-cookies";

const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/invitations",
  "/sorteio",
  "/pagamento",
];
const REFRESH_MARGIN_MILLISECONDS = 30_000;

export async function proxy(request: NextRequest) {
  if (isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return rejectUnauthenticated(request);
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken && !isExpiringSoon(accessToken)) {
    return NextResponse.next();
  }

  const refreshedTokens = await refreshSession(refreshToken);
  if (!refreshedTokens) {
    const response = rejectUnauthenticated(request);
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  forwardRefreshedTokensToRendering(request, refreshedTokens);
  const response = NextResponse.next({ request: { headers: request.headers } });
  writeSessionCookies(response.cookies, refreshedTokens);
  return response;
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isExpiringSoon(accessToken: string): boolean {
  const expiresAt = readTokenExpiration(accessToken);
  return expiresAt === null || expiresAt - Date.now() < REFRESH_MARGIN_MILLISECONDS;
}

async function refreshSession(refreshToken: string): Promise<AuthTokens | null> {
  try {
    const response = await fetch(apiUrl("/auth/refresh"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    return response.ok ? ((await response.json()) as AuthTokens) : null;
  } catch {
    return null;
  }
}

function forwardRefreshedTokensToRendering(request: NextRequest, tokens: AuthTokens): void {
  request.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken);
  if (tokens.refreshToken) {
    request.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken);
  }
}

function rejectUnauthenticated(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "Sessão expirada" }, { status: 401 });
  }
  const loginUrl = new URL("/login", request.url);
  const requestedPath = request.nextUrl.pathname + request.nextUrl.search;
  if (requestedPath !== "/") {
    loginUrl.searchParams.set("next", requestedPath);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|brand/).*)"],
};
