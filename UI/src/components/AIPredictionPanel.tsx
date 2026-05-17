import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { Brain } from "lucide-react";
import type { ChartPoint } from "@/hooks/useMultiPanelSimulation";

interface Props {
  history: ChartPoint[];
  panelName: string;
}

function predictNext(values: number[], count: number): number[] {
  if (values.length < 2) return Array(count).fill(values[0] ?? 0);
  // Simple linear regression
  const n = values.length;
  const xs = values.map((_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * values[i], 0);
  const sumX2 = xs.reduce((a, x) => a + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
  const intercept = (sumY - slope * sumX) / n;

  return Array.from({ length: count }, (_, i) => {
    const pred = intercept + slope * (n + i);
    return Math.max(0, parseFloat(pred.toFixed(1)));
  });
}

function calcConfidence(values: number[]): number {
  if (values.length < 3) return 45;
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / n;
  const cv = Math.sqrt(variance) / (mean || 1);
  // Lower variance → higher confidence
  const conf = Math.max(40, Math.min(98, 95 - cv * 100));
  return parseFloat(conf.toFixed(0));
}

export function AIPredictionPanel({ history, panelName }: Props) {
  const { chartData, confidence } = useMemo(() => {
    const energyValues = history.map((h) => h.energyOutput);
    const predicted = predictNext(energyValues, 10);
    const conf = calcConfidence(energyValues);

    // Build combined chart: last 10 actual + 10 predicted
    const recent = history.slice(-10);
    const combined = recent.map((h, i) => ({
      time: h.time,
      actual: h.energyOutput,
      predicted: null as number | null,
      idx: i,
    }));

    predicted.forEach((val, i) => {
      combined.push({
        time: `+${i + 1}`,
        actual: null as number | null,
        predicted: val,
        idx: recent.length + i,
      });
    });

    return { chartData: combined, confidence: conf };
  }, [history]);

  const hasData = history.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="data-label flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent" />
          {panelName} — Energy Prediction
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
            AI Prediction Active
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            Confidence: <span className="text-foreground font-semibold">{hasData ? `${confidence}%` : "—"}</span>
          </span>
        </div>
      </div>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
            <XAxis dataKey="time" tick={{ fill: "hsl(215 14% 50%)", fontSize: 10 }} stroke="hsl(220 14% 18%)" />
            <YAxis tick={{ fill: "hsl(215 14% 50%)", fontSize: 10 }} stroke="hsl(220 14% 18%)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220 18% 10%)",
                border: "1px solid hsl(220 14% 18%)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(210 20% 90%)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            {hasData && (
              <ReferenceLine
                x={chartData.find((d) => d.predicted !== null)?.time}
                stroke="hsl(215 14% 30%)"
                strokeDasharray="4 4"
                label={{ value: "Prediction →", fill: "hsl(215 14% 50%)", fontSize: 10, position: "top" }}
              />
            )}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="hsl(45 93% 47%)"
              strokeWidth={2}
              dot={false}
              name="Actual (W)"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="hsl(190 80% 45%)"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={{ r: 3, fill: "hsl(190 80% 45%)" }}
              name="Predicted (W)"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
