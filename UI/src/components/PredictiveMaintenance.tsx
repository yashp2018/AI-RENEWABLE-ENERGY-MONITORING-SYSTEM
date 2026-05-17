import { Wrench, AlertTriangle, AlertCircle, Clock, CheckCircle2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MaintenanceAlert, DegradationAnalysis } from "@/lib/predictiveMaintenance";

interface Props {
  alerts: MaintenanceAlert[];
  degradation: DegradationAnalysis[];
}

const priorityConfig = {
  critical: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", icon: AlertCircle },
  high:     { color: "text-warning",     bg: "bg-warning/10",     border: "border-warning/30",     icon: AlertTriangle },
  medium:   { color: "text-accent",      bg: "bg-accent/10",      border: "border-accent/20",      icon: Clock },
  low:      { color: "text-success",     bg: "bg-success/10",     border: "border-success/20",     icon: CheckCircle2 },
};

const trendConfig = {
  improving: { icon: TrendingUp,   color: "text-success",     label: "Improving" },
  stable:    { icon: Minus,        color: "text-muted-foreground", label: "Stable" },
  degrading: { icon: TrendingDown, color: "text-warning",     label: "Degrading" },
  critical:  { icon: TrendingDown, color: "text-destructive", label: "Critical" },
};

export function PredictiveMaintenance({ alerts, degradation }: Props) {
  const criticalCount = alerts.filter((a) => a.priority === "critical").length;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-warning" />
          <span className="data-label">Predictive Maintenance</span>
        </div>
        {criticalCount > 0 && (
          <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full animate-pulse">
            {criticalCount} Critical
          </span>
        )}
      </div>

      {/* Degradation trend per panel */}
      {degradation.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {degradation.map((d) => {
            const trend = trendConfig[d.trend];
            const TrendIcon = trend.icon;
            const effPct = Math.min(100, Math.max(0, d.currentEfficiency));
            const barColor =
              d.trend === "critical"  ? "bg-destructive" :
              d.trend === "degrading" ? "bg-warning" :
              d.trend === "improving" ? "bg-success" : "bg-accent";

            return (
              <div key={d.panelId} className="rounded-lg bg-muted/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {d.panelId.replace("panel-", "Panel ")}
                  </span>
                  <div className={`flex items-center gap-0.5 ${trend.color}`}>
                    <TrendIcon className="h-3 w-3" />
                    <span className="text-[9px] font-medium">{trend.label}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Efficiency</span>
                    <span className={`font-mono font-semibold ${trend.color}`}>{effPct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${effPct}%` }}
                    />
                  </div>
                </div>
                {d.trend !== "stable" && d.trend !== "improving" && (
                  <p className="text-[9px] text-muted-foreground">
                    Maint. in ~{d.predictedDaysToMaintenance}d
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Maintenance alerts */}
      <ScrollArea className="h-[200px]">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 p-3">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <p className="text-xs text-success font-medium">All panels within maintenance schedule</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const cfg = priorityConfig[alert.priority];
              const Icon = cfg.icon;
              return (
                <div key={alert.id} className={`rounded-lg border ${cfg.border} ${cfg.bg} p-3 space-y-1`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${cfg.color} shrink-0`} />
                    <span className={`text-xs font-semibold ${cfg.color}`}>{alert.panelName}</span>
                    <span className={`ml-auto text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                      {alert.priority}
                    </span>
                  </div>
                  <p className="text-xs text-foreground">{alert.message}</p>
                  <p className="text-[10px] text-muted-foreground">💡 {alert.recommendation}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {alert.timestamp.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
