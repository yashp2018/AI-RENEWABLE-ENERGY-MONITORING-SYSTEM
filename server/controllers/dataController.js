const { addRecord, getLastN, updatePanel } = require('../models/dataStore');
const { addAlert } = require('../models/alertStore');
const { analyze } = require('./aiEngine');
const { analyzeIntelligence } = require('./intelligenceController');

// Valid ranges for sensor readings
const RANGES = {
  voltage:     { min: 0,    max: 1000 },
  current:     { min: 0,    max: 100  },
  temperature: { min: -50,  max: 150  },
  irradiance:  { min: 0,    max: 2000 },
  energy:      { min: 0,    max: 1e6  },
};

function isFiniteNumber(v) {
  return typeof v === 'number' && isFinite(v);
}

function validateRange(field, value) {
  const r = RANGES[field];
  if (value < r.min || value > r.max)
    return `${field} must be between ${r.min} and ${r.max}, got ${value}`;
  return null;
}

function receiveData(req, res) {
  const { panelId, voltage, current, temperature, irradiance, energy, timestamp } = req.body;

  // --- Required fields ---
  if (!panelId) return res.status(400).json({ error: 'panelId is required' });
  if (typeof panelId !== 'string' || !/^[a-zA-Z0-9_-]{1,50}$/.test(panelId.trim()))
    return res.status(400).json({ error: 'panelId must be an alphanumeric string (max 50 chars, allows _ -)' });
  if (voltage == null) return res.status(400).json({ error: 'voltage is required' });
  if (current == null) return res.status(400).json({ error: 'current is required' });

  // --- Type checks ---
  const numericFields = { voltage, current, temperature, irradiance, energy };
  for (const [field, value] of Object.entries(numericFields)) {
    if (value != null && !isFiniteNumber(value))
      return res.status(400).json({ error: `${field} must be a finite number` });
  }

  // --- Range checks ---
  for (const field of ['voltage', 'current']) {
    const err = validateRange(field, numericFields[field]);
    if (err) return res.status(400).json({ error: err });
  }
  for (const field of ['temperature', 'irradiance', 'energy']) {
    if (numericFields[field] != null) {
      const err = validateRange(field, numericFields[field]);
      if (err) return res.status(400).json({ error: err });
    }
  }

  // --- Timestamp validation ---
  let resolvedTimestamp = new Date().toISOString();
  if (timestamp != null) {
    const d = new Date(timestamp);
    if (isNaN(d.getTime()))
      return res.status(400).json({ error: 'timestamp must be a valid ISO 8601 date string' });
    resolvedTimestamp = d.toISOString();
  }

  const record = {
    panelId: panelId.trim(),
    voltage,
    current,
    temperature: temperature ?? null,
    irradiance:  irradiance  ?? null,
    energy:      energy      ?? null,
    timestamp:   resolvedTimestamp,
  };

  const { status, faultCode, faultType, severity, insight, action } = analyze(record);
  record.status    = status;
  record.faultCode = faultCode;
  record.faultType = faultType;
  record.severity  = severity;
  record.insight   = insight;
  record.action    = action;

  addRecord(record);
  updatePanel(record.panelId, record, status, insight);

  // Run intelligence analysis (maintenance, suspension, recommendations)
  analyzeIntelligence(record);

  if (status !== 'active') {
    const alertMsg = action ? `${insight} | Action: ${action}` : insight;
    addAlert(record.panelId, faultType || 'Alert', alertMsg, severity === 'critical' || severity === 'high' ? 'critical' : 'warning');
  }

  console.log(`[DATA] ${record.timestamp} | Panel ${record.panelId} | ${faultCode ?? 'OK'} | ${status.toUpperCase()} | ${insight}`);
  res.status(201).json({ received: true, status, faultCode, faultType, severity, insight, action });
}

function getData(req, res) {
  let n = 50;
  if (req.query.n !== undefined) {
    n = parseInt(req.query.n, 10);
    if (isNaN(n) || n < 1 || n > 500)
      return res.status(400).json({ error: 'Query param n must be an integer between 1 and 500' });
  }
  res.json(getLastN(n));
}

module.exports = { receiveData, getData };
