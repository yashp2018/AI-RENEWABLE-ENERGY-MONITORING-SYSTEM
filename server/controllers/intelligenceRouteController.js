const {
  getMaintenanceRecords,
  getRecommendations,
  getFaultHistory,
  suspendPanel,
  resumePanel,
  getSuspendedPanels,
  isPanelSuspended,
} = require('../models/intelligenceStore');
const { addAlert } = require('../models/alertStore');
const { addFaultRecord } = require('../models/intelligenceStore');

// GET /api/maintenance?panelId=&limit=
function getMaintenance(req, res) {
  const { panelId } = req.query;
  let limit = 100;
  if (req.query.limit !== undefined) {
    limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < 1 || limit > 500)
      return res.status(400).json({ error: 'limit must be an integer between 1 and 500' });
  }
  const records = getMaintenanceRecords(panelId || null);
  res.json(records.slice(0, limit));
}

// GET /api/recommendations?panelId=&limit=
function getRecommendationsHandler(req, res) {
  const { panelId } = req.query;
  let limit = 50;
  if (req.query.limit !== undefined) {
    limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < 1 || limit > 500)
      return res.status(400).json({ error: 'limit must be an integer between 1 and 500' });
  }
  const recs = getRecommendations(panelId || null);
  res.json(recs.slice(0, limit));
}

// GET /api/faults?panelId=&limit=
function getFaultsHandler(req, res) {
  const { panelId } = req.query;
  let limit = 100;
  if (req.query.limit !== undefined) {
    limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < 1 || limit > 500)
      return res.status(400).json({ error: 'limit must be an integer between 1 and 500' });
  }
  const faults = getFaultHistory(panelId || null);
  res.json({
    faults: faults.slice(0, limit),
    suspended: getSuspendedPanels(),
    totalFaults: faults.length,
    criticalFaults: faults.filter((f) => f.severity === 'critical').length,
  });
}

// POST /api/suspend  { panelId, reason }
function suspendPanelHandler(req, res) {
  const { panelId, reason } = req.body;
  if (!panelId || typeof panelId !== 'string')
    return res.status(400).json({ error: 'panelId is required' });

  if (isPanelSuspended(panelId))
    return res.status(409).json({ error: `Panel ${panelId} is already suspended` });

  const suspendReason = reason || 'Manual suspension via API';
  suspendPanel(panelId, suspendReason, 'Manual Suspension');
  addFaultRecord(panelId, 'Manual Suspension', 'critical', suspendReason, true);
  addAlert(panelId, 'Manual Suspension', `Panel ${panelId} manually suspended: ${suspendReason}`, 'critical');

  console.log(`[SUSPEND] Panel ${panelId} manually suspended`);
  res.json({ success: true, message: `Panel ${panelId} suspended`, panelId, reason: suspendReason });
}

// POST /api/resume  { panelId }
function resumePanelHandler(req, res) {
  const { panelId } = req.body;
  if (!panelId || typeof panelId !== 'string')
    return res.status(400).json({ error: 'panelId is required' });

  if (!isPanelSuspended(panelId))
    return res.status(409).json({ error: `Panel ${panelId} is not suspended` });

  resumePanel(panelId);
  addAlert(panelId, 'Panel Resumed', `Panel ${panelId} resumed from suspension`, 'info');

  console.log(`[RESUME] Panel ${panelId} resumed`);
  res.json({ success: true, message: `Panel ${panelId} resumed`, panelId });
}

// GET /api/suspended
function getSuspendedHandler(req, res) {
  res.json(getSuspendedPanels());
}

module.exports = {
  getMaintenance,
  getRecommendationsHandler,
  getFaultsHandler,
  suspendPanelHandler,
  resumePanelHandler,
  getSuspendedHandler,
};
