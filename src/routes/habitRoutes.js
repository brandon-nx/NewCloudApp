const express = require("express");
const router = express.Router();
const habitController = require("../controllers/habitController");
const { protect } = require("../middleware/authMiddleware");

// Get all habits for the logged-in user
router.get("/", protect, habitController.getHabits);
router.get("/my-habits", protect, habitController.getHabits);

// Generic habit logging
router.post("/log", protect, habitController.logHabit);

// Habit-specific logging
router.post("/sleep", protect, habitController.logSleep);
router.post("/exercise", protect, habitController.logExercise);
router.post("/study", protect, habitController.logStudy);
router.post("/water", protect, habitController.logWater);

module.exports = router;