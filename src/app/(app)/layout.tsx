import Link from "next/link";
import { Role } from "@prisma/client";
import {
  BookOpen,
  Compass,
  FolderKanban,
  Home,
  LogOut,
  Rocket,
  UserCircle,
} from "lucide-react";
import { signOut } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

const navItems = [
  { href: "/app", label: "Início", icon: Home },
  { href: "/app/descobrir", label: "Descobrir", icon: Compass },
  { href: "/app/aprender", label: "Aprender", icon: BookOpen },
  { href: "/app/experimentar", label: "Experimentar", icon: Rocket },
  { href: "/app/portfolio", label: "Portfólio", icon: FolderKanban },
  { href: "/app/conta", label: "Conta", icon: UserCircle },
];

export default async function StudentAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireRole([Role.ESTUDANTE]);

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/app"
            className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
              VC
            </span>
            <span>VIRA CHAVE</span>
          </Link>

          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-1"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-indigo-700"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <form action={handleSignOut}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Sair</span>
            </button>
          </form>
        </div>

        <nav
          aria-label="Navegação móvel"
          className="flex md:hidden items-center gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-indigo-700"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
