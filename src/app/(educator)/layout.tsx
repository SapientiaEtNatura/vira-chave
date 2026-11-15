import { Role } from "@prisma/client";
import { AppNav, type AppNavItem } from "@/components/layout/AppNav";
import { signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

const navItems: AppNavItem[] = [
  { href: "/educador", label: "Turmas", icon: "users" },
];

export default async function EducatorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authUser = await requireRole([Role.EDUCADOR]);
  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { name: true },
  });

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-canvas)] text-[var(--ink-primary)] lg:flex-row">
      <AppNav
        homeHref="/educador"
        subtitle="Educador"
        userName={user?.name ?? undefined}
        items={navItems}
        signOutAction={handleSignOut}
      />

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
