import { PublicShell } from "@/components/layout/PublicShell";
import { auth } from "@/lib/auth";
import { getHomeRouteForRole } from "@/lib/rbac";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const dashboardHref = session?.user?.role
    ? getHomeRouteForRole(session.user.role)
    : null;

  return <PublicShell dashboardHref={dashboardHref}>{children}</PublicShell>;
}
