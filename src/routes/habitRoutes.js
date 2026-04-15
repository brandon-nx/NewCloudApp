// const express = require("express");
// const router = express.Router();
// const habitController = require("../controllers/habitController");
// const { protect } = require('../middleware/authMiddleware');
// const { protect } = require('../middleware/authMiddleware');

// // 2. Add 'protect' to every route you want to track
// router.get('/my-habits', protect, habitController.getHabits);
// router.post('/log', protect, habitController.logHabit);

// // All habit routes now require the 'protect' lock
// router.get("/my-habits", protect, habitController.getHabits);
// router.post("/log", protect, habitController.logHabit);

// // Optional: Keep the base route if you prefer it
// router.get("/", protect, habitController.getHabits);

// module.exports = router;
const express = require("express");
const router = express.Router();
const habitController = require("../controllers/habitController");
const { protect } = require('../middleware/authMiddleware');

// --- HABIT MANAGEMENT ROUTES ---

// Get all habits for the currently logged-in user
// This will trigger the: 👤 [User Activity]: user@email.com log in your terminal
router.get("/", protect, habitController.getHabits);

// Log a specific habit completion or update progress
router.post("/log", protect, habitController.logHabit);

// If you want a specific "my-habits" endpoint here too:
router.get('/my-habits', protect, habitController.getHabits);

module.exports = router;