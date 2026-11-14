import crypto from "node:crypto";

/**
 * Gera o hash SHA-256 em hexadecimal de um token bruto de compartilhamento de portfólio.
 */
export function hashShareToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
