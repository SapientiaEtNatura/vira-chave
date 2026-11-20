import http from "k6/http";
import { check, group, sleep } from "k6";

const BASE_URL = (__ENV.BASE_URL || "http://host.docker.internal:3000").replace(/\/$/, "");
const STUDENT_EMAIL = __ENV.STUDENT_EMAIL || "aluno@virachave.local";
const STUDENT_PASSWORD = __ENV.STUDENT_PASSWORD || "Aluno123!";
const SIMULATE_SHARED_NAT = __ENV.SIMULATE_SHARED_NAT === "true";

export const options = {
  vus: Number(__ENV.VUS || 40),
  duration: __ENV.DURATION || "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800"],
    checks: ["rate>0.99"],
  },
};

let authenticated = false;

function getClientHeaders(extra = {}) {
  const vuIp = SIMULATE_SHARED_NAT
    ? "203.0.113.10"
    : `203.0.113.${((__VU - 1) % 250) + 1}`;
  return Object.assign(
    {
      "CF-Connecting-IP": vuIp,
    },
    extra,
  );
}

function ensureAuthenticated() {
  if (authenticated) {
    return true;
  }

  // Pequeno escalonamento inicial para evitar tempestade simultânea de bcrypt no t=0
  if (__ITER === 0) {
    sleep((__VU % 10) * 0.08);
  }

  const csrfRes = http.get(`${BASE_URL}/api/auth/csrf`, {
    headers: getClientHeaders(),
  });

  let csrfToken = "";
  try {
    csrfToken = csrfRes.json("csrfToken") || "";
  } catch {
    csrfToken = "";
  }

  const csrfOk = check(csrfRes, {
    "GET /api/auth/csrf returns 200": (r) => r.status === 200,
    "csrfToken present": () => csrfToken.length > 0,
  });
  if (!csrfOk) {
    return false;
  }

  const loginRes = http.post(
    `${BASE_URL}/api/auth/callback/credentials`,
    {
      csrfToken,
      email: STUDENT_EMAIL,
      password: STUDENT_PASSWORD,
      callbackUrl: `${BASE_URL}/app`,
    },
    {
      headers: getClientHeaders({
        Origin: BASE_URL,
        Referer: `${BASE_URL}/login`,
        "X-Auth-Return-Redirect": "1",
      }),
    },
  );

  const loginOk = check(loginRes, {
    "POST /api/auth/callback/credentials returns 200": (r) => r.status === 200,
    "credentials login succeeded without error": (r) => {
      try {
        const redirectUrl = String(r.json("url") || "");
        return redirectUrl.length > 0 && !redirectUrl.includes("error=");
      } catch {
        return false;
      }
    },
  });

  if (loginOk) {
    authenticated = true;
  }
  return loginOk;
}

export default function loadAudit() {
  const baseHeaders = getClientHeaders();

  group("public_static", () => {
    for (const path of ["/", "/termos", "/privacidade", "/api/health"]) {
      const res = http.get(`${BASE_URL}${path}`, { headers: baseHeaders });
      check(res, {
        [`GET ${path} returns 200`]: (r) => r.status === 200,
      });
    }
  });

  sleep(0.2);

  group("student_auth", () => {
    ensureAuthenticated();
  });

  if (authenticated) {
    group("student_portal", () => {
      for (const path of [
        "/app",
        "/app/descobrir",
        "/app/aprender",
        "/app/experimentar",
        "/app/portfolio",
      ]) {
        const res = http.get(`${BASE_URL}${path}`, { headers: baseHeaders });
        check(res, {
          [`GET ${path} returns 200`]: (r) => r.status === 200,
          [`GET ${path} stays authenticated`]: (r) => !r.url.includes("/login"),
        });
      }
    });
  }

  sleep(0.3);
}
