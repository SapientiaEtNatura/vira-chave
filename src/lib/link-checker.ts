import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { isIP, type LookupFunction } from "node:net";

const REQUEST_TIMEOUT_MS = 5000;
const NATIVE_FETCH = globalThis.fetch;

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

export interface ExternalUrlStructureResult {
  safe: boolean;
  reason?: string;
  parsed?: URL;
  hostname?: string;
  isIpLiteral?: boolean;
}

export function validateExternalUrlStructure(
  rawUrl: string,
): ExternalUrlStructureResult {
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
      return {
        safe: false,
        reason: "Endereço IP privado ou reservado não é permitido.",
      };
    }
    return { safe: true, parsed, hostname, isIpLiteral: true };
  }

  return { safe: true, parsed, hostname, isIpLiteral: false };
}

export async function isSafeExternalUrl(rawUrl: string): Promise<{
  safe: boolean;
  reason?: string;
  resolvedAddress?: string;
  resolvedFamily?: 4 | 6;
}> {
  const structure = validateExternalUrlStructure(rawUrl);
  if (!structure.safe || !structure.hostname) {
    return { safe: false, reason: structure.reason };
  }

  if (structure.isIpLiteral) {
    return { safe: true };
  }

  try {
    const records = await lookup(structure.hostname, { all: true });
    if (records.length === 0) {
      return { safe: false, reason: "Nenhum endereço IP resolvido para o host." };
    }

    for (const record of records) {
      if (isPrivateOrReservedIp(record.address)) {
        return { safe: false, reason: "Host resolve para endereço IP privado ou reservado." };
      }
    }

    const primary = records[0];
    return {
      safe: true,
      resolvedAddress: primary.address,
      resolvedFamily: primary.family === 6 ? 6 : 4,
    };
  } catch {
    return { safe: false, reason: "Falha ao resolver DNS do host." };
  }
}

const MAX_REDIRECTS = 3;

interface CheckedResponse {
  status: number;
  ok: boolean;
  location: string | null;
}

async function sendCheckedRequest(
  urlStr: string,
  method: "HEAD" | "GET",
  pinned?: { address: string; family: 4 | 6 },
): Promise<CheckedResponse> {
  if (!pinned || globalThis.fetch !== NATIVE_FETCH) {
    const response = await globalThis.fetch(urlStr, {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const location = response.headers.get("location");
    await response.body?.cancel().catch(() => undefined);
    return {
      status: response.status,
      ok: response.ok,
      location,
    };
  }

  const parsed = new URL(urlStr);
  const pinnedLookup: LookupFunction = (_host, opts, callback) => {
    if (typeof opts === "object" && opts !== null && opts.all) {
      callback(null, [{ address: pinned.address, family: pinned.family }]);
      return;
    }
    callback(null, pinned.address, pinned.family);
  };

  return new Promise<CheckedResponse>((resolve, reject) => {
    let settled = false;
    const finishResolve = (val: CheckedResponse) => {
      if (settled) return;
      settled = true;
      resolve(val);
    };
    const finishReject = (err: unknown) => {
      if (settled) return;
      settled = true;
      reject(err);
    };

    const requestOptions = {
      method,
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        Host: parsed.host,
        "User-Agent": "ViraChave-LinkChecker/1.0",
      },
      lookup: pinnedLookup,
    };

    const req =
      parsed.protocol === "https:"
        ? https.request(
            parsed,
            { ...requestOptions, servername: parsed.hostname },
            (res) => {
              const status = res.statusCode ?? 0;
              const rawLocation = res.headers.location;
              const location = Array.isArray(rawLocation)
                ? (rawLocation[0] ?? null)
                : (rawLocation ?? null);
              res.resume();
              res.destroy();
              finishResolve({
                status,
                ok: status >= 200 && status < 300,
                location,
              });
            },
          )
        : http.request(parsed, requestOptions, (res) => {
            const status = res.statusCode ?? 0;
            const rawLocation = res.headers.location;
            const location = Array.isArray(rawLocation)
              ? (rawLocation[0] ?? null)
              : (rawLocation ?? null);
            res.resume();
            res.destroy();
            finishResolve({
              status,
              ok: status >= 200 && status < 300,
              location,
            });
          });

    req.on("timeout", () => {
      const timeoutErr = new Error("Tempo limite excedido ao verificar o link externo.");
      req.destroy(timeoutErr);
      finishReject(timeoutErr);
    });

    req.on("error", (err) => {
      finishReject(err);
    });

    req.end();
  });
}

async function fetchWithValidatedRedirects(
  initialUrl: string,
  method: "HEAD" | "GET",
): Promise<
  | { response: CheckedResponse; error?: undefined }
  | { response?: undefined; error: { ok: false; status: number | null; reason: string } }
> {
  let currentUrl = initialUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const safety = await isSafeExternalUrl(currentUrl);
    if (!safety.safe) {
      return {
        error: {
          ok: false,
          status: null,
          reason: safety.reason ?? "URL de redirecionamento bloqueada.",
        },
      };
    }

    const pinned = safety.resolvedAddress
      ? { address: safety.resolvedAddress, family: safety.resolvedFamily ?? 4 }
      : undefined;

    const response = await sendCheckedRequest(currentUrl, method, pinned);

    if (response.status >= 300 && response.status < 400) {
      const location = response.location;

      if (!location) {
        return {
          error: {
            ok: false,
            status: response.status,
            reason: "Redirecionamento sem cabeçalho Location.",
          },
        };
      }

      if (hop >= MAX_REDIRECTS) {
        return {
          error: {
            ok: false,
            status: response.status,
            reason: "Limite de redirecionamentos excedido.",
          },
        };
      }

      try {
        currentUrl = new URL(location, currentUrl).toString();
      } catch {
        return {
          error: {
            ok: false,
            status: response.status,
            reason: "URL de redirecionamento inválida.",
          },
        };
      }

      continue;
    }

    return { response };
  }

  return {
    error: {
      ok: false,
      status: null,
      reason: "Limite de redirecionamentos excedido.",
    },
  };
}

export async function checkExternalLink(
  rawUrl: string,
): Promise<{ ok: boolean; status: number | null; reason?: string }> {
  try {
    let result = await fetchWithValidatedRedirects(rawUrl, "HEAD");
    if (result.error) {
      return result.error;
    }

    let response = result.response;

    if (response.status === 405 || response.status === 501) {
      result = await fetchWithValidatedRedirects(rawUrl, "GET");
      if (result.error) {
        return result.error;
      }
      response = result.response;
    }

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
