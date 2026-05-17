/**
 * Predicts next 10 energy values using simple moving average + linear trend.
 * Returns { predictions: [{step, value, timestamp}], confidence }
 */
function predict(records) {
  if (!Array.isArray(records))
    return { predictions: [], confidence: 0, message: 'Invalid input: records must be an array' };

  const energyValues = records
    .map((r) => r && r.energy)
    .filter((v) => typeof v === 'number' && isFinite(v) && v >= 0);

  if (energyValues.length < 3)
    return { predictions: [], confidence: 0, message: 'Insufficient data for prediction' };

  const window = Math.min(10, energyValues.length);
  const recent = energyValues.slice(-window);
  const avg    = recent.reduce((a, b) => a + b, 0) / recent.length;

  // Linear trend: slope from first to last in window
  const slope = (recent[recent.length - 1] - recent[0]) / (recent.length - 1 || 1);

  const now        = Date.now();
  const intervalMs = 5000;

  const predictions = Array.from({ length: 10 }, (_, i) => ({
    step:      i + 1,
    value:     parseFloat(Math.max(0, avg + slope * (i + 1)).toFixed(3)),
    timestamp: new Date(now + intervalMs * (i + 1)).toISOString(),
  }));

  const variance   = recent.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / recent.length;
  const stdDev     = Math.sqrt(variance);
  const confidence = parseFloat(Math.max(0, Math.min(100, 100 - (stdDev / (avg || 1)) * 100)).toFixed(1));

  return { predictions, confidence };
}

module.exports = { predict };
