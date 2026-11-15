export function RouteLoadingView() {
  return (
    <div
      role="status"
      aria-label="Carregando conteúdo"
      className="space-y-6 py-2"
    >
      <span className="sr-only">Carregando conteúdo...</span>

      <div className="space-y-2.5">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-[var(--bg-surface-subtle)]" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-[var(--bg-surface-subtle)]" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-xs"
          >
            <div className="h-5 w-32 animate-pulse rounded-md bg-[var(--bg-surface-subtle)]" />
            <div className="mt-3 space-y-2">
              <div className="h-3.5 w-full animate-pulse rounded bg-[var(--bg-surface-subtle)]" />
              <div className="h-3.5 w-4/5 animate-pulse rounded bg-[var(--bg-surface-subtle)]" />
            </div>
            <div className="mt-5 h-9 w-28 animate-pulse rounded-lg bg-[var(--bg-surface-subtle)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
