import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Wrench, AlertCircle, AlertTriangle, Clock, CheckCircle2,
  TrendingDown, TrendingUp, Minus, Calendar, Thermometer, Wind, Cpu,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ApiMaintenance } from "@/hooks/useApiData";
import type { MaintenanceAlert, DegradationAnalysis } from "@/lib/predictiveMaintenance";

interface Props {
  // From backend API
  apiMaintenance: ApiMaintenance[];
  // From local simulation
  localAlerts: MaintenanceAlert[];
  degradation: DegradationAnalysis[];
  efficiencyHistory: Record<string, number[]>;
  panelNames: Record<string, string>; // panelId → name
}

const priorityConfig = {
  critical: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/40", icon: AlertCircle,   dot: "bg-destructive" },
  high:     { color: "text-warning",     bg: "bg-warning/10",     border: "border-warning/30",     icon: AlertTriangle, dot: "bg-warning" },
  medium:   { color: "text-accent",      bg: "bg-accent/10",      border: "border-accent/20",      icon: Clock,         dot: "bg-accent" },
  low:      { color: "text-success",     bg: "bg-success/10",     border: "border-success/20",     icon: CheckCircle2,  dot: "bg-success" },
};

const statusConfig = {
  healthy:               { color: "text-success",    bg: "bg-success/10",    border: "border-success/20",    label: "Healthy" },
  maintenance_required:  { color: "text-warning",    bg: "bg-warning/10",    border: "border-warning/30",    label: "Maintenance Required" },
  critical_maintenance:  { color: "text-destructive",bg: "bg-destructive/10",border: "border-destructive/40",label: "Critical Maintenance" },
};

const typeIcons: Record<string, typeof Wrench> = {
  cleaning:    Wind,
  overheating: Thermometer,
  inspection:  Wrench,
  replacement: Cpu,
  overdue:     AlertCircle,
};

const trendConfig = {
  improving: { icon: TrendingUp,   color: "text-success",          label: "Improving" },
  stable:    { icon: Minus,        color: "text-muted-foreground", label: "Stable" },
  degrading: { icon: TrendingDown, color: "text-warning",          label: "Degrading" },
  critical:  { icon: TrendingDown, color: "text-destructive",      label: "Critical" },
};

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

const CHART_STYLE = {
  backgroundColor: "hsl(222 22% 9%)",
  border: "1px solid hsl(222 16% 16%)",
  borderRadius: "8px",
  fontSize: "11px",
  color: "hsl(210 20% 92%)",
};

