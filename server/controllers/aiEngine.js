/**
 * AI Detection Engine — 12 fault types
 * Returns { status, faultType, faultCode, severity, insight, action }
 * status : 'active' | 'warning' | 'fault'
 * severity: 'low' | 'medium' | 'high' | 'critical'
 */
function analyze({ panelId, voltage, current, temperature, irradiance, energy }) {
  const T   = typeof temperature === 'number' && isFinite(temperature) ? temperature : null;
  const Irr = typeof irradiance  === 'number' && isFinite(irradiance)  ? irradiance  : null;
  const E   = typeof energy      === 'number' && isFinite(energy)      ? energy      : null;
  const V   = typeof voltage     === 'number' && isFinite(voltage)     ? voltage     : 0;
  const I   = typeof current     === 'number' && isFinite(current)     ? current     : 0;

  const PANEL_AREA = 1.6; // m²
  const efficiency = (Irr && Irr > 0 && E) ? Math.min(100, (E / (Irr * PANEL_AREA)) * 100) : null;

  // ── FAULT-01: Thermal Runaway Risk ────────────────────────────────────────
  if (T !== null && T > 80) {
    return _result('fault', 'FAULT-01', 'Thermal Runaway Risk', 'critical',
      `${panelId}: Thermal runaway risk — cell temperature ${T.toFixed(1)}°C exceeds safe limit of 80°C. Irreversible cell damage imminent.`,
      'Emergency shutdown recommended. Inspect for blocked airflow, failed bypass diodes, or hotspot formation.'
    );
  }

  // ── FAULT-02: Cell Hotspot Damage ─────────────────────────────────────────
  if (T !== null && T > 65 && V < 15 && I < 3) {
    return _result('fault', 'FAULT-02', 'Cell Hotspot Damage', 'critical',
      `${panelId}: Cell hotspot damage detected — temperature ${T.toFixed(1)}°C with abnormal V/I signature (${V.toFixed(1)}V / ${I.toFixed(1)}A). Localized cell failure.`,
      'Perform thermal imaging scan. Replace damaged cell strings. Check bypass diode integrity.'
    );
  }

  // ── FAULT-03: Thermal Stress / Overheating ────────────────────────────────
  if (T !== null && T > 55) {
    return _result('fault', 'FAULT-03', 'Thermal Stress Overheating', 'high',
      `${panelId}: Thermal stress detected — operating temperature ${T.toFixed(1)}°C (safe max: 55°C). Efficiency loss ~${((T - 25) * 0.4).toFixed(1)}% from thermal derating.`,
      'Improve ventilation clearance. Check mounting tilt angle. Consider anti-soiling coating to reduce heat absorption.'
    );
  }

  // ── FAULT-04: Delamination / Physical Damage ──────────────────────────────
  if (T !== null && T > 40 && efficiency !== null && efficiency < 5 && Irr > 400) {
    return _result('fault', 'FAULT-04', 'Delamination / Physical Damage', 'critical',
      `${panelId}: Possible delamination or physical panel damage — efficiency critically low at ${efficiency.toFixed(1)}% despite ${Irr.toFixed(0)} W/m² irradiance and ${T.toFixed(1)}°C temperature.`,
      'Perform visual inspection for cracks, delamination bubbles, or discoloration. Panel may require replacement.'
    );
  }

  // ── FAULT-05: Bypass Diode Failure ────────────────────────────────────────
  if (V < 8 && I > 3) {
    return _result('fault', 'FAULT-05', 'Bypass Diode Failure', 'critical',
      `${panelId}: Bypass diode failure suspected — voltage critically low (${V.toFixed(1)}V) while current remains elevated (${I.toFixed(1)}A). String short-circuit risk.`,
      'Immediately isolate panel from string. Test each bypass diode with multimeter. Replace failed diodes before reconnecting.'
    );
  }

  // ── FAULT-06: Open Circuit / Wiring Break ─────────────────────────────────
  if (V > 30 && I < 0.3 && Irr !== null && Irr > 300) {
    return _result('fault', 'FAULT-06', 'Open Circuit / Wiring Break', 'critical',
      `${panelId}: Open circuit detected — voltage present (${V.toFixed(1)}V) but near-zero current (${I.toFixed(2)}A) under ${Irr.toFixed(0)} W/m² irradiance. Broken conductor or connector failure.`,
      'Inspect all MC4 connectors, junction box terminals, and string wiring for breaks, corrosion, or loose connections.'
    );
  }

  // ── FAULT-07: Partial Shading / Soiling ───────────────────────────────────
  if (Irr !== null && E !== null && Irr > 600 && efficiency !== null && efficiency < 8) {
    return _result('warning', 'FAULT-07', 'Partial Shading / Soiling', 'medium',
      `${panelId}: Partial shading or heavy soiling detected — efficiency ${efficiency.toFixed(1)}% under ${Irr.toFixed(0)} W/m² irradiance. Energy output ${E.toFixed(0)}W vs expected ~${(Irr * PANEL_AREA * 0.18).toFixed(0)}W.`,
      'Inspect for bird droppings, dust accumulation, or nearby obstructions casting shadow. Clean panel surface.'
    );
  }

  // ── FAULT-08: Dust Accumulation ───────────────────────────────────────────
  if (Irr !== null && E !== null && Irr > 500 && E < Irr * 0.003) {
    return _result('warning', 'FAULT-08', 'Dust Accumulation', 'medium',
      `${panelId}: Dust accumulation detected — energy output ${E.toFixed(0)}W is ${((1 - E / (Irr * PANEL_AREA * 0.18)) * 100).toFixed(0)}% below expected for ${Irr.toFixed(0)} W/m² irradiance.`,
      'Schedule panel cleaning within 7 days. Use soft brush and deionised water. Avoid cleaning during peak sun hours.'
    );
  }

  // ── FAULT-09: Inverter / MPPT Disconnect ─────────────────────────────────
  if (E !== null && E < 5 && Irr !== null && Irr > 250 && V > 10) {
    return _result('fault', 'FAULT-09', 'Inverter / MPPT Disconnect', 'high',
      `${panelId}: Inverter or MPPT disconnect suspected — zero energy output (${E.toFixed(1)}W) despite ${Irr.toFixed(0)} W/m² irradiance and ${V.toFixed(1)}V panel voltage.`,
      'Check inverter status display, DC isolator switch, and string fuse. Restart inverter. Verify MPPT tracking range.'
    );
  }

  // ── FAULT-10: Micro-Crack / Cell Degradation ──────────────────────────────
  if (efficiency !== null && efficiency < 6 && Irr !== null && Irr > 400 && T !== null && T < 50) {
    return _result('warning', 'FAULT-10', 'Micro-Crack / Cell Degradation', 'high',
      `${panelId}: Micro-crack or cell degradation suspected — efficiency ${efficiency.toFixed(1)}% under normal conditions (${Irr.toFixed(0)} W/m², ${T.toFixed(1)}°C). Gradual power loss pattern.`,
      'Perform electroluminescence (EL) imaging to locate micro-cracks. Monitor efficiency trend over next 7 days.'
    );
  }

  // ── FAULT-11: Hardware / Connector Failure ────────────────────────────────
  if (V < 5 || I < 0.5) {
    return _result('fault', 'FAULT-11', 'Hardware / Connector Failure', 'high',
      `${panelId}: Hardware or connector failure — voltage ${V.toFixed(1)}V, current ${I.toFixed(2)}A both critically low. Panel not generating power.`,
      'Check MC4 connectors, junction box, and string combiner. Test panel with clamp meter. Inspect for rodent damage to cables.'
    );
  }

  // ── FAULT-12: Low Irradiance / Weather Impact ─────────────────────────────
  if (Irr !== null && Irr < 100 && E !== null && E < 20) {
    return _result('active', 'FAULT-12', 'Low Irradiance Condition', 'low',
      `${panelId}: Low irradiance condition — ${Irr.toFixed(0)} W/m² (${E.toFixed(0)}W output). Weather-related reduction, no fault detected.`,
      'Normal operation under low-light conditions. Monitor for improvement when weather clears.'
    );
  }

  // ── All clear ─────────────────────────────────────────────────────────────
  return _result('active', null, null, 'low',
    `${panelId}: Operating normally — ${V.toFixed(1)}V / ${I.toFixed(2)}A${efficiency !== null ? ` / ${efficiency.toFixed(1)}% efficiency` : ''}`,
    null
  );
}

function _result(status, faultCode, faultType, severity, insight, action) {
  return { status, faultCode, faultType, severity, insight, action };
}

module.exports = { analyze };
