const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// router.post("/register", authController.register);
// router.post("/login", authController.login);
router.post("/register", authController.registerOrLogin);
router.post("/login", authController.registerOrLogin);

module.exports = router;