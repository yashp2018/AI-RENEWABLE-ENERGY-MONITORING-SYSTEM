const router = require('express').Router();
const { receiveData, getData } = require('../controllers/dataController');

router.post('/', receiveData);
router.get('/', getData);

module.exports = router;
