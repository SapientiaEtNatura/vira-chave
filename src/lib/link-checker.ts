import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { isIP, type LookupFunction } from "node:net";

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

  const [a, b, c] = octets;

  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (CGNAT)
  if (a === 127) return true; // 127.0.0.0/8 (loopback)
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 (link-local)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return true; // 192.0.0.0/24 & 192.0.2.0/24
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15 (Benchmarking)
  if (a === 198 && b === 51 && c === 100) return true; // 198.51.100.0/24 (TEST-NET-2)
  if (a === 203 && b === 0 && c === 113) return true; // 203.0.113.0/24 (TEST-NET-3)
  if (a >= 224) return true; // Multicast & reserved (224.0.0.0/4+)

  return false;
}

function parseIpv4EmbeddedHextets(ipv4: string): [number, number] | null {
  const parts = ipv4.split(".");
  if (parts.length !== 4) {
    return null;
  }
  const octets = parts.map((part) => Number(part));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null;
  }
  return [(octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]];
}

function parseIpv6SegmentList(segments: string[]): number[] | null {
  const result: number[] = [];
  for (const seg of segments) {
    if (!/^[0-9a-f]{1,4}$/.test(seg)) {
      return null;
    }
    result.push(Number.parseInt(seg, 16));
  }
  return result;
}

function parseIpv6Hextets(ip: string): number[] | null {
  const hasCompression = ip.includes("::");
  const halves = hasCompression ? ip.split("::") : [ip];
  if (halves.length > 2) {
    return null;
  }

  const leftRaw = halves[0] ? halves[0].split(":") : [];
  const rightRaw = hasCompression && halves[1] ? halves[1].split(":") : [];

  let trailingHextets: [number, number] | null = null;
  const targetRaw = rightRaw.length > 0 ? rightRaw : leftRaw;
  const lastSeg = targetRaw[targetRaw.length - 1];
  if (lastSeg && lastSeg.includes(".")) {
    targetRaw.pop();
    trailingHextets = parseIpv4EmbeddedHextets(lastSeg);
    if (!trailingHextets) {
      return null;
    }
  }

  const leftNums = parseIpv6SegmentList(leftRaw);
  const rightNums = parseIpv6SegmentList(rightRaw);
  if (!leftNums || !rightNums) {
    return null;
  }

  if (trailingHextets) {
    if (hasCompression && halves[1] === "" && rightNums.length === 0) {
      return null;
    }
    if (hasCompression) {
      rightNums.push(...trailingHextets);
    } else {
      leftNums.push(...trailingHextets);
    }
  }

  if (hasCompression) {
    const missing = 8 - (leftNums.length + rightNums.length);
    if (missing < 1) {
      return null;
    }
    return [...leftNums, ...Array<number>(missing).fill(0), ...rightNums];
  }

  return leftNums.length === 8 ? leftNums : null;
}

function isPrivateOrReservedIpv6(ip: string): boolean {
  const hextets = parseIpv6Hextets(ip);
  if (!hextets) {
    return true;
  }

  const [h0, h1, h2, h3, h4, h5] = hextets;

  // ::/96 (unspecified ::, loopback ::1, IPv4-compatible ::x.x.x.x)
  if (h0 === 0 && h1 === 0 && h2 === 0 && h3 === 0 && h4 === 0 && h5 === 0) {
    return true;
  }

  // ::ffff:0:0/96 (IPv4-mapped)
  if (h0 === 0 && h1 === 0 && h2 === 0 && h3 === 0 && h4 === 0 && h5 === 0xffff) {
    return true;
  }

  // ::ffff:0:0:0/96 (IPv4-translated SIIT: 0:0:0:0:ffff:0:x:x)
  if (h0 === 0 && h1 === 0 && h2 === 0 && h3 === 0 && h4 === 0xffff && h5 === 0) {
    return true;
  }

  // 64:ff9b::/96 e 64:ff9b:1::/48 (NAT64)
  if (h0 === 0x0064 && h1 === 0xff9b) {
    if (h2 === 0 && h3 === 0 && h4 === 0 && h5 === 0) {
      return true;
    }
    if (h2 === 0x0001) {
      return true;
    }
  }

  // 100::/64 (discard-only)
  if (h0 === 0x0100 && h1 === 0 && h2 === 0 && h3 === 0) {
    return true;
  }

  // 2001:db8::/32 (documentation)
  if (h0 === 0x2001 && h1 === 0x0db8) {
    return true;
  }

  // 2002::/16 (6to4)
  if (h0 === 0x2002) {
    return true;
  }

  // fc00::/7 (Unique Local Address: fc00..fdff)
  if ((h0 & 0xfe00) === 0xfc00) {
    return true;
  }

  // fe80::/10 (Link-Local: fe80..febf)
  if ((h0 & 0xffc0) === 0xfe80) {
    return true;
  }

  // fec0::/10 (deprecated site-local: fec0..feff)
  if ((h0 & 0xffc0) === 0xfec0) {
    return true;
  }

  // ff00::/8 (Multicast)
  if ((h0 & 0xff00) === 0xff00) {
    return true;
  }

  return false;
}

