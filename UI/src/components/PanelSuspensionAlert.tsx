import { ShieldAlert, PowerOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PanelState } from "@/hooks/useMultiPanelSimulation";

interface Props {
  panels: PanelState[];
  suspensionEvents: { panelId: string; panelName: string; timestamp: Date }[];
  onResume: (panelId: string) => void;
}

export function PanelSuspensionAlert({ panels, suspensionEvents, onResume }: Props) {
  const suspendedPanels = panels.filter((p) => p.suspended);
  if (suspendedPanels.length === 0 && suspensionEvents.length === 0) return null;

  return (
    <div className="space-y-2">
      {suspendedPanels.map((panel) => (
        <div
          key={panel.id}
          className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 glow-destructive"
        >
          <div className="flex items-center gap-2 shrink-0">
            <ShieldAlert className="h-5 w-5 text-destructive animate-pulse" />
            <PowerOff className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-destructive">
              🔴 {panel.name} — AUTOMATICALLY SUSPENDED
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Critical damage detected. Panel isolated from grid to prevent further damage.
              Energy generation halted.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => onResume(panel.id)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Resume
          </Button>
        </div>
      ))}

      {suspensionEvents.slice(0, 3).map((evt, i) => {
        const isStillSuspended = suspendedPanels.some((p) => p.id === evt.panelId);
        if (isStillSuspended) return null;
        return (
          <div
            key={`${evt.panelId}-${i}`}
            className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-2.5"
          >
            <ShieldAlert className="h-4 w-4 text-warning shrink-0" />
            <p className="text-xs text-warning">
              <span className="font-semibold">{evt.panelName}</span> was suspended at{" "}
              {evt.timestamp.toLocaleTimeString()} — now resumed
            </p>
          </div>
        );
      })}
    </div>
  );
}
