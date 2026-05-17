import { Brain, AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { Insight } from "@/lib/aiInsights";

interface Props {
  insights: Insight[];
}

const severityConfig = {
  info: { icon: Info, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
  critical: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
};

export function AIInsightsPanel({ insights }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent" />
          <span className="data-label">AI Insights</span>
        </div>
        <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full animate-pulse">
          Analyzing...
        </span>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {insights.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Start simulation to generate AI insights</p>
        ) : (
          insights.map((insight) => {
            const cfg = severityConfig[insight.severity];
            const Icon = cfg.icon;
            return (
              <div key={insight.id} className={`flex items-start gap-2.5 rounded-lg border ${cfg.border} ${cfg.bg} p-3`}>
                <Icon className={`h-4 w-4 ${cfg.color} shrink-0 mt-0.5`} />
                <p className="text-xs text-foreground leading-relaxed">{insight.text}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
