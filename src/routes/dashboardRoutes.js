// const express = require("express");
// const router = express.Router();
// const dashboardController = require("../controllers/dashboardController");
// const { protect } = require('../middleware/authMiddleware');
// // 2. Add 'protect' to every route you want to track
// router.get('/my-habits', protect, habitController.getHabits);
// router.post('/log', protect, habitController.logHabit);

// router.get("/", dashboardController.getDashboard);

// module.exports = router;

const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const habitController = require("../controllers/habitController"); 
const { protect } = require('../middleware/authMiddleware');

// 1. Correct the name to 'getDashboard' to match your controller
router.get("/", protect, dashboardController.getDashboard);

// 2. This calls the habits list for the dashboard
router.get('/my-habits', protect, habitController.getHabits);

module.exports = router;