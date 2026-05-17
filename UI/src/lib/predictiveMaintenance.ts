export type MaintenancePriority = "low" | "medium" | "high" | "critical";

export interface MaintenanceRecord {
  panelId: string;
  panelName: string;
  lastCleaned: Date;
  installDate: Date;
  efficiencyBaseline: number;
  efficiencyHistory: number[]; // last 60 readings
  faultCount: number;
  totalEnergyGenerated: number; // Wh
}

export interface MaintenanceAlert {
  id: string;
  panelId: string;
  panelName: string;
  type: "cleaning" | "inspection" | "replacement" | "overdue";
  priority: MaintenancePriority;
  message: string;
  recommendation: string;
  daysOverdue?: number;
  scheduledDate: Date;
  timestamp: Date;
}

export interface DegradationAnalysis {
  panelId: string;
  currentEfficiency: number;
  baselineEfficiency: number;
  degradationRate: number; // % per reading
  trend: "improving" | "stable" | "degrading" | "critical";
  predictedDaysToMaintenance: number;
}

const CLEANING_INTERVAL_DAYS = 30;
const INSPECTION_INTERVAL_DAYS = 90;
const CRITICAL_DEGRADATION_THRESHOLD = 0.15; // 15% drop triggers critical
const WARNING_DEGRADATION_THRESHOLD = 0.08;  // 8% drop triggers warning

export function analyzeDegradation(record: MaintenanceRecord): DegradationAnalysis {
  const hist = record.efficiencyHistory;
  if (hist.length < 5) {
    return {
      panelId: record.panelId,
      currentEfficiency: hist[hist.length - 1] ?? 0,
      baselineEfficiency: record.efficiencyBaseline,
      degradationRate: 0,
      trend: "stable",
      predictedDaysToMaintenance: CLEANING_INTERVAL_DAYS,
    };
  }

  const recent = hist.slice(-10);
  const older  = hist.slice(-20, -10);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg  = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;

  const degradationRate = olderAvg > 0 ? (olderAvg - recentAvg) / olderAvg : 0;
  const dropFromBaseline = record.efficiencyBaseline > 0
    ? (record.efficiencyBaseline - recentAvg) / record.efficiencyBaseline
    : 0;

  let trend: DegradationAnalysis["trend"] = "stable";
  if (degradationRate > 0.02) trend = "degrading";
  if (dropFromBaseline >= CRITICAL_DEGRADATION_THRESHOLD) trend = "critical";
  if (degradationRate < -0.01) trend = "improving";

  // Predict days until efficiency drops another 10%
  const predictedDays = degradationRate > 0
    ? Math.round((recentAvg * 0.1) / (degradationRate * recentAvg) * 2)
    : CLEANING_INTERVAL_DAYS;

  return {
    panelId: record.panelId,
    currentEfficiency: recentAvg,
    baselineEfficiency: record.efficiencyBaseline,
    degradationRate,
    trend,
    predictedDaysToMaintenance: Math.max(1, Math.min(predictedDays, 90)),
  };
}

export function generateMaintenanceAlerts(records: MaintenanceRecord[]): MaintenanceAlert[] {
  const alerts: MaintenanceAlert[] = [];
  const now = new Date();

  records.forEach((record) => {
    const daysSinceCleaning = Math.floor(
      (now.getTime() - record.lastCleaned.getTime()) / (1000 * 60 * 60 * 24)
    );
    const analysis = analyzeDegradation(record);

    // Cleaning reminders at 30 / 60 / 90 days
    if (daysSinceCleaning >= INSPECTION_INTERVAL_DAYS) {
      alerts.push({
        id: `clean-90-${record.panelId}`,
        panelId: record.panelId,
        panelName: record.panelName,
        type: "overdue",
        priority: "critical",
        message: `${record.panelName}: Cleaning overdue by ${daysSinceCleaning - INSPECTION_INTERVAL_DAYS} days`,
        recommendation: "Immediate panel cleaning required. Efficiency severely impacted.",
        daysOverdue: daysSinceCleaning - INSPECTION_INTERVAL_DAYS,
        scheduledDate: new Date(record.lastCleaned.getTime() + INSPECTION_INTERVAL_DAYS * 86400000),
        timestamp: now,
      });
    } else if (daysSinceCleaning >= 60) {
      alerts.push({
        id: `clean-60-${record.panelId}`,
        panelId: record.panelId,
        panelName: record.panelName,
        type: "cleaning",
        priority: "high",
        message: `${record.panelName}: Cleaning due in ${INSPECTION_INTERVAL_DAYS - daysSinceCleaning} days`,
        recommendation: "Schedule panel cleaning within the next 30 days.",
        scheduledDate: new Date(record.lastCleaned.getTime() + INSPECTION_INTERVAL_DAYS * 86400000),
        timestamp: now,
      });
    } else if (daysSinceCleaning >= CLEANING_INTERVAL_DAYS) {
      alerts.push({
        id: `clean-30-${record.panelId}`,
        panelId: record.panelId,
        panelName: record.panelName,
        type: "cleaning",
        priority: "medium",
        message: `${record.panelName}: 30-day cleaning reminder`,
        recommendation: "Routine cleaning recommended to maintain peak efficiency.",
        scheduledDate: new Date(record.lastCleaned.getTime() + CLEANING_INTERVAL_DAYS * 86400000),
        timestamp: now,
      });
    }

    // Degradation-based alerts
    if (analysis.trend === "critical") {
      alerts.push({
        id: `degrade-critical-${record.panelId}`,
        panelId: record.panelId,
        panelName: record.panelName,
        type: "inspection",
        priority: "critical",
        message: `${record.panelName}: Critical efficiency drop — ${(analysis.degradationRate * 100).toFixed(1)}% degradation detected`,
        recommendation: "Immediate inspection required. Possible hardware failure or severe soiling.",
        scheduledDate: now,
        timestamp: now,
      });
    } else if (analysis.trend === "degrading") {
      alerts.push({
        id: `degrade-warn-${record.panelId}`,
        panelId: record.panelId,
        panelName: record.panelName,
        type: "inspection",
        priority: "medium",
        message: `${record.panelName}: Gradual efficiency reduction detected`,
        recommendation: `Predicted maintenance needed in ~${analysis.predictedDaysToMaintenance} days.`,
        scheduledDate: new Date(now.getTime() + analysis.predictedDaysToMaintenance * 86400000),
        timestamp: now,
      });
    }

    // High fault count
    if (record.faultCount >= 5) {
      alerts.push({
        id: `faults-${record.panelId}`,
        panelId: record.panelId,
        panelName: record.panelName,
        type: "replacement",
        priority: record.faultCount >= 10 ? "critical" : "high",
        message: `${record.panelName}: ${record.faultCount} faults recorded — hardware inspection needed`,
        recommendation: "Check wiring, inverter connections, and panel integrity.",
        scheduledDate: now,
        timestamp: now,
      });
    }
  });

  return alerts.sort((a, b) => {
    const order: Record<MaintenancePriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });
}

export function createMaintenanceRecord(
  panelId: string,
  panelName: string,
  baselineEfficiency = 18
): MaintenanceRecord {
  const now = new Date();
  // Simulate last cleaned 25 days ago for demo realism
  const lastCleaned = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);
  return {
    panelId,
    panelName,
    lastCleaned,
    installDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    efficiencyBaseline: baselineEfficiency,
    efficiencyHistory: [],
    faultCount: 0,
    totalEnergyGenerated: 0,
  };
}
