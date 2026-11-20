import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = (__ENV.BASE_URL || "http://host.docker.internal:3000").replace(/\/$/, "");

export const options = {
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || "15s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

export default function smokeTest() {
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    "GET / returns 200": (r) => r.status === 200,
  });

  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    "GET /api/health returns 200": (r) => r.status === 200,
    "GET /api/health status ok": (r) => {
      try {
        return r.json("status") === "ok";
      } catch {
        return false;
      }
    },
  });

  const termosRes = http.get(`${BASE_URL}/termos`);
  check(termosRes, {
    "GET /termos returns 200": (r) => r.status === 200,
  });

  const loginRes = http.get(`${BASE_URL}/login`);
  check(loginRes, {
    "GET /login returns 200": (r) => r.status === 200,
  });

  sleep(0.5);
}
