import { useState } from "react";
import { useLiveData } from "@/hooks/useLiveData";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TrendingUp, ShieldAlert, WifiOff, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const Predictions = () => {
  const { prediction, connected, resetSystem } = useLiveData();
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetting, setResetting]     = useState(false);
  const [resetDone, setResetDone]     = useState(false);

  const chartData = prediction?.predictions.map((p) => ({
    day: `+${p.step}`,
    predicted: +p.value.toFixed(1),
  })) ?? [];

  const handleReset = async () => {
    setResetting(true);
    const ok = await resetSystem();
    setResetting(false);
    setShowConfirm(false);
    if (ok) {
      setResetDone(true);
      setTimeout(() => setResetDone(false), 4000);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Predictions</h1>
            <p className="text-sm text-muted-foreground mt-1">AI-powered energy forecasting from live backend</p>
          </div>

          {/* ── RESET DEMO BUTTON ── */}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!connected || resetting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
              bg-destructive/10 border border-destructive/30 text-destructive
              hover:bg-destructive/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
            {resetting ? "Resetting…" : "Reset Demo"}
          </button>
        </div>

        {/* ── RESET SUCCESS BANNER ── */}
        {resetDone && (
          <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-primary">System reset successfully</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                All sensor data, alerts, and predictions have been cleared. The simulator will begin populating fresh data on the next tick.
              </p>
            </div>
          </div>
        )}

        {/* ── OFFLINE BANNER ── */}
        {!connected && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5">
            <WifiOff className="h-4 w-4 text-warning shrink-0" />
            <p className="text-xs text-warning">Backend offline — start server and simulator to generate predictions</p>
          </div>
        )}

        {/* ── DEMO RESET INFO CARD (always visible, for faculty) ── */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Demo Reset — For Faculty & Teachers</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Use the <span className="text-destructive font-semibold">Reset Demo</span> button (top right) to instantly clear all
            accumulated sensor readings, alerts, and prediction history from the backend.
            This gives you a <span className="text-foreground font-medium">clean slate</span> before each demonstration
            without needing to restart the server or simulator.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {[
              { label: "Clears",       value: "All sensor records"     },
              { label: "Resets",       value: "All alerts & counters"  },
              { label: "Restarts",     value: "Prediction history"     },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── PREDICTION CHART ── */}
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Energy Forecast (next 10 steps)</h3>
            </div>
            {prediction && (
              <span className="text-xs font-mono text-muted-foreground">
                Confidence: <span className="text-foreground font-semibold">{prediction.confidence}%</span>
              </span>
            )}
          </div>
          {chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
              {connected ? "Waiting for enough data to generate predictions…" : "Start backend + simulator to see predictions"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="hsl(142 70% 45%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(142 70% 45%)" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                <XAxis dataKey="day" tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(220 18% 12%)", border: "1px solid hsl(220 14% 18%)", borderRadius: "8px", color: "hsl(210 20% 92%)", fontSize: 12 }} />
                <Area type="monotone" dataKey="predicted" stroke="hsl(142 70% 45%)" fill="url(#gradPredicted)" strokeWidth={2} name="Predicted (W)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── SUMMARY CARDS ── */}
        {prediction && (
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Prediction Summary</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card p-4 text-center">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className={`text-xl font-bold mt-1 ${
                  prediction.confidence >= 80 ? "text-primary" :
                  prediction.confidence >= 50 ? "text-accent" : "text-destructive"
                }`}>{prediction.confidence}%</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-xs text-muted-foreground">Steps Ahead</p>
                <p className="text-xl font-bold mt-1 text-primary">{prediction.predictions.length}</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-xs text-muted-foreground">Avg Predicted (W)</p>
                <p className="text-xl font-bold mt-1 text-accent">
                  {prediction.predictions.length > 0
                    ? (prediction.predictions.reduce((s, p) => s + p.value, 0) / prediction.predictions.length).toFixed(1)
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── CONFIRMATION DIALOG ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-fade-in">

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Reset Demo System?</h2>
                <p className="text-xs text-muted-foreground mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-2 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground text-sm">The following will be permanently cleared:</p>
              <ul className="space-y-1.5 mt-2">
                {[
                  "All sensor readings from Panel-A, Panel-B, Panel-C",
                  "All generated alerts and fault notifications",
                  "All prediction history and confidence scores",
                  "Panel status and health metrics",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-primary font-medium">
                ✓ The simulator will automatically repopulate fresh data on the next tick.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <RotateCcw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
                {resetting ? "Resetting…" : "Yes, Reset Everything"}
              </button>
            </div>

          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default Predictions;
