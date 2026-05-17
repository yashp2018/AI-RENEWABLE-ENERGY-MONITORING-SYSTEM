import { Activity, AlertTriangle, Moon } from "lucide-react";
import type { SimulationMode } from "@/lib/weatherConfig";

interface Props {
  mode: SimulationMode;
  onModeChange: (m: SimulationMode) => void;
}

const modes: { value: SimulationMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "normal", label: "Normal", icon: <Activity className="h-4 w-4" />, desc: "Standard" },
  { value: "stress", label: "Stress", icon: <AlertTriangle className="h-4 w-4" />, desc: "Frequent faults" },
  { value: "night", label: "Night", icon: <Moon className="h-4 w-4" />, desc: "Low energy" },
];

export function SimulationModeSelector({ mode, onModeChange }: Props) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => onModeChange(m.value)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
            mode === m.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title={m.desc}
        >
          {m.icon}
          {m.label}
        </button>
      ))}
    </div>
  );
}
