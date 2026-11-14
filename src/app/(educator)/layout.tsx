import Link from "next/link";
import { Role } from "@prisma/client";
import { GraduationCap, LogOut, Users } from "lucide-react";
import { signOut } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

export default async function EducatorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireRole([Role.EDUCADOR]);

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/educador"
              className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
                VC
              </span>
              <span>VIRA CHAVE</span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
              Educador
            </span>
          </div>

          <nav
            aria-label="Navegação do educador"
            className="flex items-center gap-2"
          >
            <Link
              href="/educador"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-indigo-700"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              <span>Turmas</span>
            </Link>

            <form action={handleSignOut}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Sair</span>
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
