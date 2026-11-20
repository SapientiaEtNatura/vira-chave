import { Role } from "@prisma/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { signOut } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authUser = await requireRole([Role.ADMIN]);

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <AdminShell userName={authUser.name ?? undefined} signOutAction={handleSignOut}>
      {children}
    </AdminShell>
  );
}
