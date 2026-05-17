const express = require('express');
const cors = require('cors');

const dataRoutes = require('./routes/data');
const systemRoutes = require('./routes/system');
const intelligenceRoutes = require('./routes/intelligence');
const { resetStore } = require('./models/dataStore');
const { resetAlerts } = require('./models/alertStore');
const { resetIntelligenceStore } = require('./models/intelligenceStore');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Reject requests with malformed JSON body
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed')
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  next(err);
});

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api/data', dataRoutes);
app.use('/api', systemRoutes);
app.use('/api', intelligenceRoutes);

// Demo reset — clears all in-memory data for a clean presentation
app.post('/api/reset', (_req, res) => {
  resetStore();
  resetAlerts();
  resetIntelligenceStore();
  console.log('[RESET] All data cleared for demo presentation');
  res.json({ success: true, message: 'System reset. All data cleared.' });
});

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message || err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[SERVER] AI Renewable Energy Backend running on http://localhost:${PORT}`);
  console.log(`[SERVER] Using in-memory data store`);
});

module.exports = app;
