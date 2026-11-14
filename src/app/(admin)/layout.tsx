import Link from "next/link";
import { Role } from "@prisma/client";
import { BookOpen, Building2, LogOut, ShieldCheck } from "lucide-react";
import { signOut } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireRole([Role.ADMIN]);

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
              href="/admin/conteudo"
              className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
                VC
              </span>
              <span>VIRA CHAVE</span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Admin
            </span>
          </div>

          <nav
            aria-label="Navegação administrativa"
            className="flex items-center gap-1 sm:gap-2"
          >
            <Link
              href="/admin/conteudo"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-indigo-700"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span>Conteúdo</span>
            </Link>

            <Link
              href="/admin/instituicoes"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-indigo-700"
            >
              <Building2 className="h-4 w-4" aria-hidden="true" />
              <span>Instituições</span>
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
