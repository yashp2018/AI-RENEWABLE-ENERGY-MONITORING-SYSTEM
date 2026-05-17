import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LiveIndicator } from "@/components/LiveIndicator";
import { useLiveData } from "@/hooks/useLiveData";
import { AlertTriangle, AlertOctagon, CheckCircle, Clock, X, Filter, WifiOff } from "lucide-react";
import type { LiveAlert } from "@/hooks/useLiveData";

type AlertSeverity = LiveAlert["severity"];

const severityConfig: Record<AlertSeverity, {
  borderClass: string;
  bgClass: string;
  textClass: string;
  icon: typeof AlertOctagon;
  label: string;
}> = {
  critical: { borderClass: "border-l-destructive", bgClass: "bg-destructive/10 text-destructive", textClass: "text-destructive", icon: AlertOctagon,   label: "CRITICAL" },
  warning:  { borderClass: "border-l-accent",      bgClass: "bg-accent/10 text-accent",           textClass: "text-accent",      icon: AlertTriangle, label: "WARNING"  },
  normal:   { borderClass: "border-l-primary",     bgClass: "bg-primary/10 text-primary",         textClass: "text-primary",     icon: CheckCircle,   label: "NORMAL"   },
};

const Alerts = () => {
  const { alerts, lastUpdated, connected, dismissAlert } = useLiveData();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<AlertSeverity | "all">("all");

  const visibleAlerts = alerts.filter((a) => {
    if (a.dismissed) return false;
    if (filter === "all") return true;
    return a.severity === filter;
  });

  const counts = {
    critical: alerts.filter((a) => !a.dismissed && a.severity === "critical").length,
    warning:  alerts.filter((a) => !a.dismissed && a.severity === "warning").length,
    normal:   alerts.filter((a) => !a.dismissed && a.severity === "normal").length,
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [alerts.length]);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Alerts</h1>
            <p className="text-sm text-muted-foreground mt-1">Live system warnings and critical notifications</p>
          </div>
          <LiveIndicator lastUpdated={lastUpdated} />
        </div>

        {/* Offline banner */}
        {!connected && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5">
            <WifiOff className="h-4 w-4 text-warning shrink-0" />
            <p className="text-xs text-warning">Backend offline — alerts will appear here once the server is running</p>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {(["all", "critical", "warning", "normal"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f
                  ? f === "critical" ? "bg-destructive/20 text-destructive"
                  : f === "warning"  ? "bg-accent/20 text-accent"
                  : f === "normal"   ? "bg-primary/20 text-primary"
                  : "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all"      ? `All (${alerts.filter(a => !a.dismissed).length})` :
               f === "critical" ? `Critical (${counts.critical})` :
               f === "warning"  ? `Warning (${counts.warning})` :
               `Normal (${counts.normal})`}
            </button>
          ))}
        </div>

        {/* Alert Timeline */}
        <div ref={scrollRef} className="relative max-h-[calc(100vh-280px)] overflow-y-auto pr-1 scroll-smooth">
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border" />
          <div className="space-y-3">
            {visibleAlerts.map((alert, i) => {
              const config = severityConfig[alert.severity] ?? severityConfig.normal;
              const Icon = config.icon;
              return (
                <div key={alert.id} className={`relative pl-10 transition-all duration-500 ${i === 0 ? "animate-fade-in" : ""}`}>
                  <div className={`absolute left-[13px] top-5 w-[11px] h-[11px] rounded-full border-2 border-background z-10 ${
                    alert.severity === "critical" ? "bg-destructive" :
                    alert.severity === "warning"  ? "bg-accent" : "bg-primary"
                  }`} />
                  <div className={`glass-card-hover p-5 border-l-4 ${config.borderClass} group`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${config.bgClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold uppercase tracking-wider ${config.textClass}`}>{config.label}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs font-mono text-muted-foreground">{alert.panel}</span>
                          {i === 0 && <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">NEW</span>}
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary"
                            title="Dismiss"
                          >
                            <X className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </div>
                        <p className="text-sm text-foreground">{alert.message}</p>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />{alert.timestamp}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {visibleAlerts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {connected ? "No alerts matching the current filter." : "Start backend to see live alerts."}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Alerts;
