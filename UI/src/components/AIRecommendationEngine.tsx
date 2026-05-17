import { useState } from "react";
import {
  Brain, AlertCircle, AlertTriangle, Info,
  Wind, Wrench, Thermometer, Cpu, Sun, Zap,
  ChevronDown, ChevronUp, Clock,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiRecommendation } from "@/hooks/useApiData";
import type { Insight } from "@/lib/aiInsights";

interface Props {
  // From backend
  apiRecommendations: ApiRecommendation[];
  // From local AI engine
  localInsights: Insight[];
  loading?: boolean;
}

const severityConfig = {
  low:      { icon: Info,          color: "text-success",     bg: "bg-success/10",     border: "border-success/20",    dot: "bg-success" },
  info:     { icon: Info,          color: "text-accent",      bg: "bg-accent/10",      border: "border-accent/20",     dot: "bg-accent" },
  medium:   { icon: AlertTriangle, color: "text-warning",     bg: "bg-warning/10",     border: "border-warning/20",    dot: "bg-warning" },
  warning:  { icon: AlertTriangle, color: "text-warning",     bg: "bg-warning/10",     border: "border-warning/20",    dot: "bg-warning" },
  critical: { icon: AlertCircle,   color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30",dot: "bg-destructive" },
};

const recTypeConfig: Record<string, { icon: typeof Brain; label: string; color: string }> = {
  clean_panel:        { icon: Wind,        label: "Clean Panel",       color: "text-accent" },
  check_wiring:       { icon: Wrench,      label: "Check Wiring",      color: "text-warning" },
  reduce_overheating: { icon: Thermometer, label: "Reduce Overheating",color: "text-destructive" },
  replace_hardware:   { icon: Cpu,         label: "Replace Hardware",  color: "text-destructive" },
  improve_exposure:   { icon: Sun,         label: "Improve Exposure",  color: "text-primary" },
  check_inverter:     { icon: Zap,         label: "Check Inverter",    color: "text-warning" },
};

const categoryConfig: Record<string, { icon: typeof Brain; label: string }> = {
  weather:     { icon: Wind,         label: "Weather" },
  fault:       { icon: AlertCircle,  label: "Fault" },
  efficiency:  { icon: Zap,          label: "Efficiency" },
  maintenance: { icon: Wrench,       label: "Maintenance" },
  performance: { icon: Brain,        label: "Performance" },
  anomaly:     { icon: AlertTriangle,label: "Anomaly" },
};

type Tab = "live" | "backend" | "history";

export function AIRecommendationEngine({ apiRecommendations, localInsights, loading }: Props) {
  const [tab, setTab] = useState<Tab>("live");
  const [showAll, setShowAll] = useState(false);

  const criticalLocal    = localInsights.filter((i) => i.severity === "critical").length;
  const criticalBackend  = apiRecommendations.filter((r) => r.severity === "critical").length;
  const totalCritical    = criticalLocal + criticalBackend;

  const displayedLocal   = showAll ? localInsights : localInsights.slice(0, 6);
  const displayedBackend = showAll ? apiRecommendations : apiRecommendations.slice(0, 6);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
            <Brain className="h-4 w-4 text-accent" />
          </div>
          <div>
            <span className="data-label">AI Recommendation Engine</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">Intelligent analysis & dynamic recommendations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalCritical > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full animate-pulse">
              <AlertCircle className="h-3 w-3" /> {totalCritical} Critical
            </span>
          )}
          <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full animate-pulse">
            ● Analyzing
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
        {([
          { id: "live",    label: "Live AI",   count: localInsights.length },
          { id: "backend", label: "Backend",   count: apiRecommendations.length },
          { id: "history", label: "History",   count: apiRecommendations.length },
        ] as { id: Tab; label: string; count: number }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
              tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[9px] font-bold px-1 rounded-full ${tab === t.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted-foreground/20"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <ScrollArea className="h-[340px]">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : tab === "live" ? (
          localInsights.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Brain className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground text-center">
                Start simulation to generate live AI recommendations
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedLocal.map((insight) => {
                const scfg = severityConfig[insight.severity] ?? severityConfig.info;
                const ccfg = categoryConfig[insight.category ?? "performance"];
                const SIcon = scfg.icon;
                const CIcon = ccfg?.icon ?? Brain;
                return (
                  <div key={insight.id} className={`rounded-lg border ${scfg.border} ${scfg.bg} p-3 space-y-1.5`}>
                    <div className="flex items-start gap-2">
                      <div className={`h-2 w-2 rounded-full ${scfg.dot} shrink-0 mt-1.5 ${insight.severity === "critical" ? "animate-pulse" : ""}`} />
                      <SIcon className={`h-3.5 w-3.5 ${scfg.color} shrink-0 mt-0.5`} />
                      <p className="text-xs text-foreground leading-relaxed flex-1">{insight.text}</p>
                      <span className={`shrink-0 text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5 ${scfg.bg} ${scfg.color}`}>
                        <CIcon className="h-2.5 w-2.5" />
                        {ccfg?.label}
                      </span>
                    </div>
                    {insight.recommendation && (
                      <p className="text-[10px] text-muted-foreground pl-7">💡 {insight.recommendation}</p>
                    )}
                    <div className="flex items-center gap-1 pl-7">
                      <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                      <p className="text-[9px] text-muted-foreground font-mono">{insight.timestamp.toLocaleTimeString()}</p>
                    </div>
                  </div>
                );
              })}
              {localInsights.length > 6 && (
                <button onClick={() => setShowAll((v) => !v)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-full justify-center py-1">
                  {showAll ? <><ChevronUp className="h-3.5 w-3.5" /> Show less</> : <><ChevronDown className="h-3.5 w-3.5" /> Show {localInsights.length - 6} more</>}
                </button>
              )}
            </div>
          )
        ) : tab === "backend" ? (
          apiRecommendations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Brain className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground text-center">
                No backend recommendations yet — start simulation and connect to server
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedBackend.map((rec) => {
                const scfg = severityConfig[rec.severity] ?? severityConfig.medium;
                const rcfg = recTypeConfig[rec.type];
                const SIcon = scfg.icon;
                const RIcon = rcfg?.icon ?? Brain;
                return (
                  <div key={rec.id} className={`rounded-lg border ${scfg.border} ${scfg.bg} p-3 space-y-1.5`}>
                    <div className="flex items-start gap-2">
                      <div className={`h-2 w-2 rounded-full ${scfg.dot} shrink-0 mt-1.5 ${rec.severity === "critical" ? "animate-pulse" : ""}`} />
                      <SIcon className={`h-3.5 w-3.5 ${scfg.color} shrink-0 mt-0.5`} />
                      <p className="text-xs text-foreground leading-relaxed flex-1">{rec.message}</p>
                      {rcfg && (
                        <span className={`shrink-0 text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5 ${scfg.bg} ${rcfg.color}`}>
                          <RIcon className="h-2.5 w-2.5" />
                          {rcfg.label}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground pl-7">💡 {rec.action}</p>
                    <div className="flex items-center gap-1 pl-7">
                      <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                      <p className="text-[9px] text-muted-foreground font-mono">{new Date(rec.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* History tab — all backend recommendations */
          <div className="space-y-2">
            {apiRecommendations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No recommendation history yet</p>
            ) : (
              apiRecommendations.map((rec) => {
                const scfg = severityConfig[rec.severity] ?? severityConfig.medium;
                const rcfg = recTypeConfig[rec.type];
                const RIcon = rcfg?.icon ?? Brain;
                return (
                  <div key={rec.id} className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-2.5">
                    <RIcon className={`h-3.5 w-3.5 ${rcfg?.color ?? "text-muted-foreground"} shrink-0 mt-0.5`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">{rec.panelId}</span>
                        <span className={`text-[9px] font-bold uppercase px-1 py-0.5 rounded ${scfg.bg} ${scfg.color}`}>{rec.severity}</span>
                      </div>
                      <p className="text-xs text-foreground">{rec.message}</p>
                      <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{new Date(rec.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
