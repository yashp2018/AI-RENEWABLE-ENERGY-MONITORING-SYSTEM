import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import { History } from "lucide-react";
import type { LogEntry } from "@/hooks/useMultiPanelSimulation";

interface Props {
  logs: LogEntry[];
}

type Range = "24h" | "7d" | "30d";

const CHART_STYLE = {
  contentStyle: {
    backgroundColor: "hsl(220 18% 10%)",
    border: "1px solid hsl(220 14% 18%)",
    borderRadius: "8px",
    fontSize: "11px",
    color: "hsl(210 20% 90%)",
  },
};

export function HistoricalAnalytics({ logs }: Props) {
  const [range, setRange] = useState<Range>("24h");

  const { trendData, faultData, stats } = useMemo(() => {
    const now = Date.now();
    const cutoff: Record<Range, number> = {
      "24h": now - 24 * 3600 * 1000,
      "7d":  now - 7  * 24 * 3600 * 1000,
      "30d": now - 30 * 24 * 3600 * 1000,
    };
    const filtered = logs.filter((l) => l.timestamp.getTime() >= cutoff[range]);

    // Bucket into time slots
    const buckets = 20;
    const bucketMs = (now - cutoff[range]) / buckets;
    const trend = Array.from({ length: buckets }, (_, i) => {
      const start = cutoff[range] + i * bucketMs;
      const end   = start + bucketMs;
      const slice = filtered.filter((l) => {
        const t = l.timestamp.getTime();
        return t >= start && t < end;
      });
      const avgEnergy = slice.length > 0
        ? slice.reduce((s, l) => s + l.data.energyOutput, 0) / slice.length
        : 0;
      const avgTemp = slice.length > 0
        ? slice.reduce((s, l) => s + l.data.temperature, 0) / slice.length
        : 0;
      const label = new Date(start + bucketMs / 2).toLocaleTimeString([], {
        hour: "2-digit", minute: "2-digit",
      });
      return { time: label, energy: parseFloat(avgEnergy.toFixed(1)), temp: parseFloat(avgTemp.toFixed(1)) };
    });

    // Fault history per panel
    const panelIds = [...new Set(filtered.map((l) => l.panelId))];
    const faults = panelIds.map((id) => {
      const panelLogs = filtered.filter((l) => l.panelId === id);
      const name = panelLogs[0]?.panelName ?? id;
      return {
        name,
        faults:   panelLogs.filter((l) => l.data.status === "fault").length,
        warnings: panelLogs.filter((l) => l.data.status === "warning").length,
        normal:   panelLogs.filter((l) => l.data.status === "normal").length,
      };
    });

    const totalFaults   = filtered.filter((l) => l.data.status === "fault").length;
    const totalWarnings = filtered.filter((l) => l.data.status === "warning").length;
    const avgEff = filtered.length > 0
      ? filtered.reduce((s, l) => s + l.data.energyOutput, 0) / filtered.length
      : 0;

    return { trendData: trend, faultData: faults, stats: { totalFaults, totalWarnings, avgEff, total: filtered.length } };
  }, [logs, range]);

  const ranges: Range[] = ["24h", "7d", "30d"];

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-accent" />
          <span className="data-label">Historical Analytics</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total Readings", value: stats.total, color: "text-accent" },
          { label: "Faults",         value: stats.totalFaults,   color: "text-destructive" },
          { label: "Warnings",       value: stats.totalWarnings, color: "text-warning" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-muted/50 p-2.5 text-center">
            <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Energy + Temperature trend */}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Energy & Temperature Trend</p>
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(45 93% 47%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(45 93% 47%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(0 72% 51%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(0 72% 51%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
              <XAxis dataKey="time" tick={{ fill: "hsl(215 14% 50%)", fontSize: 9 }} stroke="hsl(220 14% 18%)" interval="preserveStartEnd" />
              <YAxis tick={{ fill: "hsl(215 14% 50%)", fontSize: 9 }} stroke="hsl(220 14% 18%)" />
              <Tooltip {...CHART_STYLE} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Area type="monotone" dataKey="energy" stroke="hsl(45 93% 47%)" fill="url(#energyGrad)" strokeWidth={2} name="Avg Energy (W)" dot={false} />
              <Area type="monotone" dataKey="temp"   stroke="hsl(0 72% 51%)"  fill="url(#tempGrad)"   strokeWidth={1.5} name="Avg Temp (°C)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fault history per panel */}
      {faultData.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Fault History by Panel</p>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={faultData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(215 14% 50%)", fontSize: 10 }} stroke="hsl(220 14% 18%)" />
                <YAxis tick={{ fill: "hsl(215 14% 50%)", fontSize: 9 }} stroke="hsl(220 14% 18%)" />
                <Tooltip {...CHART_STYLE} />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Bar dataKey="faults"   fill="hsl(0 72% 51%)"  name="Faults"   radius={[3, 3, 0, 0]} />
                <Bar dataKey="warnings" fill="hsl(45 93% 47%)" name="Warnings" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {logs.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Start simulation to generate historical data
        </p>
      )}
    </div>
  );
}
