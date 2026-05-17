/**
 * Rule-based AI engine
 * Returns { status, faultType, insight }
 * status: 'active' | 'warning' | 'fault'
 */
function analyze({ panelId, voltage, current, temperature, irradiance, energy }) {
  const safeTemp       = typeof temperature === 'number' && isFinite(temperature) ? temperature : null;
  const safeIrradiance = typeof irradiance  === 'number' && isFinite(irradiance)  ? irradiance  : null;
  const safeEnergy     = typeof energy      === 'number' && isFinite(energy)      ? energy      : null;

  // Rule 0: Critical overheating (storm / extreme conditions)
  if (safeTemp !== null && safeTemp > 70) {
    return {
      status: 'fault',
      faultType: 'Critical Overheating',
      insight: `Panel ${panelId} CRITICAL overheating (${safeTemp}°C) — thermal runaway risk`,
    };
  }

  // Rule 1: Overheating
  if (safeTemp !== null && safeTemp > 45) {
    return {
      status: 'fault',
      faultType: 'Overheating Fault',
      insight: `Panel ${panelId} overheating detected (${safeTemp}°C)`,
    };
  }

  // Rule 2: Dust issue — high irradiance but low energy output
  if (safeIrradiance !== null && safeEnergy !== null && safeIrradiance > 600 && safeEnergy < safeIrradiance * 0.003) {
    return {
      status: 'warning',
      faultType: 'Dust Issue',
      insight: `Panel ${panelId} possible dust accumulation — low energy despite high irradiance`,
    };
  }

  // Rule 3: Hardware fault — very low voltage or current
  if (voltage < 5 || current < 0.5) {
    return {
      status: 'fault',
      faultType: 'Hardware Fault',
      insight: `Panel ${panelId} hardware fault — abnormally low voltage/current`,
    };
  }

  return {
    status: 'active',
    faultType: null,
    insight: `Panel ${panelId} operating normally`,
  };
}

module.exports = { analyze };
