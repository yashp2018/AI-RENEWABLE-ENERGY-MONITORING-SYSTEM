import type { PanelStatus } from "@/hooks/useMultiPanelSimulation";
import type { SolarData } from "@/hooks/useMultiPanelSimulation";
import { classifyFault } from "@/lib/faultClassifier";
import { AlertTriangle } from "lucide-react";

const config: Record<PanelStatus, { color: string; label: string; glow: string }> = {
  normal: { color: "bg-success", label: "Normal", glow: "glow-primary" },
  warning: { color: "bg-warning", label: "Warning", glow: "glow-warning" },
  fault: { color: "bg-destructive", label: "Fault", glow: "glow-destructive" },
};

export function StatusIndicator({ status, data }: { status: PanelStatus | null; data?: SolarData | null }) {
  const s: PanelStatus = (status && config[status]) ? status : "normal";
  const { color, label, glow } = config[s];
  const fault = data ? classifyFault(data) : null;

  return (
    <div className={`flex flex-col gap-3 rounded-xl border border-border bg-card p-5 ${glow}`}>
      <div className="flex items-center gap-3">
        <div className={`status-dot ${color} animate-pulse`} />
        <div>
          <span className="data-label">Panel Status</span>
          <p className="text-lg font-semibold">{label}</p>
        </div>
      </div>

      {fault && (
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{fault.icon}</span>
            <span className="text-sm font-semibold text-foreground">{fault.label}</span>
          </div>
          <p className="text-xs text-muted-foreground">{fault.reason}</p>
          <div className="flex items-start gap-1.5 mt-1">
            <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-warning font-medium">{fault.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
