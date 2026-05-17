import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  suffix?: string;
  trend?: string;
  colorClass?: string;
}

export function StatCard({ title, value, icon: Icon, suffix, trend, colorClass = "text-primary" }: StatCardProps) {
  return (
    <div className="glass-card-hover p-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{title}</p>
          <p className={`text-2xl font-bold mt-2 ${colorClass}`}>
            {value}{suffix}
          </p>
          {trend && (
            <p className="text-xs text-muted-foreground mt-1">{trend}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