export function PredictiveMaintenanceDashboard({
  apiMaintenance,
  localAlerts,
  degradation,
  efficiencyHistory,
  panelNames,
}: Props) {
  // Merge API + local alerts, deduplicate by message prefix, sort by priority
  const allAlerts = useMemo(() => {
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const apiItems = apiMaintenance.map((m) => ({
      id: `api-${m.id}`,
      panelId: m.panelId,
      panelName: panelNames[m.panelId] ?? m.panelId,
      type: m.type,
      priority: m.priority as "critical" | "high" | "medium" | "low",
      status: m.status,
      message: m.message,
      recommendation: m.recommendation,
      scheduledDate: m.scheduledDate,
      timestamp: m.createdAt,
      source: "backend" as const,
    }));
    const localItems = localAlerts.map((a) => ({
      id: a.id,
      panelId: a.panelId,
      panelName: a.panelName,
      type: a.type,
      priority: a.priority,
      status: a.priority === "critical" ? "critical_maintenance" as const
             : a.priority === "high"    ? "maintenance_required" as const
             : "healthy" as const,
      message: a.message,
      recommendation: a.recommendation,
      scheduledDate: a.scheduledDate.toISOString(),
      timestamp: a.timestamp.toISOString(),
      source: "local" as const,
    }));
    return [...apiItems, ...localItems]
      .sort((a, b) => order[a.priority] - order[b.priority])
      .slice(0, 20);
  }, [apiMaintenance, localAlerts, panelNames]);

  const criticalCount = allAlerts.filter((a) => a.priority === "critical").length;

  // Build efficiency trend chart data
  const chartData = useMemo(() => {
    const maxLen = Math.max(...Object.values(efficiencyHistory).map((h) => h.length), 0);
    return Array.from({ length: Math.min(maxLen, 30) }, (_, i) => {
      const point: Record<string, number | string> = { idx: i };
      Object.entries(efficiencyHistory).forEach(([id, hist]) => {
        point[panelNames[id] ?? id] = hist[i] ?? 0;
      });
      return point;
    });
  }, [efficiencyHistory, panelNames]);

  const panelIds = Object.keys(efficiencyHistory);
  const COLORS = ["hsl(160 84% 39%)", "hsl(190 80% 45%)", "hsl(45 93% 47%)"];

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
            <Wrench className="h-4 w-4 text-warning" />
          </div>
          <div>
            <span className="data-label">Predictive Maintenance System</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">AI-powered maintenance prediction & scheduling</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full animate-pulse">
              <AlertCircle className="h-3 w-3" /> {criticalCount} Critical
            </span>
          )}
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {allAlerts.length} alerts
          </span>
        </div>
      </div>

      {/* Degradation status cards per panel */}
      {degradation.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {degradation.map((d, i) => {
            const trend = trendConfig[d.trend];
            const TrendIcon = trend.icon;
            const effPct = Math.min(100, Math.max(0, d.currentEfficiency));
            const barColor =
              d.trend === "critical"  ? "bg-destructive" :
              d.trend === "degrading" ? "bg-warning" :
              d.trend === "improving" ? "bg-success" : "bg-accent";
            const cardBorder =
              d.trend === "critical"  ? "border-destructive/30 bg-destructive/5" :
              d.trend === "degrading" ? "border-warning/30 bg-warning/5" :
              d.trend === "improving" ? "border-success/20 bg-success/5" : "border-border bg-muted/30";

            return (
              <div key={d.panelId} className={`rounded-lg border ${cardBorder} p-3 space-y-2.5`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    {panelNames[d.panelId] ?? d.panelId.replace("panel-", "Panel ")}
                  </span>
                  <div className={`flex items-center gap-0.5 ${trend.color}`}>
                    <TrendIcon className="h-3 w-3" />
                    <span className="text-[9px] font-semibold">{trend.label}</span>
                  </div>
                </div>

                {/* Efficiency progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Efficiency</span>
                    <span className={`font-mono font-bold ${trend.color}`}>{effPct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${Math.min(100, (effPct / 25) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Maintenance countdown */}
                {d.trend !== "stable" && d.trend !== "improving" && (
                  <div className="flex items-center gap-1 rounded bg-muted/50 px-2 py-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground">
                      Maint. in <span className={`font-bold ${trend.color}`}>~{d.predictedDaysToMaintenance}d</span>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Efficiency trend chart */}
      {chartData.length > 2 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Long-term Efficiency Trend</p>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <defs>
                  {panelIds.map((id, i) => (
                    <linearGradient key={id} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORS[i]} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={COLORS[i]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 16% 16%)" />
                <XAxis dataKey="idx" tick={{ fill: "hsl(215 14% 48%)", fontSize: 9 }} stroke="hsl(222 16% 16%)" />
                <YAxis tick={{ fill: "hsl(215 14% 48%)", fontSize: 9 }} stroke="hsl(222 16% 16%)" unit="%" />
                <Tooltip contentStyle={CHART_STYLE} />
                {panelIds.map((id, i) => (
                  <Area
                    key={id}
                    type="monotone"
                    dataKey={panelNames[id] ?? id}
                    stroke={COLORS[i]}
                    fill={`url(#grad-${i})`}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Maintenance schedule reminders */}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Maintenance Schedule</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { days: 15, label: "15-Day Check",  color: "text-accent",      bg: "bg-accent/10",      border: "border-accent/20" },
            { days: 30, label: "30-Day Clean",  color: "text-warning",     bg: "bg-warning/10",     border: "border-warning/20" },
            { days: 60, label: "60-Day Inspect",color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
          ].map((item) => (
            <div key={item.days} className={`rounded-lg border ${item.border} ${item.bg} p-2.5 text-center`}>
              <Calendar className={`h-4 w-4 ${item.color} mx-auto mb-1`} />
              <p className={`text-sm font-bold font-mono ${item.color}`}>{item.days}d</p>
              <p className="text-[9px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alert list */}
      <ScrollArea className="h-[220px]">
        {allAlerts.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 p-3">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <p className="text-xs text-success font-medium">All panels within maintenance schedule — system healthy</p>
          </div>
        ) : (
          <div className="space-y-2">
            {allAlerts.map((alert) => {
              const pcfg = priorityConfig[alert.priority];
              const scfg = statusConfig[alert.status] ?? statusConfig.healthy;
              const PIcon = pcfg.icon;
              const TIcon = typeIcons[alert.type] ?? Wrench;
              const daysLeft = daysUntil(alert.scheduledDate);
              return (
                <div key={alert.id} className={`rounded-lg border ${pcfg.border} ${pcfg.bg} p-3 space-y-1.5`}>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${pcfg.dot} ${alert.priority === "critical" ? "animate-pulse" : ""}`} />
                    <TIcon className={`h-3.5 w-3.5 ${pcfg.color} shrink-0`} />
                    <span className="text-xs font-semibold text-foreground flex-1">{alert.panelName}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${scfg.bg} ${scfg.color} border ${scfg.border}`}>
                      {scfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-foreground">{alert.message}</p>
                  <p className="text-[10px] text-muted-foreground">💡 {alert.recommendation}</p>
                  <div className="flex items-center justify-between">
                    {daysLeft !== null && (
                      <span className={`text-[10px] font-mono font-semibold ${daysLeft <= 0 ? "text-destructive" : daysLeft <= 7 ? "text-warning" : "text-muted-foreground"}`}>
                        {daysLeft <= 0 ? `⚠ Overdue by ${Math.abs(daysLeft)}d` : `📅 Due in ${daysLeft}d`}
                      </span>
                    )}
                    <span className="text-[9px] text-muted-foreground font-mono ml-auto">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
