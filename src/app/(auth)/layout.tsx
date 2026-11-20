import { PublicShell } from "@/components/layout/PublicShell";
import { getSession } from "@/lib/auth";
import { getHomeRouteForRole } from "@/lib/rbac";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const dashboardHref = session?.user?.role
    ? getHomeRouteForRole(session.user.role)
    : null;

  return <PublicShell dashboardHref={dashboardHref}>{children}</PublicShell>;
}
