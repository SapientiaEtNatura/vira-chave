import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";

export interface AuthenticatedUserContext {
  userId: string;
  role: Role;
  institutionId: string | null;
}

export type RoleAccessResult =
  | {
      authorized: true;
      user: AuthenticatedUserContext;
    }
  | {
      authorized: false;
      status: 401 | 403;
      error: string;
    };

export const STUDENT_PORTAL_ROLES: Role[] = [Role.ESTUDANTE, Role.ADMIN];
export const EDUCATOR_PORTAL_ROLES: Role[] = [Role.EDUCADOR, Role.ADMIN];

export function getHomeRouteForRole(role: Role): string {
  switch (role) {
    case Role.ESTUDANTE:
      return "/app";
    case Role.EDUCADOR:
      return "/educador";
    case Role.ADMIN:
      return "/admin";
  }
}

export function checkRoleAccess(
  session: Session | null,
  allowedRoles: Role[],
): RoleAccessResult {
  if (!session?.user?.id || !session.user.role) {
    return {
      authorized: false,
      status: 401,
      error: "Não autenticado.",
    };
  }

  if (!allowedRoles.includes(session.user.role)) {
    return {
      authorized: false,
      status: 403,
      error: "Você não tem permissão para acessar este recurso.",
    };
  }

  return {
    authorized: true,
    user: {
      userId: session.user.id,
      role: session.user.role,
      institutionId: session.user.institutionId ?? null,
    },
  };
}

export async function requireRole(
  allowedRoles: Role[],
): Promise<AuthenticatedUserContext> {
  const session = await auth();
  const access = checkRoleAccess(session, allowedRoles);

  if (!access.authorized) {
    if (access.status === 401 || !session?.user?.role) {
      redirect("/login");
    }
    redirect(getHomeRouteForRole(session.user.role));
  }

  return access.user;
}

export async function requireApiRole(
  allowedRoles: Role[],
): Promise<AuthenticatedUserContext | NextResponse> {
  const session = await auth();
  const access = checkRoleAccess(session, allowedRoles);

  if (!access.authorized) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  return access.user;
}
