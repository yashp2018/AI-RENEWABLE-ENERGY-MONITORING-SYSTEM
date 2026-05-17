const {
  addMaintenanceRecord, getMaintenanceRecords,
  addRecommendation,    getRecommendations,
  addFaultRecord,       getFaultHistory,
  suspendPanel,         resumePanel, isPanelSuspended, getSuspendedPanels,
  updatePanelWindow,    getPanelWindows,
} = require('../models/intelligenceStore');
const { addAlert } = require('../models/alertStore');

// ── Constants ────────────────────────────────────────────────────────────────
const PANEL_AREA_M2          = 1.6;
const CRITICAL_TEMP          = 75;
const HIGH_TEMP              = 55;
const DUST_IRRADIANCE_MIN    = 500;
const DUST_ENERGY_MAX_RATIO  = 0.12; // energy < irradiance * area * ratio → dust
const LOW_EFFICIENCY_WARN    = 8;    // %
const LOW_EFFICIENCY_CRIT    = 4;    // %
const ZERO_ENERGY_THRESHOLD  = 5;    // W — considered zero generation
const CRITICAL_HITS_SUSPEND  = 4;    // consecutive critical readings before suspend
const EFFICIENCY_DROP_WARN   = 0.08; // 8% drop from baseline
const EFFICIENCY_DROP_CRIT   = 0.15; // 15% drop from baseline

// Track consecutive critical hits per panel
const criticalHitCounters = {};

function calcEfficiency(energy, irradiance) {
  if (!irradiance || irradiance <= 0) return 0;
  return Math.min(100, (energy / (irradiance * PANEL_AREA_M2)) * 100);
}

// ── Main intelligence analysis — called on every data ingestion ──────────────
function analyzeIntelligence(record) {
  const { panelId, voltage, current, temperature, irradiance, energy } = record;

  const safeTemp  = typeof temperature === 'number' && isFinite(temperature) ? temperature : 0;
  const safeIrr   = typeof irradiance  === 'number' && isFinite(irradiance)  ? irradiance  : 0;
  const safeEnergy = typeof energy     === 'number' && isFinite(energy)      ? energy      : 0;
  const safeVolt  = typeof voltage     === 'number' && isFinite(voltage)     ? voltage     : 0;
  const safeCurr  = typeof current     === 'number' && isFinite(current)     ? current     : 0;

  const efficiency = calcEfficiency(safeEnergy, safeIrr);

  // Update rolling windows
  updatePanelWindow(panelId, efficiency, safeTemp);
  const { efficiency: effWindow, temperature: tempWindow } = getPanelWindows(panelId);

  // ── Module 1: Predictive Maintenance ──────────────────────────────────────
  _runPredictiveMaintenance(panelId, safeTemp, safeIrr, safeEnergy, efficiency, effWindow, tempWindow);

  // ── Module 2: Fault Suspension ────────────────────────────────────────────
  _runFaultSuspension(panelId, safeTemp, safeVolt, safeCurr, safeEnergy, efficiency);

  // ── Module 3: AI Recommendations ─────────────────────────────────────────
  _runRecommendationEngine(panelId, safeTemp, safeIrr, safeEnergy, safeVolt, safeCurr, efficiency, effWindow, tempWindow);
}

