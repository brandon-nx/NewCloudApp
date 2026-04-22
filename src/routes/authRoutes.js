// const express = require("express");
// const router = express.Router();
// const authController = require("../controllers/authController");
// const { protect } = require('../middleware/authMiddleware');
// // router.post("/register", authController.register);
// // router.post("/login", authController.login);
// router.post("/register", authController.registerOrLogin);
// router.post("/login", authController.registerOrLogin);

// const habitController = require('../controllers/habitController'); 

// // 2. Add 'protect' to every route you want to track
// router.get('/my-habits', protect, habitController.getHabits);
// router.post('/log', protect, habitController.logHabit);

// module.exports = router;


const express = require("express");
const router = express.Router();

// Import Controllers
const authController = require("../controllers/authController");
const habitController = require('../controllers/habitController'); 

// Import Middleware (ONLY ONCE)
const { protect } = require('../middleware/authMiddleware');

// Auth Routes
router.post("/register", authController.registerOrLogin);
router.post("/login", authController.registerOrLogin);

// Habit Routes (Protected)
// These will trigger the "User Activity" log in your terminal
router.get('/my-habits', protect, habitController.getHabits);
router.post('/log', protect, habitController.logHabit);

router.get('/profile-stats', protect, habitController.getProfileStats);

module.exports = router;