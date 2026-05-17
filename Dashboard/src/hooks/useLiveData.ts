import { useState, useEffect, useRef, useCallback } from "react";

const BASE_URL = "http://localhost:5000/api";
const POLL_MS = 2000;

export interface LivePanel {
  id: string;
  status: "active" | "warning" | "fault";
  energyOutput: number;
  temperature: number;
  voltage: number;
  current: number;
  irradiance: number;
  updatedAt: string;
}

export interface LiveAlert {
  id: string | number;
  severity: "critical" | "warning" | "normal";
  message: string;
  panel: string;
  timestamp: string;
  dismissed?: boolean;
}

export interface LiveStats {
  totalGenerated: string;
  activePanels: number;
  faultyPanels: number;
  efficiency: number;
}

export interface ChartPoint {
  time: string;
  output: number;
}

export interface DailyPoint {
  day: string;
  output: number;
}

// Numbered W reading — each incoming energy value gets a sequential number
export interface WReading {
  n: number;       // 1, 2, 3, 4 ...
  w: number;       // watt value
  time: string;    // HH:MM:SS
}

// Accumulated energy totals per period
export interface EnergyTotals {
  day: number;    // W accumulated today
  week: number;   // W accumulated this week
  month: number;  // W accumulated this month
  total: number;  // W accumulated all-time
}

