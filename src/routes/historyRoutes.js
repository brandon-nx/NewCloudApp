const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:date', protect, historyController.getDayLogs);

module.exports = router;