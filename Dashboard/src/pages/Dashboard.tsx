import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { ShimmerCard } from "@/components/ShimmerCard";
import { LiveIndicator } from "@/components/LiveIndicator";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { WeatherPanel } from "@/components/WeatherPanel";
import { EnergyGenerationPanel } from "@/components/EnergyGenerationPanel";
import { useLiveData } from "@/hooks/useLiveData";
import { Zap, Sun, AlertTriangle, Gauge, WifiOff } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "hsl(220 18% 12%)",
    border: "1px solid hsl(220 14% 18%)",
    borderRadius: "8px",
    color: "hsl(210 20% 92%)",
    fontSize: 12,
  },
};

const Dashboard = () => {
  const {
    hourlyData, dailyData, stats,
    lastUpdated, isLoading, connected, alerts,
    wReadings, energyTotals,
  } = useLiveData();

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time renewable energy overview</p>
          </div>
          <div className="flex items-center gap-3">
            {!connected && (
              <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-1.5">
                <WifiOff className="h-3.5 w-3.5 text-warning" />
                <span className="text-xs text-warning">Backend offline — start server to see live data</span>
              </div>
            )}
            <LiveIndicator lastUpdated={lastUpdated} />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <><ShimmerCard /><ShimmerCard /><ShimmerCard /><ShimmerCard /></>
          ) : (
            <>
              <StatCard
                title="Total Energy Generated"
                value={stats.totalGenerated}
                icon={Zap}
                trend={connected ? "Live from backend" : "No backend connection"}
              />
              <StatCard
                title="Active Panels"
                value={stats.activePanels}
                icon={Sun}
                colorClass="text-info"
                trend={stats.activePanels > 0 ? `${stats.efficiency}% health` : "Waiting for data"}
              />
              <StatCard
                title="Faulty Panels"
                value={stats.faultyPanels}
                icon={AlertTriangle}
                colorClass={stats.faultyPanels > 0 ? "text-destructive" : "text-primary"}
                trend={stats.faultyPanels > 0 ? "Requires attention" : "All panels healthy"}
              />
              <StatCard
                title="System Health"
                value={stats.efficiency}
                suffix="%"
                icon={Gauge}
                colorClass="text-accent"
                trend={stats.efficiency >= 80 ? "Above target" : stats.efficiency >= 50 ? "Below target" : "Critical"}
              />
            </>
          )}
        </div>

        {/* ── Energy Generation Panel (Day / Week / Month / Total + numbered W) */}
        <EnergyGenerationPanel
          wReadings={wReadings}
          energyTotals={energyTotals}
          connected={connected}
        />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Real-Time Energy Output
              {connected && <span className="ml-2 text-[10px] text-primary font-mono">● LIVE</span>}
            </h3>
            {hourlyData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                {connected ? "Waiting for simulator data…" : "Start backend + simulator to see data"}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                  <XAxis dataKey="time" tick={{ fill: "hsl(215 15% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215 15% 55%)", fontSize: 11 }} axisLine={false} tickLine={false} unit=" W" />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v.toFixed(1)} W`, "Output"]} />
                  <Line
                    type="monotone" dataKey="output" stroke="hsl(142 70% 45%)" strokeWidth={2}
                    dot={{ fill: "hsl(142 70% 45%)", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5 }} isAnimationActive animationDuration={400}
                    name="Energy (W)"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Daily Output by Day</h3>
            {dailyData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                {connected ? "Accumulating daily data…" : "Start backend + simulator to see data"}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                  <XAxis dataKey="day" tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215 15% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} unit=" W" />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v.toFixed(1)} W`, "Output"]} />
                  <Bar dataKey="output" fill="hsl(200 80% 55%)" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={400} name="Energy (W)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Weather & AI Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeatherPanel />
          <AIInsightsPanel alerts={alerts} connected={connected} />
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
