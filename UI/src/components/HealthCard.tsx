import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  colorClass?: string;
  loading?: boolean;
}

export function HealthCard({ label, value, icon: Icon, colorClass = "text-success", loading }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 transition-all hover:border-primary/30">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="data-label truncate">{label}</p>
        {loading ? (
          <Skeleton className="h-6 w-16 mt-1" />
        ) : (
          <p className={`text-xl font-semibold font-mono ${colorClass}`}>{value}</p>
        )}
      </div>
    </div>
  );
}
