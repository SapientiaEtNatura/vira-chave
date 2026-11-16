import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import "next-auth/jwt";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
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
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    institutionId: string | null;
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
          },
        });

        if (!user || user.status !== "ACTIVE") {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          institutionId: user.institutionId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.institutionId = user.institutionId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.institutionId = token.institutionId ?? null;
      }
      return session;
    },
  },
});
