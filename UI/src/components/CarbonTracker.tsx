import { Leaf, TreePine, Zap, Wind } from "lucide-react";
import type { CarbonMetrics } from "@/lib/carbonTracker";
import { formatCarbonValue } from "@/lib/carbonTracker";

interface Props {
  metrics: CarbonMetrics;
  totalEnergyWh: number;
}

export function CarbonTracker({ metrics, totalEnergyWh }: Props) {
  const items = [
    {
      icon: Leaf,
      label: "CO₂ Avoided",
      value: formatCarbonValue(metrics.co2SavedKg),
      sub: "carbon emissions prevented",
      color: "text-success",
      bg: "bg-success/10",
      border: "border-success/20",
    },
    {
      icon: TreePine,
      label: "Tree Equivalent",
      value: metrics.treesEquivalent.toFixed(1),
      sub: "trees absorbing same CO₂/year",
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      icon: Zap,
      label: "Energy Generated",
      value: metrics.totalEnergyKwh >= 1
        ? `${metrics.totalEnergyKwh.toFixed(2)} kWh`
        : `${totalEnergyWh.toFixed(1)} Wh`,
      sub: "clean solar energy produced",
      color: "text-warning",
      bg: "bg-warning/10",
      border: "border-warning/20",
    },
    {
      icon: Wind,
      label: "Coal Avoided",
      value: `${metrics.coalAvoidedKg.toFixed(2)} kg`,
      sub: "coal not burned",
      color: "text-accent",
      bg: "bg-accent/10",
      border: "border-accent/20",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="h-4 w-4 text-success" />
          <span className="data-label">Carbon Savings Tracker</span>
        </div>
        <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
          🌍 Environmental Impact
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`rounded-lg border ${item.border} ${item.bg} p-3 space-y-1`}>
              <div className="flex items-center gap-1.5">
                <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </span>
              </div>
              <p className={`text-xl font-bold font-mono ${item.color}`}>{item.value}</p>
              <p className="text-[10px] text-muted-foreground">{item.sub}</p>
            </div>
          );
        })}
      </div>

      {metrics.homeDaysEquivalent > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
          <span className="text-base">🏠</span>
          <p className="text-xs text-muted-foreground">
            Equivalent to powering an average home for{" "}
            <span className="text-foreground font-semibold">
              {metrics.homeDaysEquivalent < 1
                ? `${(metrics.homeDaysEquivalent * 24).toFixed(1)} hours`
                : `${metrics.homeDaysEquivalent.toFixed(2)} days`}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
