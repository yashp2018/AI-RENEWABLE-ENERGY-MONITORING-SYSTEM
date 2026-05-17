import { useState, useEffect, useRef } from "react";
import {
  Sun, Zap, Thermometer, SunDim, BatteryCharging,
  LayoutGrid, CheckCircle2, XCircle, Activity, WifiOff,
  RotateCcw, Shield, TrendingUp,
} from "lucide-react";
import { useMultiPanelSimulation } from "@/hooks/useMultiPanelSimulation";
import { useApiData } from "@/hooks/useApiData";
import { generateInsights } from "@/lib/aiInsights";
import { SimulationControls } from "@/components/SimulationControls";
import { DataCard } from "@/components/DataCard";
import { StatusIndicator } from "@/components/StatusIndicator";
import { LogPanel } from "@/components/LogPanel";
import { RealtimeChart } from "@/components/RealtimeChart";
import { ComparisonChart } from "@/components/ComparisonChart";
import { AlertThresholdsConfig } from "@/components/AlertThresholdsConfig";
import { WeatherControl } from "@/components/WeatherControl";
import { HealthScoreGauge } from "@/components/HealthScoreGauge";
import { EfficiencyPanel } from "@/components/EfficiencyPanel";
import { PanelMapView } from "@/components/PanelMapView";
import { ReportExport } from "@/components/ReportExport";
import { SimulationModeSelector } from "@/components/SimulationModeSelector";
import { HealthCard } from "@/components/HealthCard";
import { AlertsList } from "@/components/AlertsList";
import { PredictionChart } from "@/components/PredictionChart";
import { InsightsPanel } from "@/components/InsightsPanel";
import { FaultPanel } from "@/components/FaultPanel";
import { CarbonTracker } from "@/components/CarbonTracker";
import { PredictiveMaintenance } from "@/components/PredictiveMaintenance";
import { PanelSuspensionAlert } from "@/components/PanelSuspensionAlert";
import { HistoricalAnalytics } from "@/components/HistoricalAnalytics";
import { PredictiveMaintenanceDashboard } from "@/components/PredictiveMaintenanceDashboard";
import { FaultSuspensionSystem } from "@/components/FaultSuspensionSystem";
import { AIRecommendationEngine } from "@/components/AIRecommendationEngine";
import { VoiceAlarmSystem } from "@/components/VoiceAlarmSystem";
import { useVoiceAlarm } from "@/hooks/useVoiceAlarm";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAlertThresholds } from "@/hooks/useAlertThresholds";

