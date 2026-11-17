"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold">Algo deu errado</h1>
          <p className="mt-2 text-sm text-slate-600">
            Ocorreu um erro inesperado ao processar esta página.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
