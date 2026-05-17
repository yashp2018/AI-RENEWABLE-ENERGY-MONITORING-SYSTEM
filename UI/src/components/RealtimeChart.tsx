import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { ChartPoint } from "@/hooks/useMultiPanelSimulation";

interface Props {
  data: ChartPoint[];
  title: string;
}

export function RealtimeChart({ data, title }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="data-label mb-4">{title}</h3>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
            <XAxis
              dataKey="time"
              tick={{ fill: "hsl(215 14% 50%)", fontSize: 10 }}
              stroke="hsl(220 14% 18%)"
              interval="preserveStartEnd"
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
            <Line
              type="monotone"
              dataKey="voltage"
              stroke="hsl(160 84% 39%)"
              strokeWidth={2}
              dot={false}
              name="Voltage (V)"
            />
            <Line
              type="monotone"
              dataKey="current"
              stroke="hsl(190 80% 45%)"
              strokeWidth={2}
              dot={false}
              name="Current (A)"
            />
            <Line
              type="monotone"
              dataKey="energyOutput"
              stroke="hsl(45 93% 47%)"
              strokeWidth={2}
              dot={false}
              name="Energy (W)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
