const MAX_ALERTS = 200;
const alerts = [];

function addAlert(panelId, type, message, severity = 'warning') {
  alerts.push({ panelId, type, message, severity, timestamp: new Date().toISOString() });
  if (alerts.length > MAX_ALERTS) alerts.shift();
}

function getAlerts() {
  return [...alerts].reverse(); // newest first
}

module.exports = { addAlert, getAlerts };
