import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const REQUEST_TIMEOUT_MS = 5000;

function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return true;
  }

  const octets = parts.map((part) => Number(part));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return true;
  }

  const [a, b] = octets;

  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (CGNAT)
  if (a === 127) return true; // 127.0.0.0/8 (loopback)
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 (link-local)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a >= 224) return true; // Multicast & reserved (224.0.0.0/4+)

  return false;
}

function extractMappedIpv4FromIpv6(normalizedIpv6: string): string | null {
  // Dotted-quad form e.g. ::ffff:127.0.0.1
  const dottedMatch = normalizedIpv6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (dottedMatch) {
    return dottedMatch[1];
  }

  // Compressed hex form e.g. ::ffff:7f00:1 or 0:0:0:0:0:ffff:7f00:0001
  const hexMatch = normalizedIpv6.match(
    /^(?:::ffff:|(?:0+:){5}ffff:)([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i,
  );
  if (hexMatch) {
    const high = Number.parseInt(hexMatch[1], 16);
    const low = Number.parseInt(hexMatch[2], 16);
    return `${(high >> 8) & 0xff}.${high & 0xff}.${(low >> 8) & 0xff}.${low & 0xff}`;
  }

  return null;
}

export function isPrivateOrReservedIp(rawIp: string): boolean {
  const ip = rawIp.trim().split("%")[0].toLowerCase();
  const version = isIP(ip);

  if (version === 4) {
    return isPrivateOrReservedIpv4(ip);
  }

  if (version === 6) {
    if (ip === "::" || ip === "::1") {
      return true;
    }

    const mappedIpv4 = extractMappedIpv4FromIpv6(ip);
    if (mappedIpv4) {
      return isPrivateOrReservedIpv4(mappedIpv4);
    }

    // fc00::/7 (Unique Local Address: fc00..fdff)
    if (ip.startsWith("fc") || ip.startsWith("fd")) {
      return true;
    }

    // fe80::/10 (Link-Local: fe80..febf)
    if (/^fe[89ab]/.test(ip)) {
      return true;
    }

    // ff00::/8 (Multicast)
    if (ip.startsWith("ff")) {
      return true;
    }

    // 0:0:0:0:0:0:0:0 or 0:0:0:0:0:0:0:1 expanded forms
    const expanded = ip.split(":");
    if (
      expanded.length === 8 &&
      expanded.slice(0, 7).every((seg) => /^0+$/.test(seg)) &&
      (/^0+$/.test(expanded[7]) || /^0*1$/.test(expanded[7]))
    ) {
      return true;
    }

    return false;
  }

  // Fail closed for unrecognized IP strings
  return true;
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal")
  );
}

export async function isSafeExternalUrl(
  rawUrl: string,
): Promise<{ safe: boolean; reason?: string }> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { safe: false, reason: "URL inválida." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { safe: false, reason: "Protocolo não permitido. Use http ou https." };
  }

  if (parsed.username || parsed.password) {
    return { safe: false, reason: "Credenciais na URL não são permitidas." };
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (!hostname) {
    return { safe: false, reason: "Hostname ausente." };
  }

  if (isBlockedHostname(hostname)) {
    return { safe: false, reason: "Hostname local ou interno não é permitido." };
  }

  if (isIP(hostname) !== 0) {
    if (isPrivateOrReservedIp(hostname)) {
      return { safe: false, reason: "Endereço IP privado ou reservado não é permitido." };
    }
    return { safe: true };
  }

  try {
    const records = await lookup(hostname, { all: true });
    if (records.length === 0) {
      return { safe: false, reason: "Nenhum endereço IP resolvido para o host." };
    }

    for (const record of records) {
      if (isPrivateOrReservedIp(record.address)) {
        return { safe: false, reason: "Host resolve para endereço IP privado ou reservado." };
      }
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: "Falha ao resolver DNS do host." };
  }
}

export async function checkExternalLink(
  rawUrl: string,
): Promise<{ ok: boolean; status: number | null; reason?: string }> {
  const safety = await isSafeExternalUrl(rawUrl);
  if (!safety.safe) {
    return { ok: false, status: null, reason: safety.reason };
  }

  try {
    let response = await fetch(rawUrl, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.status === 405 || response.status === 501) {
      await response.body?.cancel().catch(() => undefined);
      response = await fetch(rawUrl, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    }

    await response.body?.cancel().catch(() => undefined);

    return {
      ok: response.ok,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      reason: error instanceof Error ? error.message : "Erro ao verificar link externo.",
    };
  }
}
