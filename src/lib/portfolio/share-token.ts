import crypto from "node:crypto";

export {
  extractCookieValue,
  SHARE_TOKEN_COOKIE_NAME,
} from "@/lib/portfolio/share-cookie";

/**
 * Gera o hash SHA-256 em hexadecimal de um token bruto de compartilhamento de portfólio.
 */
export function hashShareToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
