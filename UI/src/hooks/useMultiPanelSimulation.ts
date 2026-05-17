import { useState, useRef, useEffect } from "react";
import type { WeatherCondition, SimulationMode } from "@/lib/weatherConfig";
import { weatherConfigs, modeConfigs } from "@/lib/weatherConfig";
import { calculateEfficiency } from "@/lib/healthScore";
import {
  createMaintenanceRecord,
  generateMaintenanceAlerts,
  analyzeDegradation,
} from "@/lib/predictiveMaintenance";
import type { MaintenanceRecord, MaintenanceAlert, DegradationAnalysis } from "@/lib/predictiveMaintenance";
import { calculateCarbonSavings } from "@/lib/carbonTracker";
import type { CarbonMetrics } from "@/lib/carbonTracker";

export type PanelStatus = "normal" | "warning" | "fault" | "offline";

export interface SolarData {
  voltage: number;
  current: number;
  temperature: number;
  irradiance: number;
  energyOutput: number;
  status: PanelStatus;
  timestamp: Date;
  offline?: boolean;
}

export interface LogEntry {
  id: number;
  timestamp: Date;
  panelId: string;
  panelName: string;
  data: SolarData;
  sent: boolean;
  event?: string;
}

export interface ChartPoint {
  time: string;
  voltage: number;
  current: number;
  energyOutput: number;
}

export interface PanelState {
  id: string;
  name: string;
  currentData: SolarData | null;
  chartHistory: ChartPoint[];
  faultInjected: boolean;
  faultCount: number;
  suspended: boolean;       // auto-suspended due to critical damage
  criticalHits: number;     // consecutive critical readings
  efficiency: number;
}

const SPEED_MAP: Record<number, number> = { 1: 2000, 2: 1000, 5: 500 };
const MAX_CHART_POINTS = 30;
const API_URL = `${((import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api").replace(/\/$/, "")}/data`;
const CRITICAL_HITS_TO_SUSPEND = 4; // 4 consecutive critical readings → auto-suspend

const defaultPanels: PanelState[] = [
  { id: "panel-1", name: "Panel A", currentData: null, chartHistory: [], faultInjected: false, faultCount: 0, suspended: false, criticalHits: 0, efficiency: 0 },
  { id: "panel-2", name: "Panel B", currentData: null, chartHistory: [], faultInjected: false, faultCount: 0, suspended: false, criticalHits: 0, efficiency: 0 },
  { id: "panel-3", name: "Panel C", currentData: null, chartHistory: [], faultInjected: false, faultCount: 0, suspended: false, criticalHits: 0, efficiency: 0 },
];

function generateData(
  weather: WeatherCondition,
  mode: SimulationMode,
  isFault: boolean,
  isWarning: boolean
): Omit<SolarData, "timestamp"> {
  const wc = weatherConfigs[weather];
  const mc = modeConfigs[mode];
  const tempOffset = wc.temperatureOffset;

  if (isFault) return {
    voltage: 2 + Math.random() * 5,
    current: 0.5 + Math.random() * 1,
    temperature: 70 + Math.random() * 20 + tempOffset,
    irradiance: (100 + Math.random() * 150) * wc.irradianceMultiplier,
    energyOutput: (5 + Math.random() * 15) * wc.energyMultiplier * mc.energyMultiplier,
    status: "fault",
  };
  if (isWarning) return {
    voltage: 20 + Math.random() * 5,
    current: 4 + Math.random() * 2,
    temperature: 55 + Math.random() * 15 + tempOffset,
    irradiance: (400 + Math.random() * 200) * wc.irradianceMultiplier,
    energyOutput: (80 + Math.random() * 60) * wc.energyMultiplier * mc.energyMultiplier,
    status: "warning",
  };
  return {
    voltage: 28 + Math.random() * 8,
    current: 7 + Math.random() * 3,
    temperature: 25 + Math.random() * 15 + tempOffset,
    irradiance: (mc.irradianceBase + Math.random() * 200) * wc.irradianceMultiplier,
    energyOutput: (200 + Math.random() * 100) * wc.energyMultiplier * mc.energyMultiplier,
    status: "normal",
  };
}

