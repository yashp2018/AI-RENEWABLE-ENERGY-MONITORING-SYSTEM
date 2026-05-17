import { useState, useEffect, useRef } from "react";
import {
  Volume2, VolumeX, Bell, BellOff, BellRing,
  Mic, MicOff, AlertCircle, AlertTriangle,
  X, Settings, ChevronDown, ChevronUp, Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { VoiceAlarmEvent } from "@/hooks/useVoiceAlarm";

interface Props {
  enabled: boolean;
  voiceEnabled: boolean;
  alarmEnabled: boolean;
  volume: number;
  isAlarming: boolean;
  alarmEvents: VoiceAlarmEvent[];
  onToggleEnabled:  () => void;
  onToggleVoice:    () => void;
  onToggleAlarm:    () => void;
  onVolumeChange:   (v: number) => void;
  onStopAlarm:      () => void;
  onClearEvents:    () => void;
  onTestWarning:    () => void;
  onTestCritical:   () => void;
}

const severityConfig = {
  info:     { icon: Bell,          color: "text-accent",      bg: "bg-accent/10",      border: "border-accent/20" },
  warning:  { icon: AlertTriangle, color: "text-warning",     bg: "bg-warning/10",     border: "border-warning/20" },
  critical: { icon: AlertCircle,   color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/40" },
};

export function VoiceAlarmSystem({
  enabled, voiceEnabled, alarmEnabled, volume, isAlarming,
  alarmEvents, onToggleEnabled, onToggleVoice, onToggleAlarm,
  onVolumeChange, onStopAlarm, onClearEvents, onTestWarning, onTestCritical,
}: Props) {
  const [showLog,      setShowLog]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const criticalCount = alarmEvents.filter((e) => e.severity === "critical").length;
  const warningCount  = alarmEvents.filter((e) => e.severity === "warning").length;

  return (
    <>
      {/* ── Critical alarm full-screen flash overlay ──────────────────────── */}
      {isAlarming && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <div className="absolute inset-0 bg-destructive/8 animate-pulse" />
          <div className="absolute inset-x-0 top-0 h-1 bg-destructive animate-pulse" />
          <div className="absolute inset-x-0 bottom-0 h-1 bg-destructive animate-pulse" />
        </div>
      )}

      {/* ── Floating alarm banner (appears when alarming) ─────────────────── */}
      {isAlarming && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99] w-full max-w-lg px-4">
          <div className="flex items-center gap-3 rounded-xl border-2 border-destructive bg-destructive/20 backdrop-blur-sm px-4 py-3 shadow-2xl glow-destructive">
            <div className="relative shrink-0">
              <BellRing className="h-6 w-6 text-destructive animate-bounce" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive animate-ping" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-destructive uppercase tracking-wide">
                🚨 CRITICAL ALARM ACTIVE
              </p>
              {alarmEvents[0] && (
                <p className="text-xs text-foreground/80 truncate mt-0.5">{alarmEvents[0].message}</p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onStopAlarm}
              className="shrink-0 h-7 gap-1 border-destructive/50 text-destructive hover:bg-destructive/20 text-xs"
            >
              <VolumeX className="h-3.5 w-3.5" /> Silence
            </Button>
          </div>
        </div>
      )}

      {/* ── Main Voice Alarm Panel ────────────────────────────────────────── */}
      <div className={`rounded-xl border bg-card p-5 space-y-4 transition-all duration-300 ${
        isAlarming ? "border-destructive/60 glow-destructive" : "border-border"
      }`}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              isAlarming ? "bg-destructive/20" : enabled ? "bg-primary/10" : "bg-muted"
            }`}>
              {isAlarming
                ? <BellRing className="h-4 w-4 text-destructive animate-bounce" />
                : enabled
                  ? <Bell className="h-4 w-4 text-primary" />
                  : <BellOff className="h-4 w-4 text-muted-foreground" />
              }
            </div>
            <div>
              <span className="data-label">Voice Alarm System</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Real-time voice alerts · Alarm detection
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAlarming && (
              <span className="flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full animate-pulse">
                <BellRing className="h-3 w-3" /> ALARMING
              </span>
            )}
            {!isAlarming && alarmEvents.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {alarmEvents.length} events
              </span>
            )}
            <button
              onClick={() => setShowSettings((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Status indicators */}
        <div className="grid grid-cols-3 gap-2">
          {/* Master toggle */}
          <button
            onClick={onToggleEnabled}
            className={`rounded-lg border p-3 text-center transition-all duration-200 ${
              enabled
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-muted/30 text-muted-foreground hover:border-border/80"
            }`}
          >
            <Bell className={`h-4 w-4 mx-auto mb-1 ${enabled ? "text-primary" : "text-muted-foreground"}`} />
            <p className="text-[10px] font-semibold uppercase tracking-wider">
              {enabled ? "Enabled" : "Disabled"}
            </p>
          </button>

          {/* Voice toggle */}
          <button
            onClick={onToggleVoice}
            disabled={!enabled}
            className={`rounded-lg border p-3 text-center transition-all duration-200 disabled:opacity-40 ${
              voiceEnabled && enabled
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border bg-muted/30 text-muted-foreground hover:border-border/80"
            }`}
          >
            {voiceEnabled && enabled
              ? <Mic className="h-4 w-4 mx-auto mb-1 text-accent" />
              : <MicOff className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            }
            <p className="text-[10px] font-semibold uppercase tracking-wider">
              {voiceEnabled ? "Voice On" : "Voice Off"}
            </p>
          </button>

          {/* Alarm toggle */}
          <button
            onClick={onToggleAlarm}
            disabled={!enabled}
            className={`rounded-lg border p-3 text-center transition-all duration-200 disabled:opacity-40 ${
              alarmEnabled && enabled
                ? "border-warning/40 bg-warning/10 text-warning"
                : "border-border bg-muted/30 text-muted-foreground hover:border-border/80"
            }`}
          >
            {alarmEnabled && enabled
              ? <Volume2 className="h-4 w-4 mx-auto mb-1 text-warning" />
              : <VolumeX className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            }
            <p className="text-[10px] font-semibold uppercase tracking-wider">
              {alarmEnabled ? "Alarm On" : "Alarm Off"}
            </p>
          </button>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Settings</p>

            {/* Volume slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Volume2 className="h-3 w-3" /> Volume
                </span>
                <span className="font-mono text-foreground">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                disabled={!enabled}
                className="w-full h-1.5 rounded-full accent-primary disabled:opacity-40 cursor-pointer"
              />
            </div>

            {/* What triggers voice */}
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">Voice triggers:</p>
              <div className="flex flex-wrap gap-1.5">
                {["Critical faults", "Panel suspension", "Hardware failure", "Overheating", "Warnings"].map((t) => (
                  <span key={t} className="text-[9px] font-medium bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Test buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!enabled}
                onClick={onTestWarning}
                className="flex-1 h-7 gap-1 text-xs border-warning/40 text-warning hover:bg-warning/10"
              >
                <Play className="h-3 w-3" /> Test Warning
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!enabled}
                onClick={onTestCritical}
                className="flex-1 h-7 gap-1 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <Play className="h-3 w-3" /> Test Critical
              </Button>
            </div>
          </div>
        )}

        {/* Alert summary badges */}
        {alarmEvents.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {criticalCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded-full">
                <AlertCircle className="h-3 w-3" /> {criticalCount} Critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full">
                <AlertTriangle className="h-3 w-3" /> {warningCount} Warnings
              </span>
            )}
            {isAlarming && (
              <Button
                size="sm"
                variant="outline"
                onClick={onStopAlarm}
                className="h-6 gap-1 text-xs border-destructive/40 text-destructive hover:bg-destructive/10 ml-auto"
              >
                <VolumeX className="h-3 w-3" /> Stop Alarm
              </Button>
            )}
          </div>
        )}

        {/* Event log toggle */}
        <button
          onClick={() => setShowLog((v) => !v)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <BellRing className="h-3.5 w-3.5" />
          <span>Voice Alert Log ({alarmEvents.length})</span>
          {showLog
            ? <ChevronUp className="h-3.5 w-3.5 ml-auto" />
            : <ChevronDown className="h-3.5 w-3.5 ml-auto" />
          }
          {alarmEvents.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onClearEvents(); }}
              className="ml-1 p-0.5 rounded hover:bg-muted"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </button>

        {/* Event log */}
        {showLog && (
          <ScrollArea className="h-[200px]">
            {alarmEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No alarm events yet</p>
            ) : (
              <div className="space-y-1.5">
                {alarmEvents.map((evt) => {
                  const cfg  = severityConfig[evt.severity] ?? severityConfig.info;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={evt.id}
                      className={`flex items-start gap-2.5 rounded-lg border ${cfg.border} ${cfg.bg} p-2.5`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${cfg.color} shrink-0 mt-0.5`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          {evt.panel && (
                            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                              {evt.panel}
                            </span>
                          )}
                          <span className={`text-[9px] font-bold uppercase px-1 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                            {evt.severity}
                          </span>
                          {evt.spoken && (
                            <span className="text-[9px] text-accent flex items-center gap-0.5 ml-auto">
                              <Mic className="h-2.5 w-2.5" /> spoken
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground leading-relaxed">{evt.message}</p>
                        <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
                          🕐 {evt.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        )}
      </div>
    </>
  );
}
