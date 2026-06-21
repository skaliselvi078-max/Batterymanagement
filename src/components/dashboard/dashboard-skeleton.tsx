export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl p-5 glass-card"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-8 w-32 bg-muted rounded" />
              </div>
              <div className="h-11 w-11 bg-muted rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent entries */}
      <div className="rounded-2xl glass-card overflow-hidden">
        <div className="p-5 border-b border-border flex justify-between">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="h-5 w-16 bg-muted rounded" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-4 w-16 bg-muted rounded" />
              <div className="h-5 w-16 bg-muted rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
