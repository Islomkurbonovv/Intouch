// Instant skeleton shown while the dashboard route (re)loads — e.g. on a
// month/period switch. Pure markup, no data fetching.
export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-[170px] animate-pulse rounded-lg bg-muted" />
            <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
            <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Tabs */}
        <div className="mb-4 h-10 w-72 animate-pulse rounded-xl bg-muted" />

        {/* ~8 KPI placeholders */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-3">
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-7 w-20 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
              </div>
            </div>
          ))}
        </div>

        {/* Table placeholder */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-border/70 bg-card">
          <div className="border-b border-border/60 bg-muted/50 p-3">
            <div className="h-4 w-full max-w-3xl animate-pulse rounded bg-muted" />
          </div>
          <div className="divide-y divide-border/60">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3">
                <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                <div className="h-5 flex-1 animate-pulse rounded bg-muted/70" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
