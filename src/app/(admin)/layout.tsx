import { Role } from "@prisma/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authUser = await requireRole([Role.ADMIN]);
  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: { name: true },
  });

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <AdminShell userName={user?.name ?? undefined} signOutAction={handleSignOut}>
      {children}
    </AdminShell>
  );
}