const Index = () => {
  const {
    running, speed, setSpeed,
    panels, logs,
    activePanelId, setActivePanelId, activePanel,
    start, stop, reset, injectFault, resumePanel,
    weather, setWeather,
    simMode, setSimMode,
    efficiencyHistory,
    apiOffline,
    maintenanceAlerts,
    degradationData,
    carbonMetrics,
    totalEnergyWh,
    suspensionEvents,
  } = useMultiPanelSimulation();

  const { thresholds, setThresholds, enabled, setEnabled } = useAlertThresholds();
  const api = useApiData();
  const [resetting, setResetting] = useState(false);

  // ── Voice Alarm System ────────────────────────────────────────────────────
  const [alarmEnabled,  setAlarmEnabled]  = useState(true);
  const [voiceEnabled,  setVoiceEnabled]  = useState(true);
  const [alarmSound,    setAlarmSound]    = useState(true);
  const [alarmVolume,   setAlarmVolume]   = useState(0.7);

  const alarm = useVoiceAlarm({
    enabled:      alarmEnabled,
    volume:       alarmVolume,
    alarmEnabled: alarmSound,
    voiceEnabled: voiceEnabled,
  });

  // Fire voice alerts when new API alerts arrive
  const prevAlertIdsRef = useRef<Set<string | number>>(new Set());
  useEffect(() => {
    if (!api.alerts.length) return;
    const newAlerts = api.alerts.filter((a) => !prevAlertIdsRef.current.has(a.id));
    if (newAlerts.length > 0) {
      alarm.triggerAlerts(newAlerts);
      newAlerts.forEach((a) => prevAlertIdsRef.current.add(a.id));
    }
  }, [api.alerts]);

  // Fire voice alert when a panel gets suspended
  const prevSuspendedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    panels.forEach((p) => {
      if (p.suspended && !prevSuspendedRef.current.has(p.id)) {
        prevSuspendedRef.current.add(p.id);
        alarm.triggerSuspension(p.name);
      }
      if (!p.suspended) prevSuspendedRef.current.delete(p.id);
    });
  }, [panels]);

  // Fire voice alert on fault status change
  const prevFaultRef = useRef<Record<string, string>>({});
  useEffect(() => {
    panels.forEach((p) => {
      const prev = prevFaultRef.current[p.id];
      const curr = p.currentData?.status;
      if (curr === "fault" && prev !== "fault" && !p.suspended) {
        alarm.triggerFault(p.name, "Fault detected");
      }
      if (curr) prevFaultRef.current[p.id] = curr;
    });
  }, [panels]);

  // Generate AI insights locally from simulation state
  const localInsights = generateInsights(panels, weather, efficiencyHistory, degradationData);

  // Panel name map for components
  const panelNames = Object.fromEntries(panels.map((p) => [p.id, p.name]));

  const handleReset = async () => {
    setResetting(true);
    stop();
    reset();
    try {
      await fetch("http://localhost:5000/api/reset", { method: "POST" });
    } catch {
      // backend may be offline — local reset still applies
    } finally {
      setResetting(false);
    }
  };

  const handleApiResume = async (panelId: string) => {
    try {
      await fetch("http://localhost:5000/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panelId }),
      });
    } catch { /* ignore */ }
  };

  const sensor = api.sensorData;
  const healthPct = api.health?.health_percentage ?? 0;
  const healthColor =
    healthPct >= 80 ? "text-success" :
    healthPct >= 50 ? "text-warning" : "text-destructive";

  const panelStatus =
    sensor?.status === "fault"   ? "fault" :
    sensor?.status === "warning" ? "warning" :
    sensor?.status               ? "normal" : null;

  const suspendedCount = panels.filter((p) => p.suspended).length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="scan-line flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 glow-primary">
            <Sun className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              AI Renewable Energy Monitor
              <span className="ml-2 text-xs font-normal text-muted-foreground uppercase tracking-widest">
                Industrial Platform v2.0
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Real-time photovoltaic monitoring · Predictive maintenance · AI intelligence
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={resetting}
              className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`} />
              {resetting ? "Resetting…" : "Reset"}
            </Button>
            <ReportExport panels={panels} logs={logs} />
            <AlertThresholdsConfig thresholds={thresholds} enabled={enabled} onUpdate={setThresholds} onToggle={setEnabled} />
            <div className="flex items-center gap-1.5">
              {api.connected ? (
                <>
                  <span className="status-dot bg-success animate-pulse" />
                  <span className="text-xs text-success font-medium">API Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">API Offline</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`status-dot ${running ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
              <span className="text-xs text-muted-foreground font-medium">{running ? "Streaming" : "Idle"}</span>
            </div>
          </div>
        </div>

        {/* ── Backend offline banner ──────────────────────────────────────── */}
        {(!api.connected || apiOffline) && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5">
            <WifiOff className="h-4 w-4 text-warning shrink-0" />
            <p className="text-xs text-warning">
              {apiOffline
                ? "Simulator cannot reach backend at localhost:5000 — start the server with: node server.js"
                : "Backend offline — start the server to see live data"}
            </p>
          </div>
        )}

        {/* ── Panel suspension critical alerts ───────────────────────────── */}
        <PanelSuspensionAlert
          panels={panels}
          suspensionEvents={suspensionEvents}
          onResume={resumePanel}
        />

        {/* ── System Health Overview ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <HealthCard label="Total Panels"    value={api.health?.total_panels  ?? "—"} icon={LayoutGrid}   colorClass="text-accent"      loading={api.loading && !api.health} />
          <HealthCard label="Active Panels"   value={api.health?.active_panels ?? "—"} icon={CheckCircle2} colorClass="text-success"     loading={api.loading && !api.health} />
          <HealthCard label="Faulty Panels"   value={api.health?.faulty_panels ?? "—"} icon={XCircle}      colorClass={api.health && api.health.faulty_panels > 0 ? "text-destructive" : "text-success"} loading={api.loading && !api.health} />
          <HealthCard label="Health %"        value={api.health ? `${api.health.health_percentage}%` : "—"} icon={Activity} colorClass={healthColor} loading={api.loading && !api.health} />
          <HealthCard label="Suspended"       value={suspendedCount} icon={Shield} colorClass={suspendedCount > 0 ? "text-destructive" : "text-muted-foreground"} />
        </div>

        {/* ── Simulation Controls ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <SimulationControls
            running={running} speed={speed} faultInjected={activePanel.faultInjected}
            onStart={start} onStop={stop} onSetSpeed={setSpeed}
            onInjectFault={() => injectFault(activePanelId)}
          />
        </div>

        {/* ── Simulation Mode + Panel Tabs ────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-4">
          <SimulationModeSelector mode={simMode} onModeChange={setSimMode} />
        </div>

        <Tabs value={activePanelId} onValueChange={setActivePanelId}>
          <TabsList className="bg-muted">
            {panels.map((p) => (
              <TabsTrigger
                key={p.id}
                value={p.id}
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className={`status-dot ${
                  p.suspended                          ? "bg-muted-foreground" :
                  p.currentData?.status === "fault"   ? "bg-destructive animate-pulse" :
                  p.currentData?.status === "warning" ? "bg-warning" :
                  p.currentData                       ? "bg-success" : "bg-muted-foreground"
                }`} />
                {p.name}
                {p.suspended && <span className="text-[9px] text-destructive font-bold">OFFLINE</span>}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* ── Weather + Health Gauges ─────────────────────────────────────── */}
        <div className="grid gap-4 md:grid-cols-4">
          <WeatherControl weather={weather} onWeatherChange={setWeather} />
          {panels.map((p) => (
            <HealthScoreGauge key={p.id} data={p.currentData} panelName={p.name} />
          ))}
        </div>

        {/* ── Live Data Cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {api.loading && !sensor ? (
            Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))
          ) : (
            <>
              <DataCard label="Voltage"       value={sensor ? sensor.voltage.toFixed(1)      : "—"} unit="V"    icon={Zap}             />
              <DataCard label="Current"       value={sensor ? sensor.current.toFixed(2)       : "—"} unit="A"    icon={BatteryCharging}  />
              <DataCard label="Temperature"   value={sensor ? sensor.temperature.toFixed(0)   : "—"} unit="°C"   icon={Thermometer}     accentClass="text-warning" />
              <DataCard label="Irradiance"    value={sensor ? sensor.irradiance.toFixed(0)    : "—"} unit="W/m²" icon={SunDim}          accentClass="text-primary" />
              <DataCard label="Energy Output" value={sensor ? sensor.energy_output.toFixed(0) : "—"} unit="W"    icon={Sun}             accentClass="text-primary" />
            </>
          )}
        </div>

        {/* ── Real-Time Charts ────────────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <RealtimeChart data={api.chartHistory} title="Live Metrics — Backend Stream" />
          <ComparisonChart panels={panels} />
        </div>

        {/* ── Panel Efficiency Score ──────────────────────────────────────── */}
        <EfficiencyPanel panels={panels} efficiencyHistory={efficiencyHistory} />

        {/* ── AI Prediction ───────────────────────────────────────────────── */}
        <PredictionChart prediction={api.prediction} loading={api.loading && !api.prediction} />

        {/* ── MODULE 1: Predictive Maintenance Dashboard ──────────────────── */}
        <PredictiveMaintenanceDashboard
          apiMaintenance={api.maintenance}
          localAlerts={maintenanceAlerts}
          degradation={degradationData}
          efficiencyHistory={efficiencyHistory}
          panelNames={panelNames}
        />

        {/* ── MODULE 2 + 3: Fault Suspension System + AI Recommendation Engine */}
        <div className="grid gap-4 lg:grid-cols-2">
          <FaultSuspensionSystem
            faultData={api.faultData}
            panels={panels}
            suspensionEvents={suspensionEvents}
            onResume={resumePanel}
            onApiResume={handleApiResume}
          />
          <AIRecommendationEngine
            apiRecommendations={api.recommendations}
            localInsights={localInsights}
            loading={running && localInsights.length === 0}
          />
        </div>

        {/* ── Carbon Tracker ──────────────────────────────────────────────── */}
        <CarbonTracker metrics={carbonMetrics} totalEnergyWh={totalEnergyWh} />

        {/* ── Historical Analytics ────────────────────────────────────────── */}
        <HistoricalAnalytics logs={logs} />

        {/* ── Voice Alarm System ─────────────────────────────────────────────── */}
        <VoiceAlarmSystem
          enabled={alarmEnabled}
          voiceEnabled={voiceEnabled}
          alarmEnabled={alarmSound}
          volume={alarmVolume}
          isAlarming={alarm.isAlarming}
          alarmEvents={alarm.alarmEvents}
          onToggleEnabled={() => setAlarmEnabled((v) => !v)}
          onToggleVoice={() => setVoiceEnabled((v) => !v)}
          onToggleAlarm={() => setAlarmSound((v) => !v)}
          onVolumeChange={setAlarmVolume}
          onStopAlarm={alarm.stopAlarm}
          onClearEvents={alarm.clearEvents}
          onTestWarning={() => alarm.triggerAlerts([{
            id: `test-warn-${Date.now()}`,
            message: "Test warning: Panel efficiency dropping below threshold.",
            severity: "warning",
            panel: "Test Panel",
          }])}
          onTestCritical={() => alarm.triggerAlerts([{
            id: `test-crit-${Date.now()}`,
            message: "Test critical: Panel overheating detected. Immediate action required.",
            severity: "critical",
            panel: "Test Panel",
          }])}
        />

        {/* ── Smart Alerts + Fault Visualization ─────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <AlertsList
            alerts={api.alerts}
            maintenanceAlerts={maintenanceAlerts}
            loading={api.loading && api.alerts.length === 0}
          />
          <FaultPanel health={api.health} sensorData={api.sensorData} loading={api.loading && !api.health} />
        </div>

        {/* ── Panel Map ───────────────────────────────────────────────────── */}
        <PanelMapView panels={panels} activePanelId={activePanelId} onSelectPanel={setActivePanelId} />

        {/* ── Status + Log ────────────────────────────────────────────────── */}
        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          <StatusIndicator status={panelStatus} data={activePanel.currentData} />
          <LogPanel logs={logs} running={running} speed={speed} apiOffline={apiOffline} />
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-border pt-4 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">
              AI Renewable Energy Monitor · Industrial Platform
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {new Date().toLocaleDateString()} · {panels.filter((p) => !p.suspended).length}/{panels.length} panels active
          </span>
        </div>

      </div>
    </div>
  );
};

export default Index;
