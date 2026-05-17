import { Brain, AlertCircle, AlertTriangle, CheckCircle, WifiOff } from "lucide-react";
import type { LiveAlert } from "@/hooks/useLiveData";

interface Props {
  alerts: LiveAlert[];
  connected: boolean;
}

const severityConfig = {
  critical: { icon: AlertCircle,   color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", badge: "status-fault"    },
  warning:  { icon: AlertTriangle, color: "text-warning",     bg: "bg-warning/10",     border: "border-warning/20",     badge: "status-warning"  },
  normal:   { icon: CheckCircle,   color: "text-primary",     bg: "bg-primary/10",     border: "border-primary/20",     badge: "status-active"   },
};

export function AIInsightsPanel({ alerts, connected }: Props) {
  const visible = alerts.filter((a) => !a.dismissed).slice(0, 6);

  return (
    <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--chart-purple)/0.15)] flex items-center justify-center">
            <Brain className="w-4 h-4 text-[hsl(var(--chart-purple))]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Insights</h3>
            <p className="text-[10px] text-muted-foreground">Live backend alerts & analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
          {connected ? (
            <>
              <div className="relative w-1.5 h-1.5">
                <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
                <div className="relative w-1.5 h-1.5 rounded-full bg-primary" />
              </div>
              <span className="text-[10px] font-semibold text-primary">LIVE</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground">OFFLINE</span>
            </>
          )}
        </div>
      </div>

      {/* Alert count summary */}
      {connected && alerts.length > 0 && (
        <div className="flex items-center gap-3 mb-4 text-[11px] text-muted-foreground">
          <span className="text-destructive font-semibold">{alerts.filter(a => a.severity === "critical").length} critical</span>
          <span>·</span>
          <span className="text-warning font-semibold">{alerts.filter(a => a.severity === "warning").length} warnings</span>
          <span>·</span>
          <span>{alerts.length} total</span>
        </div>
      )}

      {/* Insights list */}
      <div className="space-y-3 max-h-[320px] overflow-y-auto">
        {!connected ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
            <WifiOff className="w-6 h-6" />
            <p className="text-xs text-center">Start backend server to see live AI insights</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <CheckCircle className="w-6 h-6 text-primary" />
            <p className="text-xs text-muted-foreground text-center">No active alerts — all panels operating normally</p>
          </div>
        ) : (
          visible.map((alert) => {
            const cfg = severityConfig[alert.severity] ?? severityConfig.normal;
            const Icon = cfg.icon;
            return (
              <div
                key={alert.id}
                className={`p-3.5 rounded-lg border transition-all duration-300 ${cfg.bg} ${cfg.border}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{alert.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.badge}`}>
                        {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                      </span>
                      {alert.panel && (
                        <span className="text-[10px] font-mono text-muted-foreground">{alert.panel}</span>
                      )}
                      {alert.timestamp && (
                        <span className="text-[10px] text-muted-foreground ml-auto">{alert.timestamp.slice(11, 19)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
