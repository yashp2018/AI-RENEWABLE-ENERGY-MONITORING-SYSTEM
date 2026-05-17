const MAX_ALERTS = 200;
const alerts = [];
let alertIdCounter = 0;

function addAlert(panelId, type, message, severity = 'warning') {
  alertIdCounter++;
  alerts.push({ id: alertIdCounter, panelId, type, message, severity, timestamp: new Date().toISOString() });
  if (alerts.length > MAX_ALERTS) alerts.shift();
}

function getAlerts() {
  return [...alerts].reverse();
}

function resetAlerts() {
  alerts.length = 0;
  alertIdCounter = 0;
}

module.exports = { addAlert, getAlerts, resetAlerts };
