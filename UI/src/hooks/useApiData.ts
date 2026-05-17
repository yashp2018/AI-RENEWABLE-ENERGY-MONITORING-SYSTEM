import { useState, useEffect, useRef, useCallback } from "react";

export interface ApiSensorData {
  voltage: number;
  current: number;
  temperature: number;
  irradiance: number;
  energy_output: number; // normalised from backend `energy` field
  panel_id?: string;
  status?: string;
  timestamp?: string;
}

export interface ApiAlert {
  id: string | number;
  message: string;
  severity: "info" | "warning" | "critical";
  timestamp?: string;
  panel?: string;
}

export interface ApiHealth {
  total_panels: number;
  active_panels: number;
  faulty_panels: number;
  health_percentage: number;
  status?: string;
}

// Raw shapes returned by the backend (camelCase)
interface RawHealth {
  totalPanels?: number;
  activePanels?: number;
  faultyPanels?: number;
  healthPercentage?: number;
  // snake_case variants (future-proof)
  total_panels?: number;
  active_panels?: number;
  faulty_panels?: number;
  health_percentage?: number;
}

interface RawRecord {
  panelId?: string;
  voltage?: number;
  current?: number;
  temperature?: number;
  irradiance?: number;
  energy?: number;        // backend field name
  energy_output?: number; // fallback
  status?: string;
  timestamp?: string;
}

interface RawAlert {
  id?: string | number;
  panelId?: string;
  panel?: string;
  message?: string;
  type?: string;
  severity?: string;
  timestamp?: string;
}

interface RawPrediction {
  predictions?: { step: number; value: number; timestamp: string }[];
  predicted_values?: number[];
  confidence?: number;
}

export interface ApiPrediction {
  predicted_values: number[];
  actual_values?: number[];
  confidence: number;
  timestamps?: string[];
}

export interface ApiInsight {
  id: string | number;
  text: string;
  severity: "info" | "warning" | "critical";
  panel?: string;
}

export interface ChartPoint {
  time: string;
  voltage: number;
  current: number;
  energyOutput: number;
}

export interface ApiMaintenance {
  id: number;
  panelId: string;
  type: string;
  status: "healthy" | "maintenance_required" | "critical_maintenance";
  message: string;
  recommendation: string;
  priority: "low" | "medium" | "high" | "critical";
  scheduledDate: string | null;
  createdAt: string;
}

export interface ApiRecommendation {
  id: number;
  panelId: string;
  type: string;
  severity: "low" | "medium" | "critical";
  message: string;
  action: string;
  createdAt: string;
}

