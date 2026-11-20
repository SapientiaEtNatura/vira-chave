import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
  },
}));

import { GET, dynamic } from "@/app/api/health/route";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses force-dynamic rendering", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("returns 200 ok with Cache-Control no-store when database query succeeds", async () => {
    mocks.queryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const response = await GET();
    const body = await response.json();

    expect(mocks.queryRaw).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({ status: "ok" });
  });

  it("returns 503 degraded with Cache-Control no-store and leaks no error details when database query fails", async () => {
    mocks.queryRaw.mockRejectedValue(new Error("DB password secret"));

    const response = await GET();
    const text = await response.text();
    const body = JSON.parse(text);

    expect(mocks.queryRaw).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({ status: "degraded" });
    expect(text).not.toContain("secret");
    expect(text).not.toContain("DB password");
    expect(text).not.toContain("Error");
  });
});
