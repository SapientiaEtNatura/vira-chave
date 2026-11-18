export const SHARE_TOKEN_COOKIE_NAME = "__vc_share_token";

/**
 * Extrai com segurança o valor de um cookie específico a partir do cabeçalho `Cookie`.
 */
export function extractCookieValue(
  cookieHeader: string | null,
  cookieName: string,
): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const eqIndex = part.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }
    const name = part.slice(0, eqIndex).trim();
    if (name === cookieName) {
      const rawValue = part.slice(eqIndex + 1).trim();
      try {
        return decodeURIComponent(rawValue);
      } catch {
        return rawValue;
      }
    }
  }

  return null;
}
