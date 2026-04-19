const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:date', protect, historyController.getDayLogs);
router.get('/log/:id', protect, historyController.getSingleLog);
router.put('/:id', protect, historyController.updateLog);
router.delete('/:id', protect, historyController.deleteLog);

module.exports = router;