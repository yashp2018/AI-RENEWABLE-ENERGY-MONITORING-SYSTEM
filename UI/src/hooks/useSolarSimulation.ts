import { useState, useRef, useCallback, useEffect } from "react";

export type PanelStatus = "normal" | "warning" | "fault";

export interface SolarData {
  voltage: number;
  current: number;
  temperature: number;
  irradiance: number;
  energyOutput: number;
  status: PanelStatus;
  timestamp: Date;
}

export interface LogEntry {
  id: number;
  timestamp: Date;
  data: SolarData;
}

const generateNormalData = (): Omit<SolarData, "timestamp"> => ({
  voltage: 28 + Math.random() * 8,
  current: 7 + Math.random() * 3,
  temperature: 25 + Math.random() * 15,
  irradiance: 800 + Math.random() * 200,
  energyOutput: 200 + Math.random() * 100,
  status: "normal",
});

const generateWarningData = (): Omit<SolarData, "timestamp"> => ({
  voltage: 20 + Math.random() * 5,
  current: 4 + Math.random() * 2,
  temperature: 55 + Math.random() * 15,
  irradiance: 400 + Math.random() * 200,
  energyOutput: 80 + Math.random() * 60,
  status: "warning",
});

const generateFaultData = (): Omit<SolarData, "timestamp"> => ({
  voltage: 2 + Math.random() * 5,
  current: 0.5 + Math.random() * 1,
  temperature: 70 + Math.random() * 20,
  irradiance: 100 + Math.random() * 150,
  energyOutput: 5 + Math.random() * 15,
  status: "fault",
});

export function useSolarSimulation() {
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentData, setCurrentData] = useState<SolarData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [faultInjected, setFaultInjected] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logIdRef = useRef(0);
  const faultCountRef = useRef(0);

  const sendToBackend = useCallback(async (data: SolarData) => {
    const payload = {
      panelId: "Panel-A",
      voltage: data.voltage,
      current: data.current,
      temperature: data.temperature,
      irradiance: data.irradiance,
      energy: data.energyOutput,
      timestamp: data.timestamp,
    };
    try {
      await fetch("http://localhost:5000/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("Data sent to backend", payload);
    } catch (err) {
      console.error("Failed to send data to backend:", err);
    }
  }, []);

  const tick = useCallback(() => {
    let dataGen: Omit<SolarData, "timestamp">;

    if (faultCountRef.current > 0) {
      faultCountRef.current--;
      dataGen = faultCountRef.current > 2 ? generateFaultData() : generateWarningData();
      if (faultCountRef.current === 0) setFaultInjected(false);
    } else {
      dataGen = Math.random() > 0.92 ? generateWarningData() : generateNormalData();
    }

    const data: SolarData = { ...dataGen, timestamp: new Date() };
    setCurrentData(data);
    logIdRef.current++;
    setLogs((prev) => [{ id: logIdRef.current, timestamp: new Date(), data }, ...prev].slice(0, 10));
    sendToBackend(data);
  }, [sendToBackend]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 2000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, speed, tick]);

  const start = () => setRunning(true);
  const stop = () => setRunning(false);

  const injectFault = () => {
    faultCountRef.current = 6;
    setFaultInjected(true);
  };

  return { running, speed, setSpeed, currentData, logs, faultInjected, start, stop, injectFault };
}
