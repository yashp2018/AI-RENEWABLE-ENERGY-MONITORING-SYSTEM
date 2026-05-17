import { useState } from "react";
import { Bell, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { AlertThresholds } from "@/hooks/useAlertThresholds";

interface Props {
  thresholds: AlertThresholds;
  enabled: boolean;
  onUpdate: (t: AlertThresholds) => void;
  onToggle: (enabled: boolean) => void;
}

const fields: { key: keyof AlertThresholds; label: string; unit: string }[] = [
  { key: "voltageMin", label: "Voltage Min", unit: "V" },
  { key: "voltageMax", label: "Voltage Max", unit: "V" },
  { key: "currentMin", label: "Current Min", unit: "A" },
  { key: "currentMax", label: "Current Max", unit: "A" },
  { key: "temperatureMax", label: "Temperature Max", unit: "°C" },
  { key: "irradianceMin", label: "Irradiance Min", unit: "W/m²" },
  { key: "energyOutputMin", label: "Energy Output Min", unit: "W" },
];

export function AlertThresholdsConfig({ thresholds, enabled, onUpdate, onToggle }: Props) {
  const [draft, setDraft] = useState<AlertThresholds>(thresholds);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onUpdate(draft);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1.5">
        <Bell className={`h-4 w-4 ${enabled ? "text-warning" : "text-muted-foreground"}`} />
        <span className="text-xs font-medium text-muted-foreground">Alerts</span>
        <Switch checked={enabled} onCheckedChange={onToggle} className="scale-75" />
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setDraft(thresholds); }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Settings2 className="h-3.5 w-3.5" /> Thresholds
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-warning" />
              Alert Thresholds
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {fields.map(({ key, label, unit }) => (
              <div key={key} className="flex items-center gap-3">
                <Label className="w-36 text-xs text-muted-foreground">{label}</Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    value={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: parseFloat(e.target.value) || 0 })}
                    className="h-8 w-24 font-mono text-sm"
                  />
                  <span className="text-xs text-muted-foreground">{unit}</span>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={handleSave} className="w-full">Save Thresholds</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