// ── Module 1: Predictive Maintenance ────────────────────────────────────────
function _runPredictiveMaintenance(panelId, temp, irradiance, energy, efficiency, effWindow, tempWindow) {
  if (effWindow.length < 5) return; // need enough data

  const recentEff  = effWindow.slice(-5);
  const olderEff   = effWindow.slice(0, Math.max(1, effWindow.length - 5));
  const recentAvg  = recentEff.reduce((a, b) => a + b, 0) / recentEff.length;
  const olderAvg   = olderEff.reduce((a, b) => a + b, 0) / olderEff.length;
  const effDrop    = olderAvg > 0 ? (olderAvg - recentAvg) / olderAvg : 0;

  const recentTemp = tempWindow.slice(-5);
  const avgTemp    = recentTemp.reduce((a, b) => a + b, 0) / recentTemp.length;
  const highTempCount = recentTemp.filter((t) => t > HIGH_TEMP).length;

  // Dust accumulation: high irradiance, persistently low energy
  const dustRatio = irradiance > 0 ? energy / (irradiance * PANEL_AREA_M2) : 1;
  if (irradiance > DUST_IRRADIANCE_MIN && dustRatio < DUST_ENERGY_MAX_RATIO && effWindow.length >= 8) {
    const recentDustCount = effWindow.slice(-5).filter((e) => e < LOW_EFFICIENCY_WARN).length;
    if (recentDustCount >= 3) {
      addMaintenanceRecord(
        panelId, 'cleaning',
        recentDustCount >= 5 ? 'critical_maintenance' : 'maintenance_required',
        `Panel ${panelId} efficiency reduced by ${(effDrop * 100).toFixed(1)}% — dust accumulation pattern detected`,
        'Clean panel surface immediately. Dust can reduce efficiency by up to 30%.',
        recentDustCount >= 5 ? 'critical' : 'high',
        _daysFromNow(recentDustCount >= 5 ? 3 : 10)
      );
    }
  }

  // Overheating maintenance prediction
  if (highTempCount >= 3) {
    addMaintenanceRecord(
      panelId, 'overheating',
      highTempCount >= 5 ? 'critical_maintenance' : 'maintenance_required',
      `Panel ${panelId} overheating detected repeatedly — avg ${avgTemp.toFixed(0)}°C over last ${recentTemp.length} readings`,
      'Inspect cooling system, ventilation gaps, and mounting clearance.',
      highTempCount >= 5 ? 'critical' : 'high',
      _daysFromNow(highTempCount >= 5 ? 1 : 7)
    );
  }

  // Efficiency degradation thresholds
  if (effDrop >= EFFICIENCY_DROP_CRIT) {
    addMaintenanceRecord(
      panelId, 'inspection',
      'critical_maintenance',
      `Panel ${panelId} efficiency reduced by ${(effDrop * 100).toFixed(1)}% — critical degradation`,
      'Immediate inspection required. Possible cell damage, severe soiling, or hardware failure.',
      'critical',
      _daysFromNow(1)
    );
  } else if (effDrop >= EFFICIENCY_DROP_WARN) {
    addMaintenanceRecord(
      panelId, 'inspection',
      'maintenance_required',
      `Panel ${panelId} efficiency reduced by ${(effDrop * 100).toFixed(1)}% — gradual degradation`,
      'Schedule preventive maintenance within 15 days to avoid further efficiency loss.',
      'medium',
      _daysFromNow(15)
    );
  }

  // 15 / 30 / 60 day reminders (simulated via fault count proxy)
  // These are generated by the maintenance schedule endpoint separately
}

// ── Module 2: Fault Suspension ───────────────────────────────────────────────
function _runFaultSuspension(panelId, temp, voltage, current, energy, efficiency) {
  if (isPanelSuspended(panelId)) return;

  let isCritical = false;
  let reason     = '';
  let faultType  = '';

  // FAULT-01: Thermal Runaway
  if (temp > 80) {
    isCritical = true;
    faultType  = 'FAULT-01: Thermal Runaway Risk';
    reason     = `Cell temperature ${temp.toFixed(1)}°C — thermal runaway risk. Irreversible cell damage imminent.`;
  }
  // FAULT-02: Cell Hotspot + abnormal V/I
  else if (temp > 65 && voltage < 15 && current < 3) {
    isCritical = true;
    faultType  = 'FAULT-02: Cell Hotspot Damage';
    reason     = `Hotspot at ${temp.toFixed(1)}°C with degraded V/I signature (${voltage.toFixed(1)}V / ${current.toFixed(1)}A).`;
  }
  // FAULT-05: Bypass Diode Failure
  else if (voltage < 8 && current > 3) {
    isCritical = true;
    faultType  = 'FAULT-05: Bypass Diode Failure';
    reason     = `Voltage critically low (${voltage.toFixed(1)}V) while current elevated (${current.toFixed(1)}A) — string short-circuit risk.`;
  }
  // FAULT-06: Open Circuit
  else if (voltage > 30 && current < 0.3) {
    isCritical = true;
    faultType  = 'FAULT-06: Open Circuit / Wiring Break';
    reason     = `Open circuit — voltage present (${voltage.toFixed(1)}V) but near-zero current (${current.toFixed(2)}A).`;
  }
  // FAULT-04: Delamination
  else if (temp > 40 && efficiency < LOW_EFFICIENCY_CRIT) {
    isCritical = true;
    faultType  = 'FAULT-04: Delamination / Physical Damage';
    reason     = `Efficiency critically low (${efficiency.toFixed(1)}%) at ${temp.toFixed(1)}°C — possible delamination or physical damage.`;
  }
  // FAULT-11: Hardware failure
  else if (voltage < 3 && current < 0.5) {
    isCritical = true;
    faultType  = 'FAULT-11: Hardware / Connector Failure';
    reason     = `Voltage (${voltage.toFixed(1)}V) and current (${current.toFixed(1)}A) both critically low — complete hardware failure.`;
  }
  // Zero generation
  else if (energy <= ZERO_ENERGY_THRESHOLD && efficiency < LOW_EFFICIENCY_CRIT) {
    isCritical = true;
    faultType  = 'FAULT-09: Zero Generation Fault';
    reason     = `Zero energy generation (${energy.toFixed(1)}W) with ${efficiency.toFixed(1)}% efficiency.`;
  }

  if (!criticalHitCounters[panelId]) criticalHitCounters[panelId] = 0;

  if (isCritical) {
    criticalHitCounters[panelId]++;

    // Log fault record every critical hit
    addFaultRecord(panelId, faultType, 'critical', reason, false);

    if (criticalHitCounters[panelId] >= CRITICAL_HITS_SUSPEND) {
      // AUTO-SUSPEND
      suspendPanel(panelId, reason, faultType);
      criticalHitCounters[panelId] = 0;

      addFaultRecord(panelId, faultType, 'critical', `Panel ${panelId} automatically suspended — ${reason}`, true);
      addAlert(panelId, faultType, `🔴 CRITICAL: Panel ${panelId} automatically suspended — ${reason}`, 'critical');

      addMaintenanceRecord(
        panelId, 'replacement',
        'critical_maintenance',
        `Panel ${panelId} automatically suspended due to: ${faultType}`,
        'Immediate maintenance required. Panel isolated from grid. Do not restart without physical inspection.',
        'critical',
        _daysFromNow(0)
      );

      console.log(`[SUSPEND] Panel ${panelId} auto-suspended: ${faultType}`);
    }
  } else {
    // Reset counter on healthy reading
    criticalHitCounters[panelId] = 0;
  }
}

