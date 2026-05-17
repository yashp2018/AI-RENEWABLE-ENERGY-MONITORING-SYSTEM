import { format } from "date-fns";

interface LiveIndicatorProps {
  lastUpdated: Date;
}

export function LiveIndicator({ lastUpdated }: LiveIndicatorProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
        <div className="relative w-2 h-2">
          <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
          <div className="relative w-2 h-2 rounded-full bg-primary" />
        </div>
        <span className="text-xs font-medium text-primary">LIVE</span>
      </div>
      <span className="text-xs text-muted-foreground font-mono">
        Last updated: {format(lastUpdated, "HH:mm:ss")}
      </span>
    </div>
  );
}
