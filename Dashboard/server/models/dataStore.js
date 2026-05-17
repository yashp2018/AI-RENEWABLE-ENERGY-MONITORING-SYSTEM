// In-memory data store — holds last 100 records and per-panel state
const MAX_RECORDS = 100;

const store = {
  records: [],       // circular buffer of raw readings
  panels: {},        // { panelId: { latestReading, status, insight } }
};

function addRecord(data) {
  store.records.push(data);
  if (store.records.length > MAX_RECORDS) store.records.shift();
}

function getLastN(n = 50) {
  return store.records.slice(-n);
}

function updatePanel(panelId, reading, status, insight) {
  store.panels[panelId] = { ...reading, status, insight, updatedAt: new Date().toISOString() };
}

function getPanels() {
  return store.panels;
}

module.exports = { addRecord, getLastN, updatePanel, getPanels };