// ── Module 3: AI Recommendation Engine ──────────────────────────────────────
function _runRecommendationEngine(panelId, temp, irradiance, energy, voltage, current, efficiency, effWindow, tempWindow) {
  // Only generate recommendations every N readings to avoid spam
  const windowLen = effWindow.length;
  if (windowLen === 0 || windowLen % 3 !== 0) return;

  const recentEff = effWindow.slice(-5);
  const avgEff    = recentEff.reduce((a, b) => a + b, 0) / recentEff.length;
  const recentTemp = tempWindow.slice(-5);
  const avgTemp    = recentTemp.reduce((a, b) => a + b, 0) / recentTemp.length;

  // High temperature → cooling recommendation
  if (avgTemp > HIGH_TEMP) {
    addRecommendation(
      panelId, 'reduce_overheating',
      avgTemp > CRITICAL_TEMP ? 'critical' : 'medium',
      `Panel ${panelId}: Average temperature ${avgTemp.toFixed(0)}°C — cooling recommended`,
      'Inspect ventilation, check mounting clearance, consider thermal management system.'
    );
  }

  // Low energy with high irradiance → dust
  if (irradiance > DUST_IRRADIANCE_MIN && energy < irradiance * PANEL_AREA_M2 * DUST_ENERGY_MAX_RATIO) {
    addRecommendation(
      panelId, 'clean_panel',
      'medium',
      `Panel ${panelId}: Low energy output (${energy.toFixed(0)}W) despite high irradiance (${irradiance.toFixed(0)} W/m²) — possible dust accumulation`,
      'Clean panel surface with soft cloth and distilled water. Schedule cleaning within 10 days.'
    );
  }

  // Very low voltage/current → wiring check
  if (voltage < 10 && current < 2 && energy > ZERO_ENERGY_THRESHOLD) {
    addRecommendation(
      panelId, 'check_wiring',
      'critical',
      `Panel ${panelId}: Abnormally low voltage (${voltage.toFixed(1)}V) and current (${current.toFixed(1)}A) — wiring issue suspected`,
      'Check all wiring connections, bypass diodes, and junction box. Inspect for corrosion or loose terminals.'
    );
  }

  // Frequent faults → hardware inspection
  const recentFaults = getFaultHistory(panelId).slice(0, 10);
  if (recentFaults.length >= 5) {
    addRecommendation(
      panelId, 'replace_hardware',
      recentFaults.length >= 8 ? 'critical' : 'medium',
      `Panel ${panelId}: ${recentFaults.length} faults recorded recently — hardware inspection required`,
      'Schedule full hardware inspection. Check inverter, bypass diodes, and cell integrity.'
    );
  }

  // Low efficiency with adequate irradiance → sunlight exposure
  if (avgEff < LOW_EFFICIENCY_WARN && irradiance > 300) {
    addRecommendation(
      panelId, 'improve_exposure',
      avgEff < LOW_EFFICIENCY_CRIT ? 'critical' : 'medium',
      `Panel ${panelId}: Low efficiency (${avgEff.toFixed(1)}%) despite adequate irradiance — check for shading or soiling`,
      'Inspect for partial shading, bird droppings, or micro-cracks. Adjust panel angle if possible.'
    );
  }

  // Check inverter — zero energy with normal irradiance
  if (energy <= ZERO_ENERGY_THRESHOLD && irradiance > 200) {
    addRecommendation(
      panelId, 'check_inverter',
      'critical',
      `Panel ${panelId}: Zero energy generation (${energy.toFixed(1)}W) despite irradiance of ${irradiance.toFixed(0)} W/m² — inverter issue suspected`,
      'Check inverter connection, DC disconnect switch, and string fuse. Restart inverter if safe.'
    );
  }
}

function _daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

module.exports = { analyzeIntelligence };
