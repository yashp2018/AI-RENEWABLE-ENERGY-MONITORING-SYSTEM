import type { LogEntry } from "@/hooks/useMultiPanelSimulation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Radio, WifiOff, PowerOff } from "lucide-react";

interface Props {
  logs: LogEntry[];
  running?: boolean;
  speed?: number;
  apiOffline?: boolean;
}

const statusColors: Record<string, string> = {
  normal:  "text-success",
  warning: "text-warning",
  fault:   "text-destructive",
  offline: "text-muted-foreground",
};

const statusBg: Record<string, string> = {
  normal:  "bg-success/10",
  warning: "bg-warning/10",
  fault:   "bg-destructive/10",
  offline: "bg-muted/30",
};

const SPEED_LABEL: Record<number, string> = { 1: "2000ms", 2: "1000ms", 5: "500ms" };

export function LogPanel({ logs, running = false, speed = 1, apiOffline = false }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="data-label">Live Log Feed</h3>
        <div className="flex items-center gap-2">
          {running && (
            <div className="flex items-center gap-1.5 rounded-full bg-success/10 border border-success/20 px-2.5 py-1">
              <Radio className="h-3 w-3 text-success animate-pulse" />
              <span className="text-[10px] font-mono font-semibold text-success">
                STREAMING · {SPEED_LABEL[speed] ?? "2000ms"}
              </span>
            </div>
          )}
          {apiOffline && (
            <div className="flex items-center gap-1.5 rounded-full bg-destructive/10 border border-destructive/20 px-2.5 py-1">
              <WifiOff className="h-3 w-3 text-destructive" />
              <span className="text-[10px] font-semibold text-destructive">API OFFLINE</span>
            </div>
          )}
          {logs.length > 0 && (
            <span className="text-[10px] font-mono text-muted-foreground">{logs.length} entries</span>
          )}
        </div>
      </div>

      <ScrollArea className="h-[320px]">
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground font-mono">Waiting for data…</p>
        ) : (
          <div className="space-y-1.5">
            {logs.map((log) => {
              const status = log.data.status;
              const isOffline = status === "offline" || log.event === "AUTO-SUSPENDED";
              return (
                <div
                  key={log.id}
                  className={`flex items-start gap-3 rounded-lg px-3 py-2 font-mono text-xs ${statusBg[status] ?? "bg-muted/50"}`}
                >
                  <span className="text-muted-foreground shrink-0">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <span className="shrink-0 text-accent font-medium">
                    {log.panelName ?? log.panelId.replace("panel-", "P")}
                  </span>
                  {isOffline ? (
                    <span className="shrink-0 flex items-center gap-1 text-destructive font-bold uppercase">
                      <PowerOff className="h-3 w-3" /> SUSPENDED
                    </span>
                  ) : (
                    <span className={`shrink-0 uppercase font-semibold ${statusColors[status] ?? "text-foreground"}`}>
                      {status.padEnd(7)}
                    </span>
                  )}
                  {!isOffline && (
                    <span className="text-foreground/70">
                      V:{log.data.voltage.toFixed(1)} I:{log.data.current.toFixed(1)} T:{log.data.temperature.toFixed(0)}°C E:{log.data.energyOutput.toFixed(0)}W
                    </span>
                  )}
                  {log.event && (
                    <span className="ml-auto shrink-0 text-destructive font-bold">⚠ {log.event}</span>
                  )}
                  {log.sent && !log.event && (
                    <span className="ml-auto shrink-0 text-success/60">✓</span>
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
