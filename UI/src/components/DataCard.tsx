import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  unit: string;
  icon: LucideIcon;
  accentClass?: string;
}

export function DataCard({ label, value, unit, icon: Icon, accentClass = "text-accent" }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30">
      <div className="flex items-center justify-between mb-3">
        <span className="data-label">{label}</span>
        <Icon className={`h-5 w-5 ${accentClass}`} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`data-value ${accentClass}`}>{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