export interface ApiFault {
  id: number;
  panelId: string;
  faultType: string;
  severity: "warning" | "critical";
  description: string;
  suspended: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

export interface ApiFaultData {
  faults: ApiFault[];
  suspended: Record<string, { panelId: string; reason: string; faultType: string; suspendedAt: string }>;
  totalFaults: number;
  criticalFaults: number;
}

export interface ApiState {
  sensorData: ApiSensorData | null;
  alerts: ApiAlert[];
  health: ApiHealth | null;
  prediction: ApiPrediction | null;
  insights: ApiInsight[];
  chartHistory: ChartPoint[];
  maintenance: ApiMaintenance[];
  recommendations: ApiRecommendation[];
  faultData: ApiFaultData | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
}

const MAX_POINTS = 30;
const BASE_URL = "http://localhost:5000/api";

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function useApiData() {
  const [state, setState] = useState<ApiState>({
    sensorData: null,
    alerts: [],
    health: null,
    prediction: null,
    insights: [],
    chartHistory: [],
    maintenance: [],
    recommendations: [],
    faultData: null,
    loading: true,
    error: null,
    connected: false,
  });

  const chartHistoryRef = useRef<ChartPoint[]>([]);

  const fetchAll = useCallback(async () => {
    const [rawRecords, rawAlerts, rawHealth, rawPred, rawMaint, rawRecs, rawFaults] = await Promise.all([
      safeFetch<RawRecord[]>(`${BASE_URL}/data`),
      safeFetch<RawAlert[]>(`${BASE_URL}/alerts`),
      safeFetch<RawHealth>(`${BASE_URL}/health`),
      safeFetch<RawPrediction>(`${BASE_URL}/prediction`),
      safeFetch<ApiMaintenance[]>(`${BASE_URL}/maintenance?limit=50`),
      safeFetch<ApiRecommendation[]>(`${BASE_URL}/recommendations?limit=30`),
      safeFetch<ApiFaultData>(`${BASE_URL}/faults?limit=50`),
    ]);

    // ── Sensor: use the most recent record from the array ──────────────────
    const latestRaw: RawRecord | null =
      Array.isArray(rawRecords) && rawRecords.length > 0
        ? rawRecords[rawRecords.length - 1]
        : null;
    const sensor: ApiSensorData | null = latestRaw
      ? {
          voltage: latestRaw.voltage ?? 0,
          current: latestRaw.current ?? 0,
          temperature: latestRaw.temperature ?? 0,
          irradiance: latestRaw.irradiance ?? 0,
          energy_output: latestRaw.energy ?? latestRaw.energy_output ?? 0,
          panel_id: latestRaw.panelId,
          status: latestRaw.status,
          timestamp: latestRaw.timestamp,
        }
      : null;

    // ── Alerts: normalise field names ──────────────────────────────────────
    const alertList: ApiAlert[] = Array.isArray(rawAlerts)
      ? rawAlerts.map((a, i) => ({
          id: a.id ?? i,
          message: a.message ?? a.type ?? "Alert",
          severity: (a.severity as ApiAlert["severity"]) ?? "warning",
          timestamp: a.timestamp,
          panel: a.panel ?? a.panelId,
        }))
      : [];

    // ── Health: normalise camelCase → snake_case ───────────────────────────
    const healthData: ApiHealth | null = rawHealth
      ? {
          total_panels: rawHealth.totalPanels ?? rawHealth.total_panels ?? 0,
          active_panels: rawHealth.activePanels ?? rawHealth.active_panels ?? 0,
          faulty_panels: rawHealth.faultyPanels ?? rawHealth.faulty_panels ?? 0,
          health_percentage: rawHealth.healthPercentage ?? rawHealth.health_percentage ?? 0,
        }
      : null;

    // ── Prediction: normalise {predictions:[{value}]} → {predicted_values} ─
    const predData: ApiPrediction | null = rawPred
      ? {
          predicted_values:
            rawPred.predicted_values ??
            (rawPred.predictions ?? []).map((p) => p.value),
          confidence: rawPred.confidence ?? 0,
          timestamps: (rawPred.predictions ?? []).map((p) => p.timestamp),
        }
      : null;

    // ── Insights from alerts ───────────────────────────────────────────────
    const insights: ApiInsight[] = alertList.map((a) => ({
      id: a.id,
      text: a.message,
      severity: a.severity,
      panel: a.panel,
    }));

    const connected = sensor !== null || healthData !== null;

    if (sensor) {
      const timeStr = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      chartHistoryRef.current = [
        ...chartHistoryRef.current,
        { time: timeStr, voltage: sensor.voltage, current: sensor.current, energyOutput: sensor.energy_output },
      ].slice(-MAX_POINTS);
    }

    setState((prev) => ({
      ...prev,
      sensorData: sensor ?? prev.sensorData,
      alerts: alertList.length > 0 ? alertList : prev.alerts,
      health: healthData ?? prev.health,
      prediction: predData ?? prev.prediction,
      insights,
      chartHistory: [...chartHistoryRef.current],
      maintenance: Array.isArray(rawMaint) ? rawMaint : prev.maintenance,
      recommendations: Array.isArray(rawRecs) ? rawRecs : prev.recommendations,
      faultData: rawFaults ?? prev.faultData,
      loading: false,
      error: connected ? null : "Cannot reach backend at localhost:5000",
      connected,
    }));
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 2000);
    return () => clearInterval(id);
  }, [fetchAll]);

  return state;
}