export function isPrivateOrReservedIp(rawIp: string): boolean {
  const ip = rawIp.trim().split("%")[0].toLowerCase();
  const version = isIP(ip);

  if (version === 4) {
    return isPrivateOrReservedIpv4(ip);
  }

  if (version === 6) {
    return isPrivateOrReservedIpv6(ip);
  }

  // Fail closed for unrecognized IP strings
  return true;
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.+$/, "");
  if (!normalized) {
    return true;
  }
  if (isIP(normalized) !== 0) {
    return false;
  }
  return (
    !normalized.includes(".") ||
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

  if (isIP(hostname) !== 0) {
    if (isPrivateOrReservedIp(hostname)) {
      return {
        safe: false,
        reason: "Endereço IP privado ou reservado não é permitido.",
      };
    }
    return { safe: true, parsed, hostname, isIpLiteral: true };
  }

  if (isBlockedHostname(hostname)) {
    return { safe: false, reason: "Hostname local ou interno não é permitido." };
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
    const family = isIP(structure.hostname);
    if (family !== 4 && family !== 6) {
      return { safe: false, reason: "Endereço IP inválido." };
    }
    return {
      safe: true,
      resolvedAddress: structure.hostname,
      resolvedFamily: family,
    };
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

export type CheckedResponse = {
  status: number;
  ok: boolean;
  location: string | null;
};

export type CheckedRequestFn = (
  urlStr: string,
  method: "HEAD" | "GET",
  pinned: { address: string; family: 4 | 6 },
) => Promise<CheckedResponse>;

async function sendCheckedRequest(
  urlStr: string,
  method: "HEAD" | "GET",
  pinned: { address: string; family: 4 | 6 },
): Promise<CheckedResponse> {
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

    const handleResponse = (res: http.IncomingMessage) => {
      const status = res.statusCode ?? 0;
      const rawLocation = res.headers.location;
      const location = Array.isArray(rawLocation)
        ? (rawLocation[0] ?? null)
        : (rawLocation ?? null);
      finishResolve({
        status,
        ok: status >= 200 && status < 300,
        location,
      });
      res.resume();
      res.destroy();
    };

    const parsedHostname = parsed.hostname.replace(/^\[|\]$/g, "");
    const httpsOptions =
      isIP(parsedHostname) === 0
        ? { ...requestOptions, servername: parsed.hostname }
        : requestOptions;

    const req =
      parsed.protocol === "https:"
        ? https.request(parsed, httpsOptions, handleResponse)
        : http.request(parsed, requestOptions, handleResponse);

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
  requestFn: CheckedRequestFn,
): Promise<
  | {
      response: CheckedResponse;
      finalUrl: string;
      finalPinned: { address: string; family: 4 | 6 };
      error?: undefined;
    }
  | { response?: undefined; error: { ok: false; status: number | null; reason: string } }
> {
  let currentUrl = initialUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const safety = await isSafeExternalUrl(currentUrl);
    if (!safety.safe || !safety.resolvedAddress || !safety.resolvedFamily) {
      return {
        error: {
          ok: false,
          status: null,
          reason: safety.reason ?? "URL de redirecionamento bloqueada.",
        },
      };
    }

    const pinned = {
      address: safety.resolvedAddress,
      family: safety.resolvedFamily,
    };

    const response = await requestFn(currentUrl, method, pinned);

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

    return { response, finalUrl: currentUrl, finalPinned: pinned };
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
  options?: { requestFn?: CheckedRequestFn },
): Promise<{ ok: boolean; status: number | null; reason?: string }> {
  const requestFn = options?.requestFn ?? sendCheckedRequest;
  try {
    const result = await fetchWithValidatedRedirects(rawUrl, "HEAD", requestFn);
    if (result.error) {
      return result.error;
    }

    let response = result.response;

    if (response.status === 405 || response.status === 501) {
      response = await requestFn(result.finalUrl, "GET", result.finalPinned);
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
