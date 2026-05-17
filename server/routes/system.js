const router = require('express').Router();
const { getPanelsData, getAlertsData, getHealth, getPrediction } = require('../controllers/systemController');

router.get('/panels', getPanelsData);
router.get('/alerts', getAlertsData);
router.get('/health', getHealth);
router.get('/prediction', getPrediction);

module.exports = router;
