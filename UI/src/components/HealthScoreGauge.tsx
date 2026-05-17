import { calculateHealthScore } from "@/lib/healthScore";
import type { SolarData } from "@/hooks/useMultiPanelSimulation";

interface Props {
  data: SolarData | null;
  panelName: string;
}

export function HealthScoreGauge({ data, panelName }: Props) {
  const health = calculateHealthScore(data);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (health.score / 100) * circumference;

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col items-center gap-3">
      <span className="data-label">{panelName} Health</span>
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(220 14% 18%)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={health.strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-mono" style={{ color: health.color }}>{health.score}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">%</span>
        </div>
      </div>
      <span
        className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
        style={{ color: health.color, backgroundColor: `${health.color.replace(")", " / 0.15)")}` }}
      >
        {health.level}
      </span>
    </div>
  );
}
