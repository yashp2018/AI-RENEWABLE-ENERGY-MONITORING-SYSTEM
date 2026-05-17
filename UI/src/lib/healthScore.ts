import type { SolarData } from "@/hooks/useMultiPanelSimulation";

export interface HealthResult {
  score: number;
  level: "healthy" | "moderate" | "critical";
  color: string;
  strokeColor: string;
}

export function calculateHealthScore(data: SolarData | null): HealthResult {
  if (!data) return { score: 0, level: "critical", color: "hsl(0 72% 51%)", strokeColor: "hsl(0 72% 51%)" };

  // Energy factor (0-40 pts): 300W = max
  const energyScore = Math.min(40, (data.energyOutput / 300) * 40);

  // Temperature factor (0-30 pts): 25-40°C ideal
  let tempScore = 30;
  if (data.temperature > 60) tempScore = 5;
  else if (data.temperature > 50) tempScore = 15;
  else if (data.temperature > 40) tempScore = 22;

  // Efficiency factor (0-30 pts): based on voltage*current vs irradiance
  const theoreticalMax = (data.irradiance / 1000) * 350;
  const actualOutput = data.energyOutput;
  const effRatio = theoreticalMax > 0 ? actualOutput / theoreticalMax : 0;
  const effScore = Math.min(30, effRatio * 30);

  const total = Math.round(Math.min(100, energyScore + tempScore + effScore));

  if (total >= 70) return { score: total, level: "healthy", color: "hsl(142 71% 45%)", strokeColor: "hsl(142 71% 45%)" };
  if (total >= 40) return { score: total, level: "moderate", color: "hsl(45 93% 47%)", strokeColor: "hsl(45 93% 47%)" };
  return { score: total, level: "critical", color: "hsl(0 72% 51%)", strokeColor: "hsl(0 72% 51%)" };
}

export function calculateEfficiency(data: SolarData | null): number {
  if (!data || data.irradiance <= 0) return 0;
  const panelArea = 1.6; // m²
  const inputPower = data.irradiance * panelArea;
  return Math.min(100, (data.energyOutput / inputPower) * 100);
}
