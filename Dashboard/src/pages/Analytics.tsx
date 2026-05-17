import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, BarChart3, TrendingUp, Grid3X3 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const chartTooltipStyle = {
  backgroundColor: "hsl(220 18% 12%)",
  border: "1px solid hsl(220 14% 18%)",
  borderRadius: "8px",
  color: "hsl(210 20% 92%)",
  fontSize: 12,
};
const tickStyle = { fill: "hsl(215 15% 55%)", fontSize: 11 };
const gridStroke = "hsl(220 14% 18%)";

// --- Mock data generators ---
const generateHistorical = (period: string) => {
  if (period === "daily") {
    return Array.from({ length: 24 }, (_, i) => {
      const h = i.toString().padStart(2, "0") + ":00";
      const base = Math.sin((i - 6) * (Math.PI / 12)) * 800 + 200;
      return { label: h, solar: Math.max(0, Math.round(base + Math.random() * 80)), wind: Math.round(120 + Math.random() * 200) };
    });
  }
  if (period === "weekly") {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((d) => ({ label: d, solar: Math.round(3000 + Math.random() * 2500), wind: Math.round(1200 + Math.random() * 1500) }));
  }
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => ({
    label: m, solar: Math.round(80000 + Math.random() * 60000), wind: Math.round(40000 + Math.random() * 30000),
  }));
};

const panelPerformance = [
  { panel: "SP-001", efficiency: 94, output: 42.3, uptime: 99.2 },
  { panel: "SP-002", efficiency: 91, output: 39.8, uptime: 98.7 },
  { panel: "SP-003", efficiency: 68, output: 28.1, uptime: 87.3 },
  { panel: "SP-004", efficiency: 95, output: 41.5, uptime: 99.5 },
  { panel: "SP-005", efficiency: 12, output: 2.1, uptime: 23.1 },
  { panel: "SP-006", efficiency: 92, output: 40.2, uptime: 99.0 },
  { panel: "SP-007", efficiency: 55, output: 22.7, uptime: 78.4 },
  { panel: "SP-008", efficiency: 96, output: 43.1, uptime: 99.8 },
  { panel: "SP-009", efficiency: 89, output: 38.9, uptime: 97.6 },
  { panel: "SP-010", efficiency: 18, output: 5.2, uptime: 34.2 },
  { panel: "SP-011", efficiency: 93, output: 41.8, uptime: 99.1 },
  { panel: "SP-012", efficiency: 87, output: 37.4, uptime: 96.5 },
];

const radarData = [
  { metric: "Efficiency", value: 88 },
  { metric: "Uptime", value: 92 },
  { metric: "Output", value: 85 },
  { metric: "Health", value: 78 },
  { metric: "ROI", value: 90 },
  { metric: "Reliability", value: 86 },
];

const heatmapHours = Array.from({ length: 24 }, (_, i) => i);
const heatmapDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const heatmapData = heatmapDays.map((day) =>
  heatmapHours.map((hour) => {
    const base = Math.sin((hour - 6) * (Math.PI / 12)) * 80 + 20;
    return Math.max(0, Math.round(base + (Math.random() - 0.3) * 30));
  })
);

const getHeatColor = (val: number) => {
  if (val <= 0) return "hsl(220 14% 14%)";
  if (val < 25) return "hsl(200 80% 20%)";
  if (val < 50) return "hsl(142 70% 25%)";
  if (val < 75) return "hsl(142 70% 40%)";
  return "hsl(142 70% 50%)";
};

const Analytics = () => {
  const [period, setPeriod] = useState("daily");
  const [selectedPanel, setSelectedPanel] = useState("all");

  const historicalData = useMemo(() => generateHistorical(period), [period]);

  const filteredPanels = selectedPanel === "all"
    ? panelPerformance
    : panelPerformance.filter((p) => p.panel === selectedPanel);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Historical trends & performance insights</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="w-4 h-4" /> Export PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Period:</span>
            <Tabs value={period} onValueChange={setPeriod}>
              <TabsList>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Panel:</span>
            <Select value={selectedPanel} onValueChange={setSelectedPanel}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Panels</SelectItem>
                {panelPerformance.map((p) => (
                  <SelectItem key={p.panel} value={p.panel}>{p.panel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Historical Trends */}
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Historical Energy Trends</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: "hsl(215 15% 55%)" }} />
              <Line type="monotone" dataKey="solar" name="Solar" stroke="hsl(142 70% 45%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="wind" name="Wind" stroke="hsl(200 80% 55%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Panel Performance + Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[hsl(var(--info))]" />
              <h3 className="text-sm font-semibold text-foreground">Panel-wise Performance</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredPanels} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="panel" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="efficiency" name="Efficiency %" fill="hsl(142 70% 45%)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="uptime" name="Uptime %" fill="hsl(200 80% 55%)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-6 animate-fade-in">
            <h3 className="text-sm font-semibold text-foreground mb-4">System Health Radar</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke={gridStroke} />
                <PolarAngleAxis dataKey="metric" tick={tickStyle} />
                <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                <Radar dataKey="value" stroke="hsl(142 70% 45%)" fill="hsl(142 70% 45%)" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Efficiency Heatmap */}
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Grid3X3 className="w-4 h-4 text-[hsl(var(--accent))]" />
            <h3 className="text-sm font-semibold text-foreground">Efficiency Heatmap (% by Hour & Day)</h3>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Hour labels */}
              <div className="flex ml-12 mb-1">
                {heatmapHours.filter((_, i) => i % 2 === 0).map((h) => (
                  <div key={h} className="text-[10px] text-muted-foreground" style={{ width: `${100 / 12}%` }}>
                    {h.toString().padStart(2, "0")}
                  </div>
                ))}
              </div>
              {heatmapDays.map((day, di) => (
                <div key={day} className="flex items-center gap-1 mb-[2px]">
                  <span className="text-[10px] text-muted-foreground w-10 text-right shrink-0">{day}</span>
                  <div className="flex flex-1 gap-[1px]">
                    {heatmapData[di].map((val, hi) => (
                      <div
                        key={hi}
                        className="flex-1 h-6 rounded-sm transition-colors"
                        style={{ backgroundColor: getHeatColor(val) }}
                        title={`${day} ${hi}:00 — ${val}%`}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center gap-3 mt-3 ml-12">
                <span className="text-[10px] text-muted-foreground">Low</span>
                {[0, 25, 50, 75, 100].map((v) => (
                  <div key={v} className="w-5 h-3 rounded-sm" style={{ backgroundColor: getHeatColor(v) }} />
                ))}
                <span className="text-[10px] text-muted-foreground">High</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Avg Efficiency", value: "84.2%", color: "text-primary" },
            { label: "Peak Output", value: "1,142 kWh", color: "text-[hsl(var(--info))]" },
            { label: "Panels Online", value: "10/12", color: "text-[hsl(var(--success))]" },
            { label: "Carbon Saved", value: "8.2 tons", color: "text-[hsl(var(--accent))]" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
