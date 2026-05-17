import type { PanelState } from "@/hooks/useMultiPanelSimulation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  panels: PanelState[];
  activePanelId: string;
  onSelectPanel: (id: string) => void;
}

const mockCoordinates = [
  { x: 25, y: 30, lat: "34.0522°N", lng: "118.2437°W" },
  { x: 55, y: 55, lat: "34.0530°N", lng: "118.2420°W" },
  { x: 78, y: 35, lat: "34.0515°N", lng: "118.2410°W" },
];

function getStatusColor(status: string | undefined) {
  if (status === "fault") return "bg-destructive";
  if (status === "warning") return "bg-warning";
  return "bg-success";
}

export function PanelMapView({ panels, activePanelId, onSelectPanel }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <span className="data-label">Panel Map View</span>
      <div className="relative w-full h-[220px] rounded-lg bg-muted/30 border border-border overflow-hidden">
        {/* Grid overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          {Array.from({ length: 10 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={`${(i + 1) * 10}%`} x2="100%" y2={`${(i + 1) * 10}%`} stroke="hsl(215 14% 50%)" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <line key={`v${i}`} x1={`${(i + 1) * 10}%`} y1="0" x2={`${(i + 1) * 10}%`} y2="100%" stroke="hsl(215 14% 50%)" strokeWidth="0.5" />
          ))}
        </svg>

        <TooltipProvider>
          {panels.map((p, i) => {
            const coord = mockCoordinates[i];
            const isActive = p.id === activePanelId;
            const statusColor = getStatusColor(p.currentData?.status);

            return (
              <Tooltip key={p.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelectPanel(p.id)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all ${isActive ? "scale-125 z-10" : "hover:scale-110"}`}
                    style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
                  >
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                        isActive ? "border-primary bg-primary/20 text-primary" : "border-border bg-card text-foreground"
                      }`}>
                        {p.name.split(" ")[1]}
                      </div>
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusColor} ${p.currentData?.status === "fault" ? "animate-pulse" : ""}`} />
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="text-xs space-y-1">
                    <p className="font-semibold">{p.name}</p>
                    <p>Status: {p.currentData?.status ?? "Idle"}</p>
                    <p>Energy: {p.currentData?.energyOutput.toFixed(0) ?? "—"}W</p>
                    <p className="text-muted-foreground">{coord.lat}, {coord.lng}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>

        <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground bg-card/80 px-2 py-1 rounded">
          Mock GPS Coordinates
        </div>
      </div>
    </div>
  );
}
