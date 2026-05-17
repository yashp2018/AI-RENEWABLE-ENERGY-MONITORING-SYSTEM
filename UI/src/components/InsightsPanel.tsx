import { Brain, AlertCircle, AlertTriangle, Info, Wrench, CloudRain, Activity, Zap } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Insight } from "@/lib/aiInsights";

interface Props {
  insights: Insight[];
  loading?: boolean;
}

const severityConfig = {
  info:     { icon: Info,          color: "text-accent",       bg: "bg-accent/10",       border: "border-accent/20" },
  warning:  { icon: AlertTriangle, color: "text-warning",      bg: "bg-warning/10",      border: "border-warning/20" },
  critical: { icon: AlertCircle,   color: "text-destructive",  bg: "bg-destructive/10",  border: "border-destructive/30" },
};

const categoryConfig: Record<string, { icon: typeof Brain; label: string }> = {
  weather:     { icon: CloudRain,     label: "Weather" },
  fault:       { icon: AlertCircle,   label: "Fault" },
  efficiency:  { icon: Activity,      label: "Efficiency" },
  maintenance: { icon: Wrench,        label: "Maintenance" },
  performance: { icon: Zap,           label: "Performance" },
  anomaly:     { icon: AlertTriangle, label: "Anomaly" },
};

export function InsightsPanel({ insights, loading }: Props) {
  const criticalCount = insights.filter((i) => i.severity === "critical").length;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent" />
          <span className="data-label">AI Recommendation Engine</span>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full animate-pulse">
              {criticalCount} Critical
            </span>
          )}
          <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full animate-pulse">
            ● Analyzing
          </span>
        </div>
      </div>

      <ScrollArea className="h-[320px]">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : insights.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Start simulation to generate AI recommendations
          </p>
        ) : (
          <div className="space-y-2">
            {insights.map((insight) => {
              const scfg = severityConfig[insight.severity] ?? severityConfig.info;
              const ccfg = categoryConfig[insight.category ?? "performance"];
              const SIcon = scfg.icon;
              const CIcon = ccfg?.icon ?? Brain;
              return (
                <div
                  key={insight.id}
                  className={`rounded-lg border ${scfg.border} ${scfg.bg} p-3 space-y-1.5 transition-all`}
                >
                  <div className="flex items-center gap-2">
                    <SIcon className={`h-3.5 w-3.5 ${scfg.color} shrink-0`} />
                    <p className="text-xs text-foreground leading-relaxed flex-1">{insight.text}</p>
                    <span className={`shrink-0 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${scfg.bg} ${scfg.color} flex items-center gap-1`}>
                      <CIcon className="h-2.5 w-2.5" />
                      {ccfg?.label}
                    </span>
                  </div>
                  {insight.recommendation && (
                    <p className="text-[10px] text-muted-foreground pl-5">
                      💡 {insight.recommendation}
                    </p>
                  )}
                  <p className="text-[9px] text-muted-foreground font-mono pl-5">
                    {insight.timestamp.toLocaleTimeString()}
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
