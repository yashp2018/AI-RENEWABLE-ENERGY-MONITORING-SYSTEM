import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import type { SolarData } from "@/hooks/useMultiPanelSimulation";

export interface AlertThresholds {
  voltageMin: number;
  voltageMax: number;
  currentMin: number;
  currentMax: number;
  temperatureMax: number;
  irradianceMin: number;
  energyOutputMin: number;
}

export const defaultThresholds: AlertThresholds = {
  voltageMin: 20,
  voltageMax: 40,
  currentMin: 5,
  currentMax: 12,
  temperatureMax: 60,
  irradianceMin: 300,
  energyOutputMin: 50,
};

export function useAlertThresholds() {
  const [thresholds, setThresholds] = useState<AlertThresholds>(defaultThresholds);
  const [enabled, setEnabled] = useState(true);
  const lastAlertRef = useRef<Record<string, number>>({});

  const checkThresholds = useCallback(
    (panelName: string, panelId: string, data: SolarData) => {
      if (!enabled) return;

      const now = Date.now();
      const cooldown = 3000; // 3s cooldown per panel+metric

      const alert = (metric: string, message: string, type: "warning" | "error") => {
        const key = `${panelId}-${metric}`;
        if (now - (lastAlertRef.current[key] || 0) < cooldown) return;
        lastAlertRef.current[key] = now;

        if (type === "error") {
          toast.error(`${panelName}: ${message}`);
        } else {
          toast.warning(`${panelName}: ${message}`);
        }
      };

      if (data.voltage < thresholds.voltageMin) {
        alert("vMin", `Voltage low: ${data.voltage.toFixed(1)}V (min ${thresholds.voltageMin}V)`, "error");
      }
      if (data.voltage > thresholds.voltageMax) {
        alert("vMax", `Voltage high: ${data.voltage.toFixed(1)}V (max ${thresholds.voltageMax}V)`, "error");
      }
      if (data.current < thresholds.currentMin) {
        alert("cMin", `Current low: ${data.current.toFixed(2)}A (min ${thresholds.currentMin}A)`, "warning");
      }
      if (data.current > thresholds.currentMax) {
        alert("cMax", `Current high: ${data.current.toFixed(2)}A (max ${thresholds.currentMax}A)`, "warning");
      }
      if (data.temperature > thresholds.temperatureMax) {
        alert("temp", `Temperature high: ${data.temperature.toFixed(0)}°C (max ${thresholds.temperatureMax}°C)`, "error");
      }
      if (data.irradiance < thresholds.irradianceMin) {
        alert("irr", `Irradiance low: ${data.irradiance.toFixed(0)} W/m² (min ${thresholds.irradianceMin})`, "warning");
      }
      if (data.energyOutput < thresholds.energyOutputMin) {
        alert("energy", `Energy output low: ${data.energyOutput.toFixed(0)}W (min ${thresholds.energyOutputMin}W)`, "error");
      }
    },
    [enabled, thresholds]
  );

  return { thresholds, setThresholds: setThresholds, enabled, setEnabled, checkThresholds };
}
