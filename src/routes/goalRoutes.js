const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware'); // Import your protector

// Changed the paths to use the 'protect' middleware
router.get('/my-targets', protect, goalController.getGoals);
router.post('/update-goals', protect, goalController.updateGoals);

module.exports = router;