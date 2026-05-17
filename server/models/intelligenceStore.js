// ── In-memory stores for the 3 new modules ──────────────────────────────────

// ── 1. Maintenance Records ───────────────────────────────────────────────────
const MAX_MAINTENANCE = 500;
const maintenanceRecords = []; // { id, panelId, type, status, message, recommendation, priority, scheduledDate, createdAt }
let maintIdCounter = 0;

function addMaintenanceRecord(panelId, type, status, message, recommendation, priority, scheduledDate) {
  maintIdCounter++;
  const record = {
    id: maintIdCounter,
    panelId,
    type,       // 'cleaning' | 'inspection' | 'overheating' | 'replacement'
    status,     // 'healthy' | 'maintenance_required' | 'critical_maintenance'
    message,
    recommendation,
    priority,   // 'low' | 'medium' | 'high' | 'critical'
    scheduledDate: scheduledDate || null,
    createdAt: new Date().toISOString(),
  };
  maintenanceRecords.push(record);
  if (maintenanceRecords.length > MAX_MAINTENANCE) maintenanceRecords.shift();
  return record;
}

function getMaintenanceRecords(panelId) {
  const all = [...maintenanceRecords].reverse();
  return panelId ? all.filter((r) => r.panelId === panelId) : all;
}

// ── 2. Recommendations ───────────────────────────────────────────────────────
const MAX_RECOMMENDATIONS = 300;
const recommendations = []; // { id, panelId, type, severity, message, action, createdAt }
let recIdCounter = 0;

function addRecommendation(panelId, type, severity, message, action) {
  recIdCounter++;
  const rec = {
    id: recIdCounter,
    panelId,
    type,     // 'clean_panel' | 'check_wiring' | 'reduce_overheating' | 'replace_hardware' | 'improve_exposure' | 'check_inverter'
    severity, // 'low' | 'medium' | 'critical'
    message,
    action,
    createdAt: new Date().toISOString(),
  };
  recommendations.push(rec);
  if (recommendations.length > MAX_RECOMMENDATIONS) recommendations.shift();
  return rec;
}

function getRecommendations(panelId) {
  const all = [...recommendations].reverse();
  return panelId ? all.filter((r) => r.panelId === panelId) : all;
}

// ── 3. Fault History ─────────────────────────────────────────────────────────
const MAX_FAULTS = 500;
const faultHistory = []; // { id, panelId, faultType, severity, description, suspended, resolvedAt, createdAt }
let faultIdCounter = 0;

function addFaultRecord(panelId, faultType, severity, description, suspended = false) {
  faultIdCounter++;
  const fault = {
    id: faultIdCounter,
    panelId,
    faultType,
    severity,   // 'warning' | 'critical'
    description,
    suspended,
    resolvedAt: null,
    createdAt: new Date().toISOString(),
  };
  faultHistory.push(fault);
  if (faultHistory.length > MAX_FAULTS) faultHistory.shift();
  return fault;
}

function getFaultHistory(panelId) {
  const all = [...faultHistory].reverse();
  return panelId ? all.filter((f) => f.panelId === panelId) : all;
}

// ── 4. Suspended Panels ──────────────────────────────────────────────────────
const suspendedPanels = {}; // { [panelId]: { suspendedAt, reason, faultType } }

function suspendPanel(panelId, reason, faultType) {
  suspendedPanels[panelId] = {
    panelId,
    reason,
    faultType,
    suspendedAt: new Date().toISOString(),
  };
}

function resumePanel(panelId) {
  delete suspendedPanels[panelId];
}

function isPanelSuspended(panelId) {
  return !!suspendedPanels[panelId];
}

function getSuspendedPanels() {
  return { ...suspendedPanels };
}

// ── 5. Panel efficiency tracking (rolling window) ────────────────────────────
const panelEfficiencyWindows = {}; // { [panelId]: number[] }
const panelTempWindows        = {}; // { [panelId]: number[] }
const WINDOW_SIZE = 20;

function updatePanelWindow(panelId, efficiency, temperature) {
  if (!panelEfficiencyWindows[panelId]) panelEfficiencyWindows[panelId] = [];
  if (!panelTempWindows[panelId])       panelTempWindows[panelId]       = [];

  panelEfficiencyWindows[panelId].push(efficiency);
  panelTempWindows[panelId].push(temperature);

  if (panelEfficiencyWindows[panelId].length > WINDOW_SIZE) panelEfficiencyWindows[panelId].shift();
  if (panelTempWindows[panelId].length > WINDOW_SIZE)       panelTempWindows[panelId].shift();
}

function getPanelWindows(panelId) {
  return {
    efficiency: panelEfficiencyWindows[panelId] ?? [],
    temperature: panelTempWindows[panelId] ?? [],
  };
}

// ── Reset ────────────────────────────────────────────────────────────────────
function resetIntelligenceStore() {
  maintenanceRecords.length = 0;
  recommendations.length    = 0;
  faultHistory.length       = 0;
  maintIdCounter  = 0;
  recIdCounter    = 0;
  faultIdCounter  = 0;
  Object.keys(suspendedPanels).forEach((k) => delete suspendedPanels[k]);
  Object.keys(panelEfficiencyWindows).forEach((k) => delete panelEfficiencyWindows[k]);
  Object.keys(panelTempWindows).forEach((k) => delete panelTempWindows[k]);
}

module.exports = {
  addMaintenanceRecord, getMaintenanceRecords,
  addRecommendation,    getRecommendations,
  addFaultRecord,       getFaultHistory,
  suspendPanel,         resumePanel, isPanelSuspended, getSuspendedPanels,
  updatePanelWindow,    getPanelWindows,
  resetIntelligenceStore,
};
