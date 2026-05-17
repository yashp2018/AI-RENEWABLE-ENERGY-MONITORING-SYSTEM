import { AlertCircle, AlertTriangle, Info, Bell, BellRing, Wrench, Zap, Flame, Cpu, Wind, Eye } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiAlert } from "@/hooks/useApiData";
import type { MaintenanceAlert } from "@/lib/predictiveMaintenance";

interface Props {
  alerts: ApiAlert[];
  maintenanceAlerts?: MaintenanceAlert[];
  loading?: boolean;
}

// Map FAULT-XX codes to icons and colors
const faultCodeConfig: Record<string, { icon: typeof Flame; label: string; color: string; bg: string }> = {
  "FAULT-01": { icon: Flame,         label: "Thermal Runaway",       color: "text-destructive", bg: "bg-destructive/20" },
  "FAULT-02": { icon: Flame,         label: "Cell Hotspot",          color: "text-destructive", bg: "bg-destructive/20" },
  "FAULT-03": { icon: Flame,         label: "Thermal Stress",        color: "text-warning",     bg: "bg-warning/20" },
  "FAULT-04": { icon: Eye,           label: "Delamination",          color: "text-destructive", bg: "bg-destructive/20" },
  "FAULT-05": { icon: Zap,           label: "Bypass Diode",          color: "text-destructive", bg: "bg-destructive/20" },
  "FAULT-06": { icon: Zap,           label: "Open Circuit",          color: "text-destructive", bg: "bg-destructive/20" },
  "FAULT-07": { icon: Wind,          label: "Shading/Soiling",       color: "text-warning",     bg: "bg-warning/20" },
  "FAULT-08": { icon: Wind,          label: "Dust Accumulation",     color: "text-warning",     bg: "bg-warning/20" },
  "FAULT-09": { icon: Cpu,           label: "Inverter Disconnect",   color: "text-destructive", bg: "bg-destructive/20" },
  "FAULT-10": { icon: Eye,           label: "Micro-Crack",           color: "text-warning",     bg: "bg-warning/20" },
  "FAULT-11": { icon: Cpu,           label: "Hardware Failure",      color: "text-destructive", bg: "bg-destructive/20" },
  "FAULT-12": { icon: Info,          label: "Low Irradiance",        color: "text-accent",      bg: "bg-accent/20" },
};

const severityConfig = {
  info:     { icon: Info,          color: "text-accent",      bg: "bg-accent/10",      border: "border-accent/20",      dot: "bg-accent" },
  warning:  { icon: AlertTriangle, color: "text-warning",     bg: "bg-warning/10",     border: "border-warning/20",     dot: "bg-warning" },
  critical: { icon: AlertCircle,   color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", dot: "bg-destructive" },
};

const maintPriorityToSeverity: Record<string, "info" | "warning" | "critical"> = {
  critical: "critical", high: "warning", medium: "info", low: "info",
};

// Extract FAULT-XX code from message string
function extractFaultCode(message: string): string | null {
  const m = message.match(/FAULT-\d{2}/);
  return m ? m[0] : null;
}

// Clean message — remove "Action: ..." suffix for display, show separately
function splitMessage(message: string): { main: string; action: string | null } {
  const idx = message.indexOf(" | Action: ");
  if (idx === -1) return { main: message, action: null };
  return { main: message.slice(0, idx), action: message.slice(idx + 11) };
}

export function AlertsList({ alerts, maintenanceAlerts = [], loading }: Props) {
  const maintAsAlerts: ApiAlert[] = maintenanceAlerts.map((m) => ({
    id: `maint-${m.id}`,
    message: `🔧 ${m.message}`,
    severity: maintPriorityToSeverity[m.priority],
    timestamp: m.timestamp.toISOString(),
    panel: m.panelName,
  }));

  const allAlerts = [...alerts, ...maintAsAlerts].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
  });

  const criticalCount = allAlerts.filter((a) => a.severity === "critical").length;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {criticalCount > 0
            ? <BellRing className="h-4 w-4 text-destructive animate-pulse" />
            : <Bell className="h-4 w-4 text-muted-foreground" />
          }
          <span className="data-label">Smart Notifications</span>
        </div>
        {allAlerts.length > 0 && (
          <div className="flex items-center gap-1.5">
            {criticalCount > 0 && (
              <span className="text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full animate-pulse">
                {criticalCount} Critical
              </span>
            )}
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {allAlerts.length} Total
            </span>
          </div>
        )}
      </div>

      <ScrollArea className="h-[320px]">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
          </div>
        ) : allAlerts.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 p-3">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <p className="text-xs text-success font-medium">No active alerts — system nominal</p>
          </div>
        ) : (
          <div className="space-y-2">
            {allAlerts.map((alert) => {
              const cfg       = severityConfig[alert.severity] ?? severityConfig.info;
              const Icon      = cfg.icon;
              const ts        = alert.timestamp ? new Date(alert.timestamp) : null;
              const faultCode = extractFaultCode(alert.message);
              const faultCfg  = faultCode ? faultCodeConfig[faultCode] : null;
              const FaultIcon = faultCfg?.icon ?? Wrench;
              const { main, action } = splitMessage(alert.message);

              return (
                <div
                  key={alert.id}
                  className={`rounded-lg border ${cfg.border} ${cfg.bg} p-3 space-y-2 transition-all`}
                >
                  {/* Top row: dot + icon + panel + fault code badge */}
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot} ${alert.severity === "critical" ? "animate-pulse" : ""}`} />
                    <Icon className={`h-3.5 w-3.5 ${cfg.color} shrink-0`} />
                    {alert.panel && (
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {alert.panel}
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-1.5 shrink-0">
                      {/* Fault code badge */}
                      {faultCfg && faultCode && (
                        <span className={`flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${faultCfg.bg} ${faultCfg.color}`}>
                          <FaultIcon className="h-2.5 w-2.5" />
                          {faultCode} · {faultCfg.label}
                        </span>
                      )}
                      {/* Severity badge */}
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                        {alert.severity}
                      </span>
                    </div>
                  </div>

                  {/* Main message */}
                  <p className="text-xs text-foreground leading-relaxed">{main}</p>

                  {/* Action recommendation */}
                  {action && (
                    <div className="flex items-start gap-1.5 rounded bg-muted/50 px-2 py-1.5">
                      <Wrench className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        <span className="font-semibold text-foreground/70">Action: </span>{action}
                      </p>
                    </div>
                  )}

                  {/* Timestamp */}
                  {ts && !isNaN(ts.getTime()) && (
                    <p className="text-[10px] text-muted-foreground font-mono">
                      🕐 {ts.toLocaleString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
