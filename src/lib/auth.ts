import { cache } from "react";
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import "next-auth/jwt";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { AUDIT_ACTIONS, recordAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      institutionId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
    institutionId: string | null;
    tokenVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    institutionId: string | null;
    tokenVersion?: number;
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            institutionId: true,
            status: true,
            tokenVersion: true,
          },
        });

        if (!user || user.status !== "ACTIVE") {
          await recordAuditLog({
            action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
            targetType: "User",
            targetId: user?.id ?? null,
            metadata: {
              reason: !user ? "user_not_found" : "account_inactive",
            },
          });
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          await recordAuditLog({
            action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
            targetType: "User",
            targetId: user.id,
            metadata: {
              reason: "invalid_password",
            },
          });
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          institutionId: user.institutionId,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name ?? null;
        token.role = user.role;
        token.institutionId = user.institutionId ?? null;
        token.tokenVersion = user.tokenVersion ?? 1;
        return token;
      }

      if (!token.id) {
        return null;
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: token.id },
        select: {
          name: true,
          status: true,
          tokenVersion: true,
          role: true,
          institutionId: true,
        },
      });

      if (
        !dbUser ||
        dbUser.status !== "ACTIVE" ||
        dbUser.tokenVersion !== (token.tokenVersion ?? 1)
      ) {
        return null;
      }

      token.name = dbUser.name;
      token.role = dbUser.role;
      token.institutionId = dbUser.institutionId ?? null;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name =
          typeof token.name === "string"
            ? token.name
            : (session.user.name ?? null);
        session.user.role = token.role;
        session.user.institutionId = token.institutionId ?? null;
      }
      return session;
    },
  },
});

/** Memoriza a leitura da sessão por requisição HTTP, preservando validação ativa no banco. */
export const getSession = cache(() => auth());
