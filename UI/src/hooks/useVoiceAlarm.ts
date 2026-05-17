import { useRef, useCallback, useEffect, useState } from "react";
import type { ApiAlert } from "@/hooks/useApiData";
import type { PanelState } from "@/hooks/useMultiPanelSimulation";

export interface VoiceAlarmEvent {
  id: string;
  message: string;
  severity: "info" | "warning" | "critical";
  panel?: string;
  timestamp: Date;
  spoken: boolean;
}

interface Options {
  enabled: boolean;
  volume: number;        // 0–1
  alarmEnabled: boolean; // beep alarm sound
  voiceEnabled: boolean; // speech synthesis
}

// ── Build alarm beep using Web Audio API ─────────────────────────────────────
function createAlarmSound(ctx: AudioContext, severity: "warning" | "critical"): void {
  const isCritical = severity === "critical";
  const beepCount  = isCritical ? 4 : 2;
  const freq       = isCritical ? 880 : 660;
  const beepMs     = isCritical ? 180 : 220;
  const gapMs      = isCritical ? 100 : 150;

  for (let i = 0; i < beepCount; i++) {
    const startTime = ctx.currentTime + i * ((beepMs + gapMs) / 1000);

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type      = isCritical ? "sawtooth" : "square";
    osc.frequency.setValueAtTime(freq, startTime);

    // Slight frequency sweep for critical
    if (isCritical) {
      osc.frequency.linearRampToValueAtTime(freq * 1.3, startTime + beepMs / 1000);
    }

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
    gain.gain.setValueAtTime(0.4, startTime + beepMs / 1000 - 0.02);
    gain.gain.linearRampToValueAtTime(0, startTime + beepMs / 1000);

    osc.start(startTime);
    osc.stop(startTime + beepMs / 1000);
  }
}

// ── Build voice message text ──────────────────────────────────────────────────
function buildSpeechText(alert: ApiAlert): string {
  const panel   = alert.panel ? `Panel ${alert.panel}.` : "";
  const prefix  =
    alert.severity === "critical" ? "Critical alert!" :
    alert.severity === "warning"  ? "Warning!" : "Notice.";
  // Strip emoji from message for cleaner speech
  const clean = alert.message.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").trim();
  return `${prefix} ${panel} ${clean}`;
}