export interface LivePrediction {
  predictions: { step: number; value: number; timestamp: string }[];
  confidence: number;
}

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function useLiveData() {
  const [panels, setPanels] = useState<LivePanel[]>([]);
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [stats, setStats] = useState<LiveStats>({ totalGenerated: "—", activePanels: 0, faultyPanels: 0, efficiency: 0 });
  const [hourlyData, setHourlyData] = useState<ChartPoint[]>([]);
  const [dailyData, setDailyData] = useState<DailyPoint[]>([]);
  const [prediction, setPrediction] = useState<LivePrediction | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  // Numbered W readings (max 100 kept for display)
  const [wReadings, setWReadings] = useState<WReading[]>([]);
  // Accumulated energy totals
  const [energyTotals, setEnergyTotals] = useState<EnergyTotals>({ day: 0, week: 0, month: 0, total: 0 });

  const chartHistoryRef  = useRef<ChartPoint[]>([]);
  const dismissedRef     = useRef<Set<string | number>>(new Set());
  const wCounterRef      = useRef(0);          // sequential W reading number
  const lastEnergyRef    = useRef(0);          // last seen energy value to detect new readings
  const totalsRef        = useRef<EnergyTotals>({ day: 0, week: 0, month: 0, total: 0 });
  const lastDayRef       = useRef(new Date().getDate());
  const lastWeekRef      = useRef(getWeekNumber(new Date()));
  const lastMonthRef     = useRef(new Date().getMonth());

  function getWeekNumber(d: Date) {
    const oneJan = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
  }

  const dismissAlert = useCallback((id: string | number) => {
    dismissedRef.current.add(id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a)));
  }, []);

  const fetchAll = useCallback(async () => {
    const [rawRecords, rawAlerts, rawHealth, rawPred, rawPanels] = await Promise.all([
      safeFetch<any[]>(`${BASE_URL}/data`),
      safeFetch<any[]>(`${BASE_URL}/alerts`),
      safeFetch<any>(`${BASE_URL}/health`),
      safeFetch<any>(`${BASE_URL}/prediction`),
      safeFetch<Record<string, any>>(`${BASE_URL}/panels`),
    ]);

    const ok = rawHealth !== null || (Array.isArray(rawRecords) && rawRecords.length > 0);
    setConnected(ok);

    // ── Panels ────────────────────────────────────────────────────────────
    if (rawPanels && typeof rawPanels === "object") {
      const mapped: LivePanel[] = Object.entries(rawPanels).map(([id, p]: [string, any]) => ({
        id,
        status: p.status === "fault" ? "fault" : p.status === "warning" ? "warning" : "active",
        energyOutput: +(p.energy ?? 0).toFixed(1),
        temperature: +(p.temperature ?? 0).toFixed(0),
        voltage: +(p.voltage ?? 0).toFixed(1),
        current: +(p.current ?? 0).toFixed(2),
        irradiance: +(p.irradiance ?? 0).toFixed(0),
        updatedAt: p.updatedAt ?? p.timestamp ?? "",
      }));
      setPanels(mapped);
    }

    // ── Health / Stats ────────────────────────────────────────────────────
    if (rawHealth) {
      const active = rawHealth.activePanels ?? rawHealth.active_panels ?? 0;
      const faulty = rawHealth.faultyPanels ?? rawHealth.faulty_panels ?? 0;
      const pct    = rawHealth.healthPercentage ?? rawHealth.health_percentage ?? 0;

      const totalW = totalsRef.current.total;
      setStats({
        totalGenerated: totalW > 0 ? `${totalW.toFixed(1)} W` : `${active} panels active`,
        activePanels: active,
        faultyPanels: faulty,
        efficiency: pct,
      });
    }

    // ── Hourly chart + numbered W readings ───────────────────────────────
    if (Array.isArray(rawRecords) && rawRecords.length > 0) {
      const latest = rawRecords[rawRecords.length - 1];
      const energyVal = +(latest.energy ?? 0).toFixed(1);
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      // Only add a new numbered W reading when we get a new value
      if (energyVal !== lastEnergyRef.current || wCounterRef.current === 0) {
        lastEnergyRef.current = energyVal;
        wCounterRef.current += 1;
        const n = wCounterRef.current;

        // Accumulate into period totals
        const now = new Date();
        const currentDay   = now.getDate();
        const currentWeek  = getWeekNumber(now);
        const currentMonth = now.getMonth();

        // Reset day/week/month accumulators when period rolls over
        if (currentDay !== lastDayRef.current) {
          totalsRef.current.day = 0;
          lastDayRef.current = currentDay;
        }
        if (currentWeek !== lastWeekRef.current) {
          totalsRef.current.week = 0;
          lastWeekRef.current = currentWeek;
        }
        if (currentMonth !== lastMonthRef.current) {
          totalsRef.current.month = 0;
          lastMonthRef.current = currentMonth;
        }

        totalsRef.current.day   += energyVal;
        totalsRef.current.week  += energyVal;
        totalsRef.current.month += energyVal;
        totalsRef.current.total += energyVal;

        const snap = { ...totalsRef.current };
        setEnergyTotals(snap);

        setWReadings((prev) => [
          ...prev,
          { n, w: energyVal, time: timeStr },
        ].slice(-100));
      }

      chartHistoryRef.current = [
        ...chartHistoryRef.current,
        { time: timeStr, output: energyVal },
      ].slice(-30);
      setHourlyData([...chartHistoryRef.current]);
    }

    // ── Daily chart ───────────────────────────────────────────────────────
    if (Array.isArray(rawRecords) && rawRecords.length > 0) {
      const byDay: Record<string, number> = {};
      rawRecords.forEach((r) => {
        const d = r.timestamp ? new Date(r.timestamp) : new Date();
        const label = DAYS[d.getDay()];
        byDay[label] = (byDay[label] ?? 0) + (r.energy ?? 0);
      });
      const daily = Object.entries(byDay).map(([day, output]) => ({ day, output: +output.toFixed(1) }));
      if (daily.length > 0) setDailyData(daily);
    }

    // ── Alerts ────────────────────────────────────────────────────────────
    if (Array.isArray(rawAlerts)) {
      const mapped: LiveAlert[] = rawAlerts.map((a: any, i: number) => ({
        id: a.id ?? i,
        severity: a.severity === "critical" ? "critical" : a.severity === "warning" ? "warning" : "normal",
        message: a.message ?? a.type ?? "Alert",
        panel: a.panelId ?? a.panel ?? "—",
        timestamp: a.timestamp ?? "",
        dismissed: dismissedRef.current.has(a.id ?? i),
      }));
      setAlerts(mapped);
    }

    // ── Prediction ────────────────────────────────────────────────────────
    if (rawPred) {
      setPrediction({
        predictions: rawPred.predictions ?? [],
        confidence: rawPred.confidence ?? 0,
      });
    }

    setLastUpdated(new Date());
    setIsLoading(false);
  }, []);

  const resetSystem = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/reset`, { method: 'POST' });
      if (!res.ok) return false;
      setPanels([]);
      setAlerts([]);
      setStats({ totalGenerated: '—', activePanels: 0, faultyPanels: 0, efficiency: 0 });
      setHourlyData([]);
      setDailyData([]);
      setPrediction(null);
      setWReadings([]);
      setEnergyTotals({ day: 0, week: 0, month: 0, total: 0 });
      chartHistoryRef.current = [];
      dismissedRef.current = new Set();
      wCounterRef.current = 0;
      lastEnergyRef.current = 0;
      totalsRef.current = { day: 0, week: 0, month: 0, total: 0 };
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(id);
  }, [fetchAll]);

  return {
    panels, alerts, stats,
    hourlyData, dailyData, prediction,
    lastUpdated, isLoading, connected,
    dismissAlert, resetSystem,
    wReadings, energyTotals,
  };
}
