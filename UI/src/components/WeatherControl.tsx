import { Cloud, Sun, CloudRain, CloudLightning, Thermometer, Zap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WeatherCondition } from "@/lib/weatherConfig";
import { weatherConfigs } from "@/lib/weatherConfig";

interface Props {
  weather: WeatherCondition;
  onWeatherChange: (w: WeatherCondition) => void;
}

const icons: Record<WeatherCondition, React.ReactNode> = {
  sunny:  <Sun           className="h-4 w-4 text-warning" />,
  cloudy: <Cloud         className="h-4 w-4 text-muted-foreground" />,
  rainy:  <CloudRain     className="h-4 w-4 text-accent" />,
  storm:  <CloudLightning className="h-4 w-4 text-destructive" />,
};

const impactBarWidth: Record<string, string> = {
  optimal:  "w-full",
  reduced:  "w-1/2",
  minimal:  "w-1/5",
  critical: "w-[5%]",
};

const impactBarColor: Record<string, string> = {
  optimal:  "bg-success",
  reduced:  "bg-warning",
  minimal:  "bg-accent",
  critical: "bg-destructive",
};

export function WeatherControl({ weather, onWeatherChange }: Props) {
  const config = weatherConfigs[weather];

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="data-label">Weather Intelligence</span>
        <span className="text-2xl">{config.icon}</span>
      </div>

      <Select value={weather} onValueChange={(v) => onWeatherChange(v as WeatherCondition)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(weatherConfigs) as WeatherCondition[]).map((w) => (
            <SelectItem key={w} value={w}>
              <span className="flex items-center gap-2">
                {icons[w]}
                {weatherConfigs[w].label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="rounded-lg bg-muted/50 p-3 space-y-2.5">
        <p className={`text-xs font-semibold ${config.impactColor}`}>{config.description}</p>

        {/* Irradiance impact bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 text-muted-foreground"><Sun className="h-3 w-3" /> Irradiance</span>
            <span className="font-mono text-foreground">{(config.irradianceMultiplier * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${impactBarColor[config.impactLevel]}`}
              style={{ width: `${config.irradianceMultiplier * 100}%` }}
            />
          </div>
        </div>

        {/* Energy impact bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 text-muted-foreground"><Zap className="h-3 w-3" /> Energy Output</span>
            <span className="font-mono text-foreground">{(config.energyMultiplier * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${impactBarColor[config.impactLevel]}`}
              style={{ width: `${config.energyMultiplier * 100}%` }}
            />
          </div>
        </div>

        {/* Temperature offset */}
        <div className="flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1 text-muted-foreground"><Thermometer className="h-3 w-3" /> Temp Offset</span>
          <span className={`font-mono font-semibold ${config.temperatureOffset > 0 ? "text-warning" : config.temperatureOffset < 0 ? "text-accent" : "text-muted-foreground"}`}>
            {config.temperatureOffset > 0 ? "+" : ""}{config.temperatureOffset}°C
          </span>
        </div>

        {weather === "storm" && (
          <div className="flex items-center gap-1.5 rounded bg-destructive/20 px-2 py-1.5 mt-1">
            <CloudLightning className="h-3 w-3 text-destructive shrink-0" />
            <p className="text-[10px] text-destructive font-medium">
              Storm alert — risk of physical panel damage
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
