import { PublicShell } from "@/components/layout/PublicShell";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PublicShell dashboardHref={null}>{children}</PublicShell>;
}
