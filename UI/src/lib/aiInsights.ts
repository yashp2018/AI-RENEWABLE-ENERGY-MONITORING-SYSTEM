import type { PanelState } from "@/hooks/useMultiPanelSimulation";
import type { WeatherCondition } from "./weatherConfig";
import type { DegradationAnalysis } from "./predictiveMaintenance";

export interface Insight {
  id: string;
  text: string;
  severity: "info" | "warning" | "critical";
  category: "weather" | "fault" | "efficiency" | "maintenance" | "performance" | "anomaly";
  recommendation?: string;
  timestamp: Date;
}

export function generateInsights(
  panels: PanelState[],
  weather: WeatherCondition,
  efficiency: Record<string, number>,
  degradation?: DegradationAnalysis[]
): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();

  // ── Weather intelligence ──────────────────────────────────────────────────
  if (weather === "storm") {
    insights.push({
      id: "weather-storm",
      text: "⛈️ Storm conditions active — energy output at critical minimum (8%). Risk of physical panel damage.",
      severity: "critical",
      category: "weather",
      recommendation: "Consider suspending non-essential loads. Monitor for structural damage.",
      timestamp: now,
    });
  } else if (weather === "rainy") {
    insights.push({
      id: "weather-rain",
      text: "🌧️ Rain detected — irradiance reduced by 80%. Energy output at 25% of peak capacity.",
      severity: "warning",
      category: "weather",
      recommendation: "Activate battery backup if available. Expect reduced generation for the duration.",
      timestamp: now,
    });
  } else if (weather === "cloudy") {
    insights.push({
      id: "weather-cloud",
      text: "⛅ Cloud cover detected — operating at ~55% of peak capacity.",
      severity: "info",
      category: "weather",
      recommendation: "Normal operation. Monitor for clearing conditions.",
      timestamp: now,
    });
  }

  // ── Per-panel analysis ────────────────────────────────────────────────────
  panels.forEach((p) => {
    if (!p.currentData) return;
    const d   = p.currentData;
    const eff = efficiency[p.id] ?? 0;

    // Offline / suspended
    if ((d as any).offline) {
      insights.push({
        id: `offline-${p.id}`,
        text: `🔴 ${p.name}: OFFLINE — Panel suspended due to critical damage detection.`,
        severity: "critical",
        category: "fault",
        recommendation: "Do not restart until physical inspection is completed.",
        timestamp: now,
      });
      return;
    }

    // Critical temperature
    if (d.temperature > 70) {
      insights.push({
        id: `temp-critical-${p.id}`,
        text: `🔥 ${p.name}: CRITICAL overheating at ${d.temperature.toFixed(0)}°C — thermal runaway risk.`,
        severity: "critical",
        category: "fault",
        recommendation: "Shut down panel immediately. Check cooling system and ventilation.",
        timestamp: now,
      });
    } else if (d.temperature > 55) {
      insights.push({
        id: `temp-warn-${p.id}`,
        text: `🌡️ ${p.name}: High temperature (${d.temperature.toFixed(0)}°C) — efficiency degrading.`,
        severity: "warning",
        category: "fault",
        recommendation: "Reduce overheating — inspect ventilation gaps and mounting clearance.",
        timestamp: now,
      });
    }

    // Hardware fault — very low voltage/current
    if (d.voltage < 5 && d.current < 1) {
      insights.push({
        id: `hw-${p.id}`,
        text: `⚙️ ${p.name}: Possible hardware issue — voltage ${d.voltage.toFixed(1)}V, current ${d.current.toFixed(1)}A critically low.`,
        severity: "critical",
        category: "fault",
        recommendation: "Check wiring, inverter connections, and bypass diodes immediately.",
        timestamp: now,
      });
    }

    // Dust / soiling — high irradiance, low output
    if (d.irradiance > 500 && d.energyOutput < 80) {
      insights.push({
        id: `dust-${p.id}`,
        text: `🌫️ ${p.name}: Possible dust accumulation — ${d.energyOutput.toFixed(0)}W output despite ${d.irradiance.toFixed(0)} W/m² irradiance.`,
        severity: "warning",
        category: "efficiency",
        recommendation: "Clean panel surface. Dust can reduce efficiency by up to 25%.",
        timestamp: now,
      });
    }

    // Low efficiency
    if (eff < 8 && d.irradiance > 300) {
      insights.push({
        id: `eff-low-${p.id}`,
        text: `📉 ${p.name}: Low efficiency (${eff.toFixed(1)}%) despite adequate irradiance (${d.irradiance.toFixed(0)} W/m²).`,
        severity: "warning",
        category: "efficiency",
        recommendation: "Inspect panel for shading, soiling, or micro-crack damage.",
        timestamp: now,
      });
    }

    // Fault status
    if (d.status === "fault") {
      insights.push({
        id: `fault-${p.id}`,
        text: `🚨 ${p.name}: Active fault detected — immediate maintenance required.`,
        severity: "critical",
        category: "fault",
        recommendation: "Isolate panel from grid. Schedule emergency inspection.",
        timestamp: now,
      });
    }
  });

  // ── Degradation / predictive maintenance ─────────────────────────────────
  if (degradation) {
    degradation.forEach((d) => {
      if (d.trend === "critical") {
        insights.push({
          id: `maint-critical-${d.panelId}`,
          text: `🔧 ${d.panelId}: Critical efficiency degradation — ${(d.degradationRate * 100).toFixed(1)}% drop from baseline.`,
          severity: "critical",
          category: "maintenance",
          recommendation: "Immediate inspection. Possible cell damage or severe soiling.",
          timestamp: now,
        });
      } else if (d.trend === "degrading") {
        insights.push({
          id: `maint-warn-${d.panelId}`,
          text: `📊 ${d.panelId}: Gradual efficiency reduction detected. Maintenance predicted in ~${d.predictedDaysToMaintenance} days.`,
          severity: "warning",
          category: "maintenance",
          recommendation: "Schedule preventive maintenance to avoid further degradation.",
          timestamp: now,
        });
      }
    });
  }

  // ── Anomaly detection — sudden energy spike/drop ──────────────────────────
  const energyValues = panels.map((p) => p.currentData?.energyOutput ?? 0).filter((v) => v > 0);
  if (energyValues.length >= 2) {
    const avg = energyValues.reduce((a, b) => a + b, 0) / energyValues.length;
    panels.forEach((p) => {
      const e = p.currentData?.energyOutput ?? 0;
      if (e > 0 && Math.abs(e - avg) > avg * 0.5) {
        insights.push({
          id: `anomaly-${p.id}`,
          text: `⚡ ${p.name}: Anomalous energy reading (${e.toFixed(0)}W vs avg ${avg.toFixed(0)}W) — possible sensor fault.`,
          severity: "warning",
          category: "anomaly",
          recommendation: "Verify sensor calibration and data integrity.",
          timestamp: now,
        });
      }
    });
  }

  // ── All-clear ─────────────────────────────────────────────────────────────
  const allNormal = panels.every((p) => p.currentData?.status === "normal");
  if (allNormal && weather === "sunny" && insights.length === 0) {
    insights.push({
      id: "all-good",
      text: "✅ All panels operating at peak performance under optimal conditions.",
      severity: "info",
      category: "performance",
      recommendation: "Continue monitoring. System is healthy.",
      timestamp: now,
    });
  }

  // Deduplicate by id and limit
  const seen = new Set<string>();
  return insights.filter((i) => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  }).slice(0, 10);
}
