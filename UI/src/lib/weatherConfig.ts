export type WeatherCondition = "sunny" | "cloudy" | "rainy" | "storm";

export interface WeatherConfig {
  label: string;
  icon: string;
  irradianceMultiplier: number;
  energyMultiplier: number;
  temperatureOffset: number; // °C added to base temp
  description: string;
  impactLevel: "optimal" | "reduced" | "minimal" | "critical";
  impactColor: string;
}

export const weatherConfigs: Record<WeatherCondition, WeatherConfig> = {
  sunny: {
    label: "Sunny",
    icon: "☀️",
    irradianceMultiplier: 1.0,
    energyMultiplier: 1.0,
    temperatureOffset: 8,
    description: "Optimal solar conditions — peak performance",
    impactLevel: "optimal",
    impactColor: "text-success",
  },
  cloudy: {
    label: "Cloudy",
    icon: "⛅",
    irradianceMultiplier: 0.5,
    energyMultiplier: 0.55,
    temperatureOffset: 0,
    description: "Cloud cover reducing irradiance by ~50%",
    impactLevel: "reduced",
    impactColor: "text-warning",
  },
  rainy: {
    label: "Rainy",
    icon: "🌧️",
    irradianceMultiplier: 0.2,
    energyMultiplier: 0.25,
    temperatureOffset: -5,
    description: "Rain severely limiting solar energy capture",
    impactLevel: "minimal",
    impactColor: "text-accent",
  },
  storm: {
    label: "Storm",
    icon: "⛈️",
    irradianceMultiplier: 0.05,
    energyMultiplier: 0.08,
    temperatureOffset: -10,
    description: "Storm conditions — critical output reduction, risk of damage",
    impactLevel: "critical",
    impactColor: "text-destructive",
  },
};

export type SimulationMode = "normal" | "stress" | "night";

export interface ModeConfig {
  label: string;
  description: string;
  faultProbability: number;
  energyMultiplier: number;
  irradianceBase: number;
}

export const modeConfigs: Record<SimulationMode, ModeConfig> = {
  normal: {
    label: "Normal",
    description: "Standard operating conditions",
    faultProbability: 0.08,
    energyMultiplier: 1.0,
    irradianceBase: 800,
  },
  stress: {
    label: "Stress",
    description: "Frequent faults and degraded performance",
    faultProbability: 0.35,
    energyMultiplier: 0.7,
    irradianceBase: 600,
  },
  night: {
    label: "Night",
    description: "Low energy production period",
    faultProbability: 0.02,
    energyMultiplier: 0.1,
    irradianceBase: 50,
  },
};
