import { AlertTriangle, Flame, Wind, Cpu } from "lucide-react";
import type { ApiHealth, ApiSensorData } from "@/hooks/useApiData";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  health: ApiHealth | null;
  sensorData: ApiSensorData | null;
  loading?: boolean;
}

type FaultType = "Overheating" | "Dust" | "Hardware" | "Normal";

function classifyFault(data: ApiSensorData): FaultType {
  if (data.temperature > 65) return "Overheating";
  if (data.energy_output < 100 && data.irradiance > 400) return "Dust";
  if (data.voltage < 10 && data.current < 2) return "Hardware";
  return "Normal";
}

const faultConfig: Record<FaultType, { icon: typeof Flame; color: string; bg: string; recommendation: string }> = {
  Overheating: {
    icon: Flame,
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/30",
    recommendation: "Check cooling system and ventilation immediately",
  },
  Dust: {
    icon: Wind,
    color: "text-warning",
    bg: "bg-warning/10 border-warning/30",
    recommendation: "Clean panel surface to restore efficiency",
  },
  Hardware: {
    icon: Cpu,
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/30",
    recommendation: "Schedule maintenance inspection immediately",
  },
  Normal: {
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10 border-warning/30",
    recommendation: "Monitor panel closely for further anomalies",
  },
};

export function FaultPanel({ health, sensorData, loading }: Props) {
  const faultType = sensorData ? classifyFault(sensorData) : null;
  const hasFault = health && health.faulty_panels > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <span className="data-label">Fault Visualization</span>
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : !hasFault ? (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 p-3">
          <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
          <p className="text-xs text-success font-medium">All panels operating normally</p>
        </div>
      ) : (
        <div className="space-y-2">
          {Array.from({ length: health!.faulty_panels }, (_, i) => {
            const type = faultType ?? "Normal";
            const cfg = faultConfig[type];
            const Icon = cfg.icon;
            return (
              <div key={i} className={`rounded-lg border p-3 space-y-2 ${cfg.bg}`}>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
                  <span className="text-xs font-semibold text-foreground">
                    Panel {String.fromCharCode(65 + i)} — Fault Detected
                  </span>
                  <span className={`ml-auto text-xs font-semibold ${cfg.color}`}>{type}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon className={`h-3.5 w-3.5 ${cfg.color} shrink-0`} />
                  <p className="text-xs text-muted-foreground">
                    {type === "Overheating" && sensorData
                      ? `Temperature critically high at ${sensorData.temperature.toFixed(0)}°C`
                      : type === "Dust" && sensorData
                      ? `Low energy (${sensorData.energy_output.toFixed(0)}W) despite adequate irradiance`
                      : type === "Hardware" && sensorData
                      ? `Voltage (${sensorData.voltage.toFixed(1)}V) and current critically low`
                      : "Multiple abnormal readings detected"}
                  </p>
                </div>
                <div className="flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                  <p className="text-xs text-warning font-medium">{cfg.recommendation}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
