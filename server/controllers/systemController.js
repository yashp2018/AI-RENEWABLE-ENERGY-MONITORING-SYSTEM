const { getPanels, getLastN } = require('../models/dataStore');
const { getAlerts } = require('../models/alertStore');
const { predict } = require('./predictionEngine');

function getPanelsData(req, res) {
  res.json(getPanels());
}

function getAlertsData(req, res) {
  let limit = 50;
  if (req.query.limit !== undefined) {
    limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < 1 || limit > 500)
      return res.status(400).json({ error: 'Query param limit must be an integer between 1 and 500' });
  }
  const all = getAlerts();
  res.json(all.slice(0, limit));
}

function getHealth(req, res) {
  const panels        = Object.values(getPanels());
  const totalPanels   = panels.length;
  const activePanels  = panels.filter((p) => p.status === 'active').length;
  const faultyPanels  = panels.filter((p) => p.status === 'fault').length;
  const warningPanels = panels.filter((p) => p.status === 'warning').length;
  const healthPercentage = totalPanels > 0
    ? parseFloat(((activePanels / totalPanels) * 100).toFixed(1))
    : 0;

  res.json({ totalPanels, activePanels, faultyPanels, warningPanels, healthPercentage, timestamp: new Date().toISOString() });
}

function getPrediction(req, res) {
  let n = 50;
  if (req.query.n !== undefined) {
    n = parseInt(req.query.n, 10);
    if (isNaN(n) || n < 3 || n > 500)
      return res.status(400).json({ error: 'Query param n must be an integer between 3 and 500' });
  }
  const records = getLastN(n);
  const result  = predict(records);
  res.json(result);
}

module.exports = { getPanelsData, getAlertsData, getHealth, getPrediction };
