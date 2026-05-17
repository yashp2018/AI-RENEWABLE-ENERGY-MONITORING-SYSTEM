import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PanelState, LogEntry } from "@/hooks/useMultiPanelSimulation";
import { toast } from "sonner";

interface Props {
  panels: PanelState[];
  logs: LogEntry[];
}

function exportCSV(panels: PanelState[], logs: LogEntry[]) {
  const headers = ["Timestamp", "Panel", "Voltage(V)", "Current(A)", "Temperature(°C)", "Irradiance(W/m²)", "Energy(W)", "Status"];
  const rows = logs.map((l) => {
    const panel = panels.find((p) => p.id === l.panelId);
    return [
      l.timestamp.toISOString(),
      panel?.name ?? l.panelId,
      l.data.voltage.toFixed(2),
      l.data.current.toFixed(2),
      l.data.temperature.toFixed(1),
      l.data.irradiance.toFixed(0),
      l.data.energyOutput.toFixed(1),
      l.data.status,
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `solar-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV report exported successfully");
}

function exportPDFSimulation(panels: PanelState[]) {
  // Simulate PDF export with a text summary
  const lines = ["SOLAR DATA SIMULATOR — REPORT", `Date: ${new Date().toLocaleString()}`, "", "PANEL SUMMARY", ""];
  panels.forEach((p) => {
    const d = p.currentData;
    lines.push(`${p.name}:`);
    if (d) {
      lines.push(`  Voltage: ${d.voltage.toFixed(1)}V | Current: ${d.current.toFixed(2)}A`);
      lines.push(`  Temperature: ${d.temperature.toFixed(0)}°C | Irradiance: ${d.irradiance.toFixed(0)} W/m²`);
      lines.push(`  Energy Output: ${d.energyOutput.toFixed(0)}W | Status: ${d.status}`);
    } else {
      lines.push("  No data");
    }
    lines.push("");
  });

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `solar-report-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("PDF report exported (simulated as text file)");
}

export function ReportExport({ panels, logs }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="gap-2" onClick={() => exportCSV(panels, logs)}>
        <Download className="h-3.5 w-3.5" /> CSV
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => exportPDFSimulation(panels)}>
        <FileText className="h-3.5 w-3.5" /> PDF
      </Button>
    </div>
  );
}
