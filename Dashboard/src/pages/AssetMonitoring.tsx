import { DashboardLayout } from "@/components/DashboardLayout";
import { LiveIndicator } from "@/components/LiveIndicator";
import { useLiveData } from "@/hooks/useLiveData";
import { Monitor, AlertTriangle, WifiOff } from "lucide-react";

const statusClass: Record<string, string> = {
  active:  "status-active",
  warning: "status-warning",
  fault:   "status-fault",
};

const AssetMonitoring = () => {
  const { panels, lastUpdated, connected } = useLiveData();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Asset Monitoring</h1>
            <p className="text-sm text-muted-foreground mt-1">Solar panel status and performance</p>
          </div>
          <LiveIndicator lastUpdated={lastUpdated} />
        </div>

        {!connected && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5">
            <WifiOff className="h-4 w-4 text-warning shrink-0" />
            <p className="text-xs text-warning">Backend offline — start server and simulator to see live panel data</p>
          </div>
        )}

        <div className="glass-card overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Panel ID</th>
                  <th className="text-left px-5 py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-5 py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Energy (W)</th>
                  <th className="text-left px-5 py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Voltage (V)</th>
                  <th className="text-left px-5 py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Current (A)</th>
                  <th className="text-left px-5 py-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">Temperature (°C)</th>
                </tr>
              </thead>
              <tbody>
                {panels.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">
                      {connected ? "Waiting for simulator data…" : "No data — backend offline"}
                    </td>
                  </tr>
                ) : (
                  panels.map((panel) => {
                    const isFault   = panel.status === "fault";
                    const isWarning = panel.status === "warning";
                    return (
                      <tr
                        key={panel.id}
                        className={`border-b border-border/50 transition-colors duration-300 ${
                          isFault   ? "bg-destructive/5 hover:bg-destructive/10" :
                          isWarning ? "bg-accent/5 hover:bg-accent/10" :
                          "hover:bg-secondary/30"
                        }`}
                      >
                        <td className="px-5 py-3.5 font-mono flex items-center gap-2">
                          {isFault
                            ? <AlertTriangle className="w-4 h-4 text-destructive" />
                            : <Monitor className="w-4 h-4 text-muted-foreground" />}
                          <span className={isFault ? "text-destructive font-semibold" : "text-foreground"}>
                            {panel.id}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusClass[panel.status] ?? "status-active"}`}>
                            {panel.status.charAt(0).toUpperCase() + panel.status.slice(1)}
                          </span>
                        </td>
                        <td className={`px-5 py-3.5 font-mono ${isFault ? "text-destructive" : "text-foreground"}`}>
                          {panel.energyOutput}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-foreground">{panel.voltage}</td>
                        <td className="px-5 py-3.5 font-mono text-foreground">{panel.current}</td>
                        <td className={`px-5 py-3.5 font-mono ${
                          panel.temperature > 65 ? "text-destructive" :
                          panel.temperature > 55 ? "text-accent" : "text-foreground"
                        }`}>
                          {panel.temperature}°C
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AssetMonitoring;
