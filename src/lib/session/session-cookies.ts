export const ACCESS_TOKEN_COOKIE = "evx_access";
export const REFRESH_TOKEN_COOKIE = "evx_refresh";
export const ACTIVE_ORGANIZATION_COOKIE = "evx_org";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string | null;
  refreshTokenExpiresAt: string | null;
}

interface CookieWriter {
  set(name: string, value: string, options: CookieOptions): unknown;
}

interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  expires?: Date;
  maxAge?: number;
}

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}

export function writeSessionCookies(cookieWriter: CookieWriter, tokens: AuthTokens): void {
  cookieWriter.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseCookieOptions(),
    expires: new Date(tokens.accessTokenExpiresAt),
  });
  if (tokens.refreshToken && tokens.refreshTokenExpiresAt) {
    cookieWriter.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...baseCookieOptions(),
      expires: new Date(tokens.refreshTokenExpiresAt),
    });
  }
}

export function writeActiveOrganizationCookie(cookieWriter: CookieWriter, organizationId: string): void {
  cookieWriter.set(ACTIVE_ORGANIZATION_COOKIE, organizationId, {
    ...baseCookieOptions(),
    maxAge: ONE_YEAR_IN_SECONDS,
  });
}

export function readTokenExpiration(accessToken: string): number | null {
  const payloadSegment = accessToken.split(".")[1];
  if (!payloadSegment) {
    return null;
  }
  try {
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64)) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}
