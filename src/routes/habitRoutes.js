const express = require("express");
const router = express.Router();
const habitController = require("../controllers/habitController");

router.get("/", habitController.getHabits);
router.post("/log", habitController.logHabit);

module.exports = router;