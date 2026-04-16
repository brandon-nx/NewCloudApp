const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

dotenv.config();

// Add API route imports back
const db = require('./config/db'); 
const authRoutes = require("./routes/authRoutes");
const habitRoutes = require("./routes/habitRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const admin = require('./config/firebase');
const goalRoutes = require("./routes/goalRoutes"); // Add this

const app = express();
const PORT = process.env.PORT || 8080;

// 2. Security Middleware (Fixed CSP for Firebase, Tailwind, and Source Maps)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://cdn.tailwindcss.com"],
        connectSrc: ["'self'", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com", "https://www.googleapis.com", "https://www.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 3. General Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "..", "public")));

// 4. Static Files (Serves CSS/JS from public folder)
app.use(express.static(path.join(__dirname, '..', 'public')));

// 5. HTML Page Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "pages", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "pages", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "pages", "register.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "pages", "dashboard.html"));
});

app.get("/habits", (req, res) => {
  res.sendFile(path.join(__dirname, '..', "public", "pages", "habits.html"));
});

app.get("/history", (req, res) => {
  res.sendFile(path.join(__dirname, '..', "public", "pages", "historyCalendar.html"));
});

app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, '..', "public", "pages", "profile.html"));
});

// --- NEWLY ADDED TRACKING & EDITING ROUTES ---

app.get("/edit-goals", (req, res) => {
    res.sendFile(path.join(__dirname, '..', "public", "pages", "editGoal.html"));
});

app.get("/water-log", (req, res) => {
    res.sendFile(path.join(__dirname, '..', "public", "pages", "waterLog.html"));
});

app.get("/sleep-log", (req, res) => {
    res.sendFile(path.join(__dirname, '..', "public", "pages", "sleepLog.html"));
});

app.get("/study-log", (req, res) => {
    res.sendFile(path.join(__dirname, '..', "public", "pages", "studyLog.html"));
});

app.get("/exercise-log", (req, res) => {
    res.sendFile(path.join(__dirname, '..', "public", "pages", "exerciseLog.html"));
});

app.get("/history-list", (req, res) => {
    res.sendFile(path.join(__dirname, '..', "public", "pages", "historyList.html"));
});

// 6. API Routes
app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/goals", goalRoutes);

// 7. Health Check
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    require("./config/firebase");
    console.log("Firebase initialized");
  } catch (err) {
    console.error("Firebase init failed:", err);
  }

  try {
    const db = require("./config/db");
    await db.authenticate();
    console.log("Database connected");
  } catch (err) {
    console.error("Database connection failed:", err);
  }
});