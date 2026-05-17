const router = require('express').Router();
const {
  getMaintenance,
  getRecommendationsHandler,
  getFaultsHandler,
  suspendPanelHandler,
  resumePanelHandler,
  getSuspendedHandler,
} = require('../controllers/intelligenceRouteController');

router.get('/maintenance',      getMaintenance);
router.get('/recommendations',  getRecommendationsHandler);
router.get('/faults',           getFaultsHandler);
router.get('/suspended',        getSuspendedHandler);
router.post('/suspend',         suspendPanelHandler);
router.post('/resume',          resumePanelHandler);

module.exports = router;
