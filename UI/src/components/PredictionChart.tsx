import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { Brain } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiPrediction } from "@/hooks/useApiData";

interface Props {
  prediction: ApiPrediction | null;
  loading?: boolean;
}

export function PredictionChart({ prediction, loading }: Props) {
  const chartData = (() => {
    if (!prediction) return [];
    const actual = prediction.actual_values ?? [];
    const predicted = prediction.predicted_values ?? [];
    const maxLen = Math.max(actual.length, predicted.length);
    return Array.from({ length: maxLen }, (_, i) => ({
      time: prediction.timestamps?.[i] ?? `T${i + 1}`,
      actual: actual[i] ?? null,
      predicted: predicted[i] ?? null,
    }));
  })();

  const splitIdx = (prediction?.actual_values?.length ?? 0);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="data-label flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent" />
          Energy Prediction
        </h3>
        {prediction && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
              AI Prediction Active
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              Confidence:{" "}
              <span className="text-foreground font-semibold">{prediction.confidence}%</span>
            </span>
          </div>
        )}
      </div>
      <div className="h-[240px]">
        {loading ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
              <XAxis
                dataKey="time"
                tick={{ fill: "hsl(215 14% 50%)", fontSize: 10 }}
                stroke="hsl(220 14% 18%)"
              />
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
              {splitIdx > 0 && chartData[splitIdx] && (
                <ReferenceLine
                  x={chartData[splitIdx].time}
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
        )}
      </div>
    </div>
  );
}