export function useVoiceAlarm(options: Options) {
  const audioCtxRef    = useRef<AudioContext | null>(null);
  const spokenIdsRef   = useRef<Set<string | number>>(new Set());
  const synthRef       = useRef<SpeechSynthesis | null>(null);
  const queueRef       = useRef<SpeechSynthesisUtterance[]>([]);
  const speakingRef    = useRef(false);

  const [alarmEvents, setAlarmEvents] = useState<VoiceAlarmEvent[]>([]);
  const [isAlarming,  setIsAlarming]  = useState(false);
  const alarmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lazy-init AudioContext on first use (requires user gesture)
  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Init speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      synthRef.current?.cancel();
    };
  }, []);

  // Drain speech queue
  const drainQueue = useCallback(() => {
    if (!synthRef.current || speakingRef.current || queueRef.current.length === 0) return;
    const utt = queueRef.current.shift()!;
    speakingRef.current = true;
    utt.onend = () => {
      speakingRef.current = false;
      drainQueue();
    };
    utt.onerror = () => {
      speakingRef.current = false;
      drainQueue();
    };
    synthRef.current.speak(utt);
  }, []);

  const speak = useCallback((text: string, severity: "info" | "warning" | "critical") => {
    if (!synthRef.current || !options.voiceEnabled || !options.enabled) return;
    const utt  = new SpeechSynthesisUtterance(text);
    utt.volume = options.volume;
    utt.rate   = severity === "critical" ? 1.1 : 0.95;
    utt.pitch  = severity === "critical" ? 1.3 : 1.0;

    // Pick a voice — prefer English
    const voices = synthRef.current.getVoices();
    const eng    = voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female"))
                ?? voices.find((v) => v.lang.startsWith("en"))
                ?? voices[0];
    if (eng) utt.voice = eng;

    queueRef.current.push(utt);
    drainQueue();
  }, [options.enabled, options.voiceEnabled, options.volume, drainQueue]);

  const playAlarm = useCallback((severity: "warning" | "critical") => {
    if (!options.alarmEnabled || !options.enabled) return;
    try {
      const ctx = getAudioCtx();
      createAlarmSound(ctx, severity);

      // Flash alarm state for 3s
      setIsAlarming(true);
      if (alarmTimerRef.current) clearTimeout(alarmTimerRef.current);
      alarmTimerRef.current = setTimeout(() => setIsAlarming(false), 3000);
    } catch {
      // AudioContext blocked — ignore
    }
  }, [options.enabled, options.alarmEnabled, getAudioCtx]);

  // Main trigger — called with new alerts
  const triggerAlerts = useCallback((alerts: ApiAlert[]) => {
    if (!options.enabled) return;

    const newAlerts = alerts.filter(
      (a) => !spokenIdsRef.current.has(a.id) && a.severity !== "info"
    );
    if (newAlerts.length === 0) return;

    // Sort: critical first
    const sorted = [...newAlerts].sort((a, b) => {
      const o = { critical: 0, warning: 1, info: 2 };
      return (o[a.severity] ?? 2) - (o[b.severity] ?? 2);
    });

    sorted.forEach((alert) => {
      spokenIdsRef.current.add(alert.id);

      const event: VoiceAlarmEvent = {
        id:        `${alert.id}-${Date.now()}`,
        message:   alert.message,
        severity:  alert.severity,
        panel:     alert.panel,
        timestamp: new Date(),
        spoken:    options.voiceEnabled && options.enabled,
      };

      setAlarmEvents((prev) => [event, ...prev].slice(0, 30));

      // Play alarm beep
      if (alert.severity === "critical" || alert.severity === "warning") {
        playAlarm(alert.severity);
      }

      // Speak the alert
      speak(buildSpeechText(alert), alert.severity);
    });
  }, [options.enabled, options.voiceEnabled, playAlarm, speak]);

  // Panel suspension voice alert
  const triggerSuspension = useCallback((panelName: string) => {
    if (!options.enabled) return;
    const text = `Emergency! ${panelName} has been automatically suspended due to critical damage. Immediate maintenance required.`;
    playAlarm("critical");
    speak(text, "critical");

    const event: VoiceAlarmEvent = {
      id:        `suspend-${panelName}-${Date.now()}`,
      message:   `🔴 ${panelName} automatically suspended — critical damage detected`,
      severity:  "critical",
      panel:     panelName,
      timestamp: new Date(),
      spoken:    true,
    };
    setAlarmEvents((prev) => [event, ...prev].slice(0, 30));
  }, [options.enabled, playAlarm, speak]);

  // Panel fault voice alert
  const triggerFault = useCallback((panelName: string, faultType: string) => {
    if (!options.enabled) return;
    const text = `Warning! ${panelName} fault detected. ${faultType}. Please check the system.`;
    playAlarm("warning");
    speak(text, "warning");
  }, [options.enabled, playAlarm, speak]);

  const clearEvents = useCallback(() => {
    setAlarmEvents([]);
    spokenIdsRef.current.clear();
  }, []);

  const stopAlarm = useCallback(() => {
    synthRef.current?.cancel();
    speakingRef.current = false;
    queueRef.current    = [];
    setIsAlarming(false);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (alarmTimerRef.current) clearTimeout(alarmTimerRef.current);
      synthRef.current?.cancel();
      audioCtxRef.current?.close();
    };
  }, []);

  return {
    triggerAlerts,
    triggerSuspension,
    triggerFault,
    stopAlarm,
    clearEvents,
    alarmEvents,
    isAlarming,
  };
}
