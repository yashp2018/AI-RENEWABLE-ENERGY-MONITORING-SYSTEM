import { useState, useEffect } from "react";
import { Sun, Cloud, CloudRain, CloudSun, Wind, Thermometer, Eye, Droplets, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type WeatherCondition = "sunny" | "partly_cloudy" | "cloudy" | "rainy";

interface WeatherData {
  condition: WeatherCondition;
  temperature: number;
  sunlightIntensity: number;
  windSpeed: number;
  humidity: number;
  uvIndex: number;
  energyImpact: number;
  impactLabel: string;
}

const weatherIcons: Record<WeatherCondition, typeof Sun> = {
  sunny: Sun,
  partly_cloudy: CloudSun,
  cloudy: Cloud,
  rainy: CloudRain,
};

const weatherLabels: Record<WeatherCondition, string> = {
  sunny: "Sunny",
  partly_cloudy: "Partly Cloudy",
  cloudy: "Cloudy",
  rainy: "Rainy",
};

function generateWeather(): WeatherData {
  const conditions: WeatherCondition[] = ["sunny", "sunny", "sunny", "partly_cloudy", "partly_cloudy", "cloudy", "rainy"];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];

  const tempBase = condition === "sunny" ? 32 : condition === "partly_cloudy" ? 28 : condition === "cloudy" ? 24 : 20;
  const sunBase = condition === "sunny" ? 850 : condition === "partly_cloudy" ? 580 : condition === "cloudy" ? 280 : 120;
  const windBase = condition === "rainy" ? 18 : condition === "cloudy" ? 12 : 6;

  const temperature = tempBase + Math.round((Math.random() - 0.5) * 6);
  const sunlightIntensity = Math.round(sunBase + (Math.random() - 0.5) * 100);
  const windSpeed = +(windBase + (Math.random() - 0.5) * 6).toFixed(1);
  const humidity = condition === "rainy" ? 75 + Math.round(Math.random() * 20) : condition === "cloudy" ? 55 + Math.round(Math.random() * 20) : 30 + Math.round(Math.random() * 25);
  const uvIndex = condition === "sunny" ? 7 + Math.round(Math.random() * 4) : condition === "partly_cloudy" ? 4 + Math.round(Math.random() * 3) : 1 + Math.round(Math.random() * 2);

  const energyImpact = condition === "sunny" ? 12 + Math.round(Math.random() * 8) : condition === "partly_cloudy" ? -(5 + Math.round(Math.random() * 10)) : condition === "cloudy" ? -(20 + Math.round(Math.random() * 15)) : -(35 + Math.round(Math.random() * 15));

  const impactLabel = energyImpact > 5 ? "Positive" : energyImpact < -5 ? "Negative" : "Neutral";

  return { condition, temperature, sunlightIntensity, windSpeed, humidity, uvIndex, energyImpact, impactLabel };
}

const impactAnalysis: Record<WeatherCondition, string[]> = {
  sunny: [
    "Optimal solar conditions — panels operating at peak efficiency",
    "High UV index boosting photovoltaic conversion rates",
    "Clear skies enabling maximum solar irradiance capture",
  ],
  partly_cloudy: [
    "Intermittent cloud cover causing 10-15% output fluctuation",
    "Solar tracking systems compensating for variable light angles",
    "Brief shading intervals detected — efficiency slightly reduced",
  ],
  cloudy: [
    "Heavy cloud cover reducing direct solar irradiance by 60%",
    "Diffuse light still generating baseline power output",
    "Recommend activating supplementary energy reserves",
  ],
  rainy: [
    "Rain reducing panel output significantly — 40-50% drop expected",
    "Natural panel cleaning effect may improve post-rain efficiency",
    "Wind speeds elevated — monitoring structural integrity",
  ],
};

export function WeatherPanel() {
  const [weather, setWeather] = useState<WeatherData>(generateWeather);
  const [analysis, setAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnalyzing(true);
      setTimeout(() => {
        const newWeather = generateWeather();
        setWeather(newWeather);
        const msgs = impactAnalysis[newWeather.condition];
        setAnalysis(msgs[Math.floor(Math.random() * msgs.length)]);
        setIsAnalyzing(false);
      }, 600);
    }, 5000);

    const msgs = impactAnalysis[weather.condition];
    setAnalysis(msgs[Math.floor(Math.random() * msgs.length)]);

    return () => clearInterval(interval);
  }, []);

  const WeatherIcon = weatherIcons[weather.condition];
  const ImpactIcon = weather.energyImpact > 5 ? TrendingUp : weather.energyImpact < -5 ? TrendingDown : Minus;
  const impactColor = weather.impactLabel === "Positive" ? "text-primary" : weather.impactLabel === "Negative" ? "text-destructive" : "text-muted-foreground";
  const badgeVariant = weather.impactLabel === "Positive" ? "default" : weather.impactLabel === "Negative" ? "destructive" : "secondary";

  return (
    <div className="glass-card p-6 animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Weather Integration</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      {/* Current Weather */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-secondary/50 flex items-center justify-center">
          <WeatherIcon className="w-8 h-8 text-accent" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{weather.temperature}°C</p>
          <p className="text-xs text-muted-foreground">{weatherLabels[weather.condition]}</p>
        </div>
        <div className="ml-auto text-right">
          <div className="flex items-center gap-1">
            <ImpactIcon className={`w-4 h-4 ${impactColor}`} />
            <span className={`text-sm font-semibold ${impactColor}`}>{weather.energyImpact > 0 ? "+" : ""}{weather.energyImpact}%</span>
          </div>
          <p className="text-xs text-muted-foreground">Energy Impact</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Sun, label: "Sunlight", value: `${weather.sunlightIntensity} W/m²` },
          { icon: Wind, label: "Wind", value: `${weather.windSpeed} km/h` },
          { icon: Droplets, label: "Humidity", value: `${weather.humidity}%` },
          { icon: Eye, label: "UV Index", value: String(weather.uvIndex) },
        ].map((m) => (
          <div key={m.label} className="bg-secondary/30 rounded-lg p-3 text-center">
            <m.icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="text-sm font-semibold text-foreground">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Weather Impact Analysis */}
      <div className="bg-secondary/20 rounded-lg p-4 border border-border/50">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Weather Impact Analysis</p>
          <Badge variant={badgeVariant} className="text-[10px]">{weather.impactLabel}</Badge>
        </div>
        <p className={`text-xs text-muted-foreground leading-relaxed transition-opacity duration-300 ${isAnalyzing ? "opacity-40" : "opacity-100"}`}>
          {isAnalyzing ? "Analyzing weather correlation..." : analysis}
        </p>
      </div>
    </div>
  );
}
