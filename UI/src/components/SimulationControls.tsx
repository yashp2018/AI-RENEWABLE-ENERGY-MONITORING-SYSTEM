import { Play, Square, Zap, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  running: boolean;
  speed: number;
  faultInjected: boolean;
  onStart: () => void;
  onStop: () => void;
  onSetSpeed: (s: number) => void;
  onInjectFault: () => void;
}

const speeds = [1, 2, 5];
const SPEED_MS: Record<number, string> = { 1: "2s", 2: "1s", 5: "500ms" };

export function SimulationControls({ running, speed, faultInjected, onStart, onStop, onSetSpeed, onInjectFault }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        onClick={onStart}
        disabled={running}
        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
      >
        <Play className="h-4 w-4" /> Start Simulation
      </Button>
      <Button onClick={onStop} disabled={!running} variant="secondary" className="gap-2">
        <Square className="h-4 w-4" /> Stop
      </Button>

      {/* Speed selector + live interval label */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={`rounded-md px-3 py-1 text-sm font-mono font-medium transition-all ${
                speed === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
        {running && (
          <div className="flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/10 px-2.5 py-1.5">
            <Radio className="h-3.5 w-3.5 text-success animate-pulse" />
            <span className="text-xs font-mono font-semibold text-success">
              every {SPEED_MS[speed] ?? "2s"}
            </span>
          </div>
        )}
      </div>

      <Button
        onClick={onInjectFault}
        disabled={faultInjected || !running}
        variant="destructive"
        className="gap-2 ml-auto glow-destructive"
      >
        <Zap className="h-4 w-4" /> Inject Fault
      </Button>
    </div>
  );
}
