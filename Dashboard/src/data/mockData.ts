// Type definitions only — all data now comes from the live backend via useLiveData

export type PanelStatus = "Active" | "Warning" | "Fault";
export type AlertSeverity = "critical" | "warning" | "normal";
export type RiskLevel = "Low" | "Medium" | "High";

export interface SolarPanel {
  id: string;
  status: PanelStatus;
  energyOutput: number;
  temperature: number;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  message: string;
  panel: string;
  timestamp: string;
  dismissed?: boolean;
}

export interface PredictionRisk {
  category: string;
  risk: RiskLevel;
  description: string;
}
