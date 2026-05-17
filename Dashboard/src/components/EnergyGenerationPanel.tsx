import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { Zap, Calendar, CalendarDays, CalendarRange, Infinity as InfinityIcon } from "lucide-react";
import type { WReading, EnergyTotals } from "@/hooks/useLiveData";

interface Props {
  wReadings: WReading[];
  energyTotals: EnergyTotals;
  connected: boolean;
}

type Period = "day" | "week" | "month" | "total";

const periodConfig: Record<Period, {
  label: string;
  icon: typeof Zap;
  color: string;
  bg: string;
  border: string;
  gradId: string;
  stroke: string;
}> = {
  day:   { label: "Today",      icon: Calendar,      color: "text-primary",     bg: "bg-primary/10",     border: "border-primary/30",     gradId: "gradDay",   stroke: "hsl(142 70% 45%)" },
  week:  { label: "This Week",  icon: CalendarDays,  color: "text-accent",      bg: "bg-accent/10",      border: "border-accent/30",      gradId: "gradWeek",  stroke: "hsl(200 80% 55%)" },
  month: { label: "This Month", icon: CalendarRange, color: "text-warning",     bg: "bg-warning/10",     border: "border-warning/30",     gradId: "gradMonth", stroke: "hsl(45 93% 47%)"  },
  total: { label: "All Time",   icon: InfinityIcon,  color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", gradId: "gradTotal", stroke: "hsl(0 72% 51%)"   },
};

function formatW(w: number): string {
  if (w >= 1000) return `${(w / 1000).toFixed(2)} kW`;
  return `${w.toFixed(1)} W`;
}

export function EnergyGenerationPanel({ wReadings, energyTotals, connected }: Props) {
  const [period, setPeriod] = useState<Period>("day");

  const cfg = periodConfig[period];
  const Icon = cfg.icon;
  const totalValue = energyTotals[period];

  // Chart data: use last 30 numbered readings
  const chartData = wReadings.slice(-30).map((r) => ({
    n: `#${r.n}`,
    w: r.w,
  }));

  // Numbered readings list (most recent first, last 50)
  const listReadings = [...wReadings].reverse().slice(0, 50);

  return (
    <div className="glass-card p-6 animate-fade-in space-y-5" style={{ animationDelay: "0.15s" }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Energy Generation</h3>
            <p className="text-[10px] text-muted-foreground">W readings · Day / Week / Month / Total</p>
          </div>
        </div>
        {connected && wReadings.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
            <div className="relative w-1.5 h-1.5">
              <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
              <div className="relative w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
            <span className="text-[10px] font-semibold text-primary">LIVE</span>
          </div>
        )}
      </div>

      {/* Period tabs */}
      <div className="grid grid-cols-4 gap-2">
        {(Object.keys(periodConfig) as Period[]).map((p) => {
          const c = periodConfig[p];
          const PIcon = c.icon;
          const val = energyTotals[p];
          const isActive = period === p;
          return (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-xl border p-3 text-left transition-all duration-200 ${
                isActive
                  ? `${c.bg} ${c.border} ${c.color}`
                  : "border-border bg-secondary/30 text-muted-foreground hover:border-border/80 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <PIcon className={`w-3.5 h-3.5 ${isActive ? c.color : "text-muted-foreground"}`} />
                <span className="text-[10px] font-semibold uppercase tracking-wider">{c.label}</span>
              </div>
              <p className={`text-base font-bold font-mono ${isActive ? c.color : "text-foreground"}`}>
                {formatW(val)}
              </p>
            </button>
          );
        })}
      </div>

      {/* Area chart of numbered W readings */}
      {!connected || wReadings.length === 0 ? (
        <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
          {connected ? "Waiting for W readings…" : "Start backend + simulator to see data"}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              W Output — Last {chartData.length} readings
            </span>
            <span className={`text-xs font-bold font-mono ${cfg.color}`}>
              {cfg.label}: {formatW(totalValue)}
            </span>
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id={cfg.gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={cfg.stroke} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={cfg.stroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
                <XAxis
                  dataKey="n"
                  tick={{ fill: "hsl(215 15% 55%)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "hsl(215 15% 55%)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  unit=" W"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220 18% 12%)",
                    border: "1px solid hsl(220 14% 18%)",
                    borderRadius: "8px",
                    color: "hsl(210 20% 92%)",
                    fontSize: 12,
                  }}
                  formatter={(val: number) => [`${val.toFixed(1)} W`, "Output"]}
                />
                <Area
                  type="monotone"
                  dataKey="w"
                  stroke={cfg.stroke}
                  fill={`url(#${cfg.gradId})`}
                  strokeWidth={2}
                  dot={{ fill: cfg.stroke, strokeWidth: 0, r: 2 }}
                  activeDot={{ r: 4 }}
                  isAnimationActive
                  animationDuration={300}
                  name="W Output"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Numbered W readings list */}
      {wReadings.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            W Readings Log — {wReadings.length} total
          </p>
          <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1">
            {listReadings.map((r) => {
              const isHigh   = r.w >= 200;
              const isMedium = r.w >= 80 && r.w < 200;
              const dotColor = isHigh ? "bg-primary" : isMedium ? "bg-warning" : "bg-destructive";
              const valColor = isHigh ? "text-primary" : isMedium ? "text-warning" : "text-destructive";
              return (
                <div
                  key={r.n}
                  className="flex items-center gap-3 rounded-lg bg-secondary/30 px-3 py-1.5 font-mono text-xs"
                >
                  {/* Reading number */}
                  <span className="text-muted-foreground w-8 shrink-0 text-right">#{r.n}</span>
                  {/* Status dot */}
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                  {/* W value */}
                  <span className={`font-bold w-20 shrink-0 ${valColor}`}>
                    {r.w.toFixed(1)} W
                  </span>
                  {/* Bar */}
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${dotColor}`}
                      style={{ width: `${Math.min(100, (r.w / 350) * 100)}%` }}
                    />
                  </div>
                  {/* Timestamp */}
                  <span className="text-muted-foreground shrink-0 text-[10px]">{r.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
