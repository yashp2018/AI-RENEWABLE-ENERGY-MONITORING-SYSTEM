import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { PanelState } from "@/hooks/useMultiPanelSimulation";

interface Props {
  panels: PanelState[];
}

export function ComparisonChart({ panels }: Props) {
  const data = panels.map((p) => ({
    name: p.name,
    voltage: p.currentData ? parseFloat(p.currentData.voltage.toFixed(1)) : 0,
    current: p.currentData ? parseFloat(p.currentData.current.toFixed(2)) : 0,
    energy: p.currentData ? parseFloat(p.currentData.energyOutput.toFixed(0)) : 0,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="data-label mb-4">Panel Comparison</h3>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
            <XAxis dataKey="name" tick={{ fill: "hsl(215 14% 50%)", fontSize: 11 }} stroke="hsl(220 14% 18%)" />
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
            <Bar dataKey="voltage" fill="hsl(160 84% 39%)" name="Voltage (V)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="current" fill="hsl(190 80% 45%)" name="Current (A)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="energy" fill="hsl(45 93% 47%)" name="Energy (W)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
