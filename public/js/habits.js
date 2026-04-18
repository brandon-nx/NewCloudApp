import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let currentUser = null;

const ROUTES = {
  login: "/login",
  dashboard: "/dashboard",
  habits: "/habits",
  sleep: "/sleep-log",
  exercise: "/exercise-log",
  study: "/study-log",
  water: "/water-log",
  history: "/history",
  profile: "/profile",
};

function formatDisplayDate(date = new Date()) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMinutesToHoursMinutes(totalMinutes) {
  const minutes = Number(totalMinutes || 0);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${String(mins).padStart(2, "0")}m`;
  }

  return `${mins} min`;
}

function formatTime12Hour(time24) {
  if (!time24 || typeof time24 !== "string" || !time24.includes(":")) {
    return "--:--";
  }

  const [hourStr, minuteStr] = time24.split(":");
  let hour = Number(hourStr);
  const minute = minuteStr;
  const suffix = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${hour}:${minute} ${suffix}`;
}

function setupNavigation() {
  const navMap = {
    "tab-habits": ROUTES.habits,
    "tab-sleep": ROUTES.sleep,
    "tab-exercise": ROUTES.exercise,
    "tab-study": ROUTES.study,
    "tab-water": ROUTES.water,
    "menu-dashboard": ROUTES.dashboard,
    "menu-habits": ROUTES.habits,
    "menu-history": ROUTES.history,
    "menu-settings": ROUTES.profile,
    "profile-btn": ROUTES.profile,
    "log-sleep-btn": ROUTES.sleep,
    "log-exercise-btn": ROUTES.exercise,
    "open-study-btn": ROUTES.study,
    "log-water-btn": ROUTES.water,
  };

  Object.entries(navMap).forEach(([id, url]) => {
    const element = document.getElementById(id);
    if (!element) return;

    element.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = url;
    });
  });
}

function setTodayDate() {
  const todayDate = document.getElementById("today-date");
  if (todayDate) {
    todayDate.textContent = formatDisplayDate();
  }
}

async function fetchHabits() {
  if (!currentUser) return [];

  const token = await currentUser.getIdToken(true);

  const response = await fetch("/api/habits", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch habits.");
  }

  return data;
}

function getHabitByName(habits, name) {
  return habits.find((habit) => String(habit.name || "").toLowerCase() === name.toLowerCase()) || null;
}

function fillSleepCard(habits) {
  const sleepHabit = getHabitByName(habits, "Sleep");
  const targetDisplay = document.getElementById("sleep-target-display");
  const bedtimeDisplay = document.getElementById("sleep-bedtime-display");
  const wakeDisplay = document.getElementById("sleep-waketime-display");
  const durationDisplay = document.getElementById("sleep-duration-display");

  const goalMinutes = Number(sleepHabit?.goal_value || 480);
  const currentMinutes = Number(sleepHabit?.current_value || 0);

  if (targetDisplay) {
    targetDisplay.textContent = `Target: ${formatMinutesToHoursMinutes(goalMinutes)}`;
  }

  const savedBedtime = localStorage.getItem("sleep_bedtime");
  const savedWakeTime = localStorage.getItem("sleep_waketime");

  if (bedtimeDisplay) {
    bedtimeDisplay.textContent = savedBedtime ? formatTime12Hour(savedBedtime) : "--:--";
  }

  if (wakeDisplay) {
    wakeDisplay.textContent = savedWakeTime ? formatTime12Hour(savedWakeTime) : "--:--";
  }

  if (durationDisplay) {
    durationDisplay.textContent = currentMinutes > 0
      ? `Duration: ${formatMinutesToHoursMinutes(currentMinutes)}`
      : "Duration: --";
  }
}

function fillExerciseCard(habits) {
  const exerciseHabit = getHabitByName(habits, "Exercise");
  const typeDisplay = document.getElementById("exercise-type-display");
  const startDisplay = document.getElementById("exercise-start-display");
  const endDisplay = document.getElementById("exercise-end-display");
  const durationDisplay = document.getElementById("exercise-duration-display");

  const currentMinutes = Number(exerciseHabit?.current_value || 0);
  const savedType = localStorage.getItem("exercise_activity_type");
  const savedStart = localStorage.getItem("exercise_start_time");
  const savedEnd = localStorage.getItem("exercise_end_time");

  if (typeDisplay) {
    typeDisplay.textContent = savedType || "No activity yet";
  }

  if (startDisplay) {
    startDisplay.textContent = savedStart ? formatTime12Hour(savedStart) : "--:--";
  }

  if (endDisplay) {
    endDisplay.textContent = savedEnd ? formatTime12Hour(savedEnd) : "--:--";
  }

  if (durationDisplay) {
    durationDisplay.textContent = currentMinutes > 0
      ? `Duration: ${formatMinutesToHoursMinutes(currentMinutes)}`
      : "Duration: --";
  }
}

function fillStudyCard(habits) {
  const studyHabit = getHabitByName(habits, "Study");
  const subjectDisplay = document.getElementById("study-subject-display");
  const durationDisplay = document.getElementById("study-duration-display");
  const targetDisplay = document.getElementById("study-target-display");

  const currentMinutes = Number(studyHabit?.current_value || 0);
  const savedSubject = localStorage.getItem("study_subject");

  if (subjectDisplay) {
    subjectDisplay.textContent = savedSubject || "Pomodoro Timer";
  }

  if (durationDisplay) {
    durationDisplay.textContent = currentMinutes > 0
      ? formatMinutesToHoursMinutes(currentMinutes)
      : "0 min";
  }

  if (targetDisplay) {
    targetDisplay.textContent = "25:00";
  }
}

function fillWaterCard(habits) {
  const waterHabit = getHabitByName(habits, "Water Intake");
  const currentDisplay = document.getElementById("water-current-display");
  const goalDisplay = document.getElementById("water-goal-display");
  const progressBar = document.getElementById("water-progress-bar");
  const progressText = document.getElementById("water-progress-text");

  const currentMl = Number(waterHabit?.current_value || 0);
  const goalMl = Number(waterHabit?.goal_value || 2500);
  const percent = goalMl > 0 ? Math.min(100, Math.round((currentMl / goalMl) * 100)) : 0;

  if (currentDisplay) {
    currentDisplay.textContent = currentMl.toLocaleString();
  }

  if (goalDisplay) {
    goalDisplay.textContent = goalMl.toLocaleString();
  }

  if (progressBar) {
    progressBar.style.width = `${percent}%`;
  }

  if (progressText) {
    progressText.textContent = `${percent}% hydrated`;
  }
}

async function loadHabitsData() {
  try {
    const habits = await fetchHabits();
    fillSleepCard(habits);
    fillExerciseCard(habits);
    fillStudyCard(habits);
    fillWaterCard(habits);
  } catch (error) {
    console.error("Failed to load habits:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setTodayDate();
  setupNavigation();
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    console.log(`✅ ${user.email} verified by frontend.`);
    await loadHabitsData();
  } else {
    currentUser = null;
    window.location.href = ROUTES.login;
  }
});