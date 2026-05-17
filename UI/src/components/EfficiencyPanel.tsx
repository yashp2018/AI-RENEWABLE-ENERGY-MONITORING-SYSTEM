import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { PanelState } from "@/hooks/useMultiPanelSimulation";
import { calculateEfficiency } from "@/lib/healthScore";

interface Props {
  panels: PanelState[];
  efficiencyHistory: Record<string, number[]>;
}

function getEfficiencyConfig(eff: number) {
  if (eff >= 14) return { color: "text-success",     bar: "bg-success",     label: "Healthy",  border: "border-success/20",  bg: "bg-success/5" };
  if (eff >= 8)  return { color: "text-warning",     bar: "bg-warning",     label: "Moderate", border: "border-warning/20",  bg: "bg-warning/5" };
  return           { color: "text-destructive",  bar: "bg-destructive", label: "Critical", border: "border-destructive/30", bg: "bg-destructive/5" };
}

const PANEL_COLORS = ["hsl(160 84% 39%)", "hsl(190 80% 45%)", "hsl(45 93% 47%)"];

export function EfficiencyPanel({ panels, efficiencyHistory }: Props) {
  const efficiencies = panels.map((p) => ({
    id: p.id,
    name: p.name,
    efficiency: calculateEfficiency(p.currentData),
    suspended: p.suspended,
  }));

  const chartData = useMemo(() => {
    const maxLen = Math.max(...Object.values(efficiencyHistory).map((h) => h.length), 0);
    return Array.from({ length: maxLen }, (_, i) => {
      const point: Record<string, number | string> = { idx: i };
      panels.forEach((p) => {
        const hist = efficiencyHistory[p.id] ?? [];
        point[p.name] = hist[i] ?? 0;
      });
      return point;
    }).slice(-30);
  }, [efficiencyHistory, panels]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="data-label">Panel Efficiency Score</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-[200px]">
                  Efficiency = (Energy Output / (Irradiance × 1.6m²)) × 100%.
                  Green ≥14% · Yellow ≥8% · Red &lt;8%
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Per-panel efficiency cards with progress bars */}
      <div className="grid grid-cols-3 gap-3">
        {efficiencies.map((e, i) => {
          const cfg = getEfficiencyConfig(e.efficiency);
          const hist = efficiencyHistory[e.id] ?? [];
          const prev = hist.length >= 2 ? hist[hist.length - 2] : e.efficiency;
          const delta = e.efficiency - prev;
          const TrendIcon = delta > 0.5 ? TrendingUp : delta < -0.5 ? TrendingDown : Minus;
          const trendColor = delta > 0.5 ? "text-success" : delta < -0.5 ? "text-destructive" : "text-muted-foreground";

          return (
            <div key={e.id} className={`rounded-lg border ${cfg.border} ${cfg.bg} p-3 space-y-2`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">{e.name}</p>
                <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />
              </div>

              {e.suspended ? (
                <p className="text-xs font-bold text-destructive">OFFLINE</p>
              ) : (
                <>
                  <p className={`text-2xl font-bold font-mono ${cfg.color}`}>
                    {e.efficiency.toFixed(1)}%
                  </p>
                  <div className="space-y-1">
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                        style={{ width: `${Math.min(100, (e.efficiency / 25) * 100)}%` }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Efficiency trend chart */}
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
            <XAxis dataKey="idx" tick={{ fill: "hsl(215 14% 50%)", fontSize: 10 }} stroke="hsl(220 14% 18%)" />
            <YAxis tick={{ fill: "hsl(215 14% 50%)", fontSize: 10 }} stroke="hsl(220 14% 18%)" unit="%" />
            <RTooltip
              contentStyle={{
                backgroundColor: "hsl(220 18% 10%)",
                border: "1px solid hsl(220 14% 18%)",
                borderRadius: "8px",
                fontSize: "11px",
                color: "hsl(210 20% 90%)",
              }}
            />
            {panels.map((p, i) => (
              <Line key={p.id} type="monotone" dataKey={p.name} stroke={PANEL_COLORS[i]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
