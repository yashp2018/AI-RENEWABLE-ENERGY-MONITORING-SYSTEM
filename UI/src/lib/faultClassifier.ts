import type { SolarData } from "@/hooks/useMultiPanelSimulation";

export type FaultType = "dust_accumulation" | "overheating" | "low_sunlight" | "hardware_issue";

export interface FaultClassification {
  type: FaultType;
  label: string;
  reason: string;
  recommendation: string;
  icon: string;
}

const classifications: Record<FaultType, Omit<FaultClassification, "reason">> = {
  dust_accumulation: {
    type: "dust_accumulation",
    label: "Dust Accumulation",
    recommendation: "Clean panel surface to restore efficiency",
    icon: "🌫️",
  },
  overheating: {
    type: "overheating",
    label: "Overheating",
    recommendation: "Check cooling system and ventilation",
    icon: "🔥",
  },
  low_sunlight: {
    type: "low_sunlight",
    label: "Low Sunlight",
    recommendation: "Check for obstructions or wait for better conditions",
    icon: "🌥️",
  },
  hardware_issue: {
    type: "hardware_issue",
    label: "Hardware Issue",
    recommendation: "Schedule maintenance inspection immediately",
    icon: "⚙️",
  },
};

export function classifyFault(data: SolarData): FaultClassification | null {
  if (data.status === "normal") return null;

  // Rule-based classification
  if (data.temperature > 65) {
    return {
      ...classifications.overheating,
      reason: `Temperature critically high at ${data.temperature.toFixed(0)}°C`,
    };
  }

  if (data.irradiance < 250) {
    return {
      ...classifications.low_sunlight,
      reason: `Irradiance very low at ${data.irradiance.toFixed(0)} W/m²`,
    };
  }

  if (data.voltage < 10 && data.current < 2) {
    return {
      ...classifications.hardware_issue,
      reason: `Voltage (${data.voltage.toFixed(1)}V) and current (${data.current.toFixed(1)}A) critically low`,
    };
  }

  if (data.energyOutput < 100 && data.irradiance > 400) {
    return {
      ...classifications.dust_accumulation,
      reason: `Low energy output (${data.energyOutput.toFixed(0)}W) despite adequate irradiance`,
    };
  }

  // Default for unclassified warning/fault
  return {
    ...classifications.hardware_issue,
    reason: "Multiple abnormal readings detected",
  };
}
