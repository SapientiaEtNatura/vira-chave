import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@prisma/client";
import { RegistrationError, registerUser } from "@/lib/auth/register";

const { authMock, prismaMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    macroArea: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    discoveryQuestion: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    track: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    courseItem: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    challenge: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    institution: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

describe("Área Admin — RBAC e Gestão de Instituições", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("test_non_admin_cannot_access_admin_endpoints", async () => {
    const contentRoutes = await import("@/app/api/admin/content/route");
    const institutionRoutes = await import("@/app/api/admin/institutions/route");

    const invokeAllEndpoints = async () => {
      const requests = [
        contentRoutes.GET(),
        contentRoutes.POST(
          new Request("http://localhost/api/admin/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: "macroArea",
              name: "Tecnologia",
              slug: "tecnologia",
              description: "Área de tecnologia",
            }),
          }),
        ),
        contentRoutes.PATCH(
          new Request("http://localhost/api/admin/content", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: "macroArea",
              id: "ma-1",
              name: "Tecnologia Atualizada",
            }),
          }),
        ),
        contentRoutes.DELETE(
          new Request("http://localhost/api/admin/content", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: "macroArea",
              id: "ma-1",
            }),
          }),
        ),
        institutionRoutes.GET(),
        institutionRoutes.POST(
          new Request("http://localhost/api/admin/institutions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Escola Teste" }),
          }),
        ),
        institutionRoutes.PATCH(
          new Request("http://localhost/api/admin/institutions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: "institution",
              id: "inst-1",
              active: false,
            }),
          }),
        ),
      ];

      return Promise.all(requests);
    };

    // Sem sessão -> 401
    authMock.mockResolvedValue(null);
    const unauthenticatedResponses = await invokeAllEndpoints();
    for (const res of unauthenticatedResponses) {
      expect(res.status).toBe(401);
    }

    // ESTUDANTE -> 403
    authMock.mockResolvedValue({
      user: { id: "stu-1", role: Role.ESTUDANTE, institutionId: "inst-1" },
    });
    const studentResponses = await invokeAllEndpoints();
    for (const res of studentResponses) {
      expect(res.status).toBe(403);
    }

    // EDUCADOR -> 403
    authMock.mockResolvedValue({
      user: { id: "edu-1", role: Role.EDUCADOR, institutionId: "inst-1" },
    });
    const educatorResponses = await invokeAllEndpoints();
    for (const res of educatorResponses) {
      expect(res.status).toBe(403);
    }
  });

  it("test_deactivating_institution_blocks_new_signups_only", async () => {
    const institutionRoutes = await import("@/app/api/admin/institutions/route");

    authMock.mockResolvedValue({
      user: { id: "admin-1", role: Role.ADMIN, institutionId: null },
    });

    prismaMock.institution.update.mockResolvedValue({
      id: "inst-1",
      name: "Escola Estadual Modelo",
      institutionCode: "INST-MOD1",
      active: false,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      _count: { users: 4, classrooms: 2 },
    });

    const response = await institutionRoutes.PATCH(
      new Request("http://localhost/api/admin/institutions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "institution",
          id: "inst-1",
          active: false,
        }),
      }),
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      institution: { id: string; active: boolean };
    };
    expect(payload.institution.id).toBe("inst-1");
    expect(payload.institution.active).toBe(false);

    expect(prismaMock.institution.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "inst-1" },
        data: { active: false },
      }),
    );
    // Contas existentes não têm status alterado ao desativar a instituição
    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();

    // Novo cadastro de educador com o código da instituição desativada é bloqueado
    const tx = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
      },
      institution: {
        findUnique: vi.fn().mockResolvedValue({
          id: "inst-1",
          active: false,
        }),
      },
      consentRecord: {
        createMany: vi.fn(),
      },
    };
    const registerPrismaMock = {
      $transaction: vi.fn(async (cb: (client: typeof tx) => Promise<unknown>) =>
        cb(tx),
      ),
    };

    await expect(
      registerUser(
        {
          role: "EDUCADOR",
          name: "Professor Novo",
          email: "novo.prof@escola.edu.br",
          password: "Password123!",
          institutionCode: "INST-MOD1",
          acceptedTerms: true,
          acceptedPrivacy: true,
          acceptedSigilo: true,
        },
        registerPrismaMock as never,
      ),
    ).rejects.toMatchObject({
      name: "RegistrationError",
      code: "INVALID_INSTITUTION_CODE",
      status: 400,
    } satisfies Partial<RegistrationError>);
    expect(tx.user.create).not.toHaveBeenCalled();
  });

  it("test_admin_content_rejects_non_http_external_urls", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
        institutionId: null,
      },
    });

    const { POST, PATCH } = await import("@/app/api/admin/content/route");

    const postResponse = await POST(
      new Request("http://localhost/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "courseItem",
          trackId: "track-1",
          title: "Curso XSS",
          providerName: "Teste",
          externalUrl: "javascript:alert(1)",
          order: 1,
        }),
      }),
    );

    expect(postResponse.status).toBe(400);

    const patchResponse = await PATCH(
      new Request("http://localhost/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "courseItem",
          id: "course-1",
          externalUrl: "data:text/html,<script>alert(1)</script>",
        }),
      }),
    );

    expect(patchResponse.status).toBe(400);
    expect(prismaMock.courseItem.create).not.toHaveBeenCalled();
    expect(prismaMock.courseItem.update).not.toHaveBeenCalled();
  });
});