async function streamToBackend(
  panel: PanelState,
  data: SolarData,
  onOffline: () => void,
  onOnline: () => void
): Promise<void> {
  const payload = {
    panelId: panel.name.replace(" ", "-"),
    voltage: data.voltage,
    current: data.current,
    temperature: data.temperature,
    irradiance: data.irradiance,
    energy: data.energyOutput,
    timestamp: data.timestamp.toISOString(),
  };
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    res.ok ? onOnline() : onOffline();
  } catch {
    onOffline();
  }
}

export function useMultiPanelSimulation() {
  const [running, setRunning]           = useState(false);
  const [speed, setSpeed]               = useState(1);
  const [isFault, setIsFault]           = useState(false);
  const [panels, setPanels]             = useState<PanelState[]>(defaultPanels);
  const [logs, setLogs]                 = useState<LogEntry[]>([]);
  const [activePanelId, setActivePanelId] = useState("panel-1");
  const [weather, setWeather]           = useState<WeatherCondition>("sunny");
  const [simMode, setSimMode]           = useState<SimulationMode>("normal");
  const [efficiencyHistory, setEfficiencyHistory] = useState<Record<string, number[]>>({});
  const [apiOffline, setApiOffline]     = useState(false);

  // Predictive maintenance
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(
    defaultPanels.map((p) => createMaintenanceRecord(p.id, p.name))
  );
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);
  const [degradationData, setDegradationData]     = useState<DegradationAnalysis[]>([]);

  // Carbon tracking
  const [totalEnergyWh, setTotalEnergyWh] = useState(0);
  const [carbonMetrics, setCarbonMetrics] = useState<CarbonMetrics>(calculateCarbonSavings(0));

  // Suspension notifications
  const [suspensionEvents, setSuspensionEvents] = useState<{ panelId: string; panelName: string; timestamp: Date }[]>([]);

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const logIdRef     = useRef(0);
  const weatherRef   = useRef(weather);
  const modeRef      = useRef(simMode);
  const panelsRef    = useRef(panels);
  const maintRef     = useRef(maintenanceRecords);

  useEffect(() => { weatherRef.current = weather; }, [weather]);
  useEffect(() => { modeRef.current = simMode; }, [simMode]);
  useEffect(() => { panelsRef.current = panels; }, [panels]);
  useEffect(() => { maintRef.current = maintenanceRecords; }, [maintenanceRecords]);

  useEffect(() => {
    if (!running) return;
    const intervalMs = SPEED_MAP[speed] ?? 2000;

    const tick = () => {
      const w  = weatherRef.current;
      const m  = modeRef.current;
      const mc = modeConfigs[m];
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const snapshot = panelsRef.current;

      const newSuspensions: { panelId: string; panelName: string; timestamp: Date }[] = [];

      const updated: PanelState[] = snapshot.map((panel) => {
        // Suspended panels stay offline
        if (panel.suspended) {
          const offlineData: SolarData = {
            voltage: 0, current: 0, temperature: 0,
            irradiance: 0, energyOutput: 0,
            status: "offline", timestamp: now, offline: true,
          };
          return { ...panel, currentData: offlineData };
        }

        let isPanelFault = false;
        let isWarning    = false;
        let newFaultCount = panel.faultCount;

        if (panel.faultCount > 0) {
          newFaultCount = panel.faultCount - 1;
          isPanelFault  = newFaultCount > 2;
          isWarning     = !isPanelFault;
        } else {
          isWarning = Math.random() < mc.faultProbability;
        }

        const dataGen = generateData(w, m, isPanelFault, isWarning);
        const data: SolarData = { ...dataGen, timestamp: now };
        const point: ChartPoint = { time: timeStr, voltage: data.voltage, current: data.current, energyOutput: data.energyOutput };

        // Auto-suspension logic: 4 consecutive critical fault readings
        let newCriticalHits = panel.criticalHits;
        let newSuspended    = false;
        if (data.status === "fault" && (data.temperature > 70 || (data.voltage < 3 && data.current < 0.5))) {
          newCriticalHits++;
          if (newCriticalHits >= CRITICAL_HITS_TO_SUSPEND) {
            newSuspended = true;
            newSuspensions.push({ panelId: panel.id, panelName: panel.name, timestamp: now });
          }
        } else {
          newCriticalHits = 0;
        }

        streamToBackend(panel, data, () => setApiOffline(true), () => setApiOffline(false));

        return {
          ...panel,
          currentData: data,
          chartHistory: [...panel.chartHistory, point].slice(-MAX_CHART_POINTS),
          faultInjected: newFaultCount > 0,
          faultCount: newFaultCount,
          suspended: newSuspended,
          criticalHits: newSuspended ? 0 : newCriticalHits,
          efficiency: calculateEfficiency(data),
        };
      });

      setPanels(updated);
      setIsFault(updated.some((p) => p.currentData?.status === "fault"));

      if (newSuspensions.length > 0) {
        setSuspensionEvents((prev) => [...newSuspensions, ...prev].slice(0, 20));
      }

      // Accumulate energy (Wh = W × interval_hours)
      const intervalHours = (SPEED_MAP[speed] ?? 2000) / 3600000;
      const tickEnergy = updated.reduce((sum, p) => sum + (p.currentData?.energyOutput ?? 0) * intervalHours, 0);
      setTotalEnergyWh((prev) => {
        const next = prev + tickEnergy;
        setCarbonMetrics(calculateCarbonSavings(next));
        return next;
      });

      const newLogs: LogEntry[] = updated.map((p) => {
        logIdRef.current++;
        const isSuspended = p.suspended;
        return {
          id: logIdRef.current,
          timestamp: now,
          panelId: p.id,
          panelName: p.name,
          data: p.currentData!,
          sent: !isSuspended,
          event: isSuspended ? "AUTO-SUSPENDED" : undefined,
        };
      });
      setLogs((prev) => [...newLogs, ...prev].slice(0, 100));

      setEfficiencyHistory((prev) => {
        const next = { ...prev };
        updated.forEach((p) => {
          const eff = calculateEfficiency(p.currentData);
          next[p.id] = [...(prev[p.id] ?? []), eff].slice(-60);
        });
        return next;
      });

      // Update maintenance records
      setMaintenanceRecords((prevRecords) => {
        const updatedRecords = prevRecords.map((rec) => {
          const panel = updated.find((p) => p.id === rec.panelId);
          if (!panel) return rec;
          const eff = calculateEfficiency(panel.currentData);
          const newHistory = [...rec.efficiencyHistory, eff].slice(-60);
          const newFaultCount = rec.faultCount + (panel.currentData?.status === "fault" ? 1 : 0);
          const addedEnergy = (panel.currentData?.energyOutput ?? 0) * intervalHours;
          return {
            ...rec,
            efficiencyHistory: newHistory,
            faultCount: newFaultCount,
            totalEnergyGenerated: rec.totalEnergyGenerated + addedEnergy,
          };
        });

        // Regenerate alerts and degradation analysis
        const alerts = generateMaintenanceAlerts(updatedRecords);
        const degradation = updatedRecords.map(analyzeDegradation);
        setMaintenanceAlerts(alerts);
        setDegradationData(degradation);

        return updatedRecords;
      });
    };

    tick();
    intervalRef.current = setInterval(tick, intervalMs);
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [running, speed]);

  const start = () => { setRunning(true); setIsFault(false); };
  const stop  = () => { setRunning(false); setApiOffline(false); setIsFault(false); };

  const reset = () => {
    setRunning(false);
    setApiOffline(false);
    setIsFault(false);
    setPanels(defaultPanels);
    setLogs([]);
    setEfficiencyHistory({});
    setActivePanelId("panel-1");
    setTotalEnergyWh(0);
    setCarbonMetrics(calculateCarbonSavings(0));
    setSuspensionEvents([]);
    setMaintenanceRecords(defaultPanels.map((p) => createMaintenanceRecord(p.id, p.name)));
    setMaintenanceAlerts([]);
    setDegradationData([]);
    logIdRef.current = 0;
  };

  const injectFault = (panelId: string) => {
    setPanels((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, faultInjected: true, faultCount: 6 } : p))
    );
  };

  const resumePanel = (panelId: string) => {
    setPanels((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, suspended: false, criticalHits: 0, faultCount: 0 } : p))
    );
  };

  const activePanel = panels.find((p) => p.id === activePanelId) ?? panels[0];

  return {
    running, speed, setSpeed,
    isFault,
    panels, logs,
    activePanelId, setActivePanelId, activePanel,
    start, stop, reset, injectFault, resumePanel,
    weather, setWeather,
    simMode, setSimMode,
    efficiencyHistory,
    apiOffline,
    maintenanceAlerts,
    degradationData,
    maintenanceRecords,
    carbonMetrics,
    totalEnergyWh,
    suspensionEvents,
  };
}
