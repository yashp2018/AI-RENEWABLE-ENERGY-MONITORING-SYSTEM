import { useState } from "react";
import {
  ShieldAlert, PowerOff, RotateCcw, AlertCircle, Flame,
  Cpu, Zap, History, ChevronDown, ChevronUp,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { ApiFaultData, ApiFault } from "@/hooks/useApiData";
import type { PanelState } from "@/hooks/useMultiPanelSimulation";

interface Props {
  faultData: ApiFaultData | null;
  panels: PanelState[];
  suspensionEvents: { panelId: string; panelName: string; timestamp: Date }[];
  onResume: (panelId: string) => void;
  onApiResume?: (panelId: string) => Promise<void>;
}

const faultTypeConfig: Record<string, { icon: typeof Flame; color: string; bg: string }> = {
  "Critical Overheating":   { icon: Flame,        color: "text-destructive", bg: "bg-destructive/10" },
  "Critical Hardware Failure": { icon: Cpu,        color: "text-destructive", bg: "bg-destructive/10" },
  "Zero Generation Fault":  { icon: Zap,          color: "text-warning",     bg: "bg-warning/10" },
  "Hardware Fault":         { icon: Cpu,          color: "text-destructive", bg: "bg-destructive/10" },
  "Overheating Fault":      { icon: Flame,        color: "text-warning",     bg: "bg-warning/10" },
  "Manual Suspension":      { icon: ShieldAlert,  color: "text-accent",      bg: "bg-accent/10" },
};

function getFaultConfig(faultType: string) {
  return faultTypeConfig[faultType] ?? { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" };
}

function FaultHistoryRow({ fault }: { fault: ApiFault }) {
  const cfg = getFaultConfig(fault.faultType);
  const Icon = cfg.icon;
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border ${fault.suspended ? "border-destructive/40 bg-destructive/10" : "border-border bg-muted/30"} p-2.5`}>
      <Icon className={`h-3.5 w-3.5 ${cfg.color} shrink-0 mt-0.5`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{fault.panelId}</span>
          <span className={`text-[9px] font-bold uppercase px-1 py-0.5 rounded ${fault.severity === "critical" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}`}>
            {fault.severity}
          </span>
          {fault.suspended && (
            <span className="text-[9px] font-bold text-destructive bg-destructive/20 px-1 py-0.5 rounded flex items-center gap-0.5">
              <PowerOff className="h-2.5 w-2.5" /> SUSPENDED
            </span>
          )}
        </div>
        <p className="text-xs text-foreground">{fault.description}</p>
        <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{new Date(fault.createdAt).toLocaleString()}</p>
      </div>
    </div>
  );
}

export function FaultSuspensionSystem({ faultData, panels, suspensionEvents, onResume, onApiResume }: Props) {
  const [showHistory, setShowHistory] = useState(false);
  const [resumingId, setResumingId] = useState<string | null>(null);

  const suspendedPanels = panels.filter((p) => p.suspended);
  const backendSuspended = faultData?.suspended ?? {};
  const allSuspendedIds = new Set([
    ...suspendedPanels.map((p) => p.id),
    ...Object.keys(backendSuspended),
  ]);

  const faults = faultData?.faults ?? [];
  const criticalFaults = faults.filter((f) => f.severity === "critical").length;

  const handleResume = async (panelId: string) => {
    setResumingId(panelId);
    onResume(panelId);
    if (onApiResume) await onApiResume(panelId).catch(() => {});
    setResumingId(null);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${allSuspendedIds.size > 0 ? "bg-destructive/10" : "bg-muted"}`}>
            <ShieldAlert className={`h-4 w-4 ${allSuspendedIds.size > 0 ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
          </div>
          <div>
            <span className="data-label">Fault Suspension System</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">Automatic fault detection & panel isolation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allSuspendedIds.size > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full animate-pulse">
              <PowerOff className="h-3 w-3" /> {allSuspendedIds.size} Offline
            </span>
          )}
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {criticalFaults} critical faults
          </span>
        </div>
      </div>

      {/* System status overview */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total Faults",    value: faultData?.totalFaults ?? 0,    color: "text-destructive" },
          { label: "Critical Faults", value: faultData?.criticalFaults ?? 0, color: "text-destructive" },
          { label: "Panels Offline",  value: allSuspendedIds.size,           color: allSuspendedIds.size > 0 ? "text-destructive" : "text-success" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-muted/50 p-2.5 text-center">
            <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Active suspension alerts */}
      {allSuspendedIds.size === 0 ? (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 p-3">
          <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
          <p className="text-xs text-success font-medium">All panels active — no suspensions</p>
        </div>
      ) : (
        <div className="space-y-2">
          {suspendedPanels.map((panel) => (
            <div
              key={panel.id}
              className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 space-y-2 pulse-ring"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive animate-pulse shrink-0" />
                <PowerOff className="h-3.5 w-3.5 text-destructive shrink-0" />
                <span className="text-sm font-bold text-destructive flex-1">
                  🔴 {panel.name} — AUTOMATICALLY SUSPENDED
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={resumingId === panel.id}
                  className="shrink-0 h-7 gap-1 border-destructive/40 text-destructive hover:bg-destructive/10 text-xs"
                  onClick={() => handleResume(panel.id)}
                >
                  <RotateCcw className={`h-3 w-3 ${resumingId === panel.id ? "animate-spin" : ""}`} />
                  {resumingId === panel.id ? "Resuming…" : "Resume"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Critical damage detected. Panel isolated from grid. Energy generation halted.
              </p>
              <div className="flex items-center gap-2 rounded bg-destructive/20 px-2 py-1.5">
                <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
                <p className="text-[10px] text-destructive font-medium">
                  Immediate maintenance required — do not restart without physical inspection
                </p>
              </div>
            </div>
          ))}

          {/* Backend-suspended panels not in local state */}
          {Object.entries(backendSuspended)
            .filter(([id]) => !suspendedPanels.some((p) => p.id === id))
            .map(([id, info]) => (
              <div key={id} className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
                  <span className="text-sm font-bold text-destructive flex-1">🔴 {id} — SUSPENDED (Backend)</span>
                  {onApiResume && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 h-7 gap-1 border-destructive/40 text-destructive hover:bg-destructive/10 text-xs"
                      onClick={() => onApiResume(id)}
                    >
                      <RotateCcw className="h-3 w-3" /> Resume
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{info.reason}</p>
                <p className="text-[9px] text-muted-foreground font-mono">{new Date(info.suspendedAt).toLocaleString()}</p>
              </div>
            ))}
        </div>
      )}

      {/* Recent suspension events */}
      {suspensionEvents.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Recent Suspension Events</p>
          {suspensionEvents.slice(0, 3).map((evt, i) => {
            const isActive = suspendedPanels.some((p) => p.id === evt.panelId);
            if (isActive) return null;
            return (
              <div key={`${evt.panelId}-${i}`} className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2">
                <ShieldAlert className="h-3.5 w-3.5 text-warning shrink-0" />
                <p className="text-xs text-warning">
                  <span className="font-semibold">{evt.panelName}</span> suspended at {evt.timestamp.toLocaleTimeString()} — now resumed
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Fault history toggle */}
      {faults.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <History className="h-3.5 w-3.5" />
            <span>Fault History ({faults.length} records)</span>
            {showHistory ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
          </button>
          {showHistory && (
            <ScrollArea className="h-[200px] mt-2">
              <div className="space-y-1.5">
                {faults.slice(0, 30).map((fault) => (
                  <FaultHistoryRow key={fault.id} fault={fault} />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}
