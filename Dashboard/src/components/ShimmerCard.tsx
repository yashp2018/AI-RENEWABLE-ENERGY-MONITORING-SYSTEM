export function ShimmerCard() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-7 w-32 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
        </div>
        <div className="w-10 h-10 rounded-lg bg-muted" />
      </div>
    </div>
  );
}
