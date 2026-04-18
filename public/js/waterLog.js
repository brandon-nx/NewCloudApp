import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let currentUser = null;
const DAILY_GOAL_ML = 2500;
const STEP_ML = 50;

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

function showMessage(message, type = "error") {
  const messageBox = document.getElementById("water-log-message");
  if (!messageBox) return;

  messageBox.textContent = message;
  messageBox.classList.remove(
    "hidden",
    "bg-red-100",
    "text-red-700",
    "bg-green-100",
    "text-green-700"
  );

  if (type === "success") {
    messageBox.classList.add("bg-green-100", "text-green-700");
  } else {
    messageBox.classList.add("bg-red-100", "text-red-700");
  }
}

function clearMessage() {
  const messageBox = document.getElementById("water-log-message");
  if (!messageBox) return;
  messageBox.textContent = "";
  messageBox.classList.add("hidden");
}

function setLoading(isLoading) {
  const saveBtn = document.getElementById("save-water-btn");
  const saveBtnText = document.getElementById("save-water-btn-text");

  if (!saveBtn || !saveBtnText) return;

  saveBtn.disabled = isLoading;

  if (isLoading) {
    saveBtn.classList.add("opacity-70", "cursor-not-allowed");
    saveBtnText.textContent = "Saving...";
  } else {
    saveBtn.classList.remove("opacity-70", "cursor-not-allowed");
    saveBtnText.textContent = `Log ${getSelectedAmount()}ml`;
  }
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getCurrentWater() {
  const saved = Number(localStorage.getItem("water_current_ml") || "0");
  return Number.isFinite(saved) ? saved : 0;
}

function getSelectedAmount() {
  const intakeInput = document.getElementById("water-intake-input");
  const parsed = Number(intakeInput?.value || "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

function updateWaterUI(currentMl) {
  const current = Math.max(0, Number(currentMl || 0));
  const percent = clamp(Math.round((current / DAILY_GOAL_ML) * 100), 0, 100);
  const remaining = Math.max(0, DAILY_GOAL_ML - current);

  const currentDisplay = document.getElementById("water-current-display");
  const goalDisplay = document.getElementById("water-goal-display");
  const percentDisplay = document.getElementById("water-percent-display");
  const remainingDisplay = document.getElementById("water-remaining-display");
  const progressBar = document.getElementById("water-progress-bar");
  const progressRing = document.getElementById("water-progress-ring");

  if (currentDisplay) currentDisplay.textContent = current.toLocaleString();
  if (goalDisplay) goalDisplay.textContent = DAILY_GOAL_ML.toLocaleString();
  if (percentDisplay) percentDisplay.textContent = `${percent}%`;
  if (remainingDisplay) remainingDisplay.textContent = `${remaining.toLocaleString()}ml to go`;
  if (progressBar) progressBar.style.width = `${percent}%`;

  if (progressRing) {
    const circumference = 276.46;
    const dashOffset = circumference - (percent / 100) * circumference;
    progressRing.style.strokeDashoffset = String(dashOffset);
  }
}

function updatePreviewUI() {
  const current = getCurrentWater();
  const selected = getSelectedAmount();
  updateWaterUI(current + selected);

  const selectedDisplay = document.getElementById("selected-water-display");
  const saveBtnText = document.getElementById("save-water-btn-text");

  if (selectedDisplay) {
    selectedDisplay.textContent = `${selected}ml`;
  }

  if (saveBtnText) {
    saveBtnText.textContent = `Log ${selected}ml`;
  }
}

function setSelectedAmount(amount) {
  const parsed = Math.max(0, Number(amount || 0));
  const intakeInput = document.getElementById("water-intake-input");
  const presetButtons = document.querySelectorAll(".preset-chip");

  if (intakeInput) intakeInput.value = String(parsed);

  // Update visual state of preset chips
  presetButtons.forEach((btn) => {
    const preset = Number(btn.dataset.preset || "0");
    btn.classList.toggle("active", preset === parsed);
  });

  updatePreviewUI();
}

function toggleCustomPanel(forceShow = null) {
  const panel = document.getElementById("custom-water-panel");
  if (!panel) return;

  const show = forceShow === null ? panel.classList.contains("hidden") : forceShow;
  panel.classList.toggle("hidden", !show);
}

function setupPresetButtons() {
  document.querySelectorAll(".preset-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      clearMessage();
      setSelectedAmount(Number(btn.dataset.preset || "0"));
    });
  });
}

function setupAdjustButtons() {
  document.getElementById("increase-water-btn")?.addEventListener("click", () => {
    clearMessage();
    setSelectedAmount(getSelectedAmount() + STEP_ML);
  });

  document.getElementById("decrease-water-btn")?.addEventListener("click", () => {
    clearMessage();
    setSelectedAmount(Math.max(0, getSelectedAmount() - STEP_ML));
  });
}

function setupCustomAmount() {
  const toggleBtn = document.getElementById("toggle-custom-water");
  const applyBtn = document.getElementById("apply-custom-water");
  const customInput = document.getElementById("water-custom-amount");

  toggleBtn?.addEventListener("click", () => {
    toggleCustomPanel();
  });

  applyBtn?.addEventListener("click", () => {
    const amount = Number(customInput?.value || "0");

    if (!Number.isFinite(amount) || amount <= 0) {
      showMessage("Please enter a valid custom amount.");
      return;
    }

    clearMessage();
    setSelectedAmount(amount);
    toggleCustomPanel(false);
  });
}

async function loadWaterFromBackend() {
  if (!currentUser) return;

  try {
    const token = await currentUser.getIdToken(true);

    const response = await fetch("/api/habits", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => []);

    if (!response.ok || !Array.isArray(data)) {
      throw new Error("Failed to fetch water data.");
    }

    const waterHabit = data.find((habit) => 
        habit.habit_type_id === 4 || 
        String(habit.name || "").toLowerCase() === "water intake"
    ) || null;

    const currentMl = Number(waterHabit?.current_value || 0);
    localStorage.setItem("water_current_ml", String(currentMl));
    updatePreviewUI();
  } catch (error) {
    console.error("Failed to load water from backend:", error);
    updatePreviewUI();
  }
}

function setupFormSubmission() {
  const form = document.getElementById("water-log-form");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    if (!currentUser) {
      showMessage("You must be logged in to save water intake.");
      return;
    }

    const intakeMl = getSelectedAmount();

    if (!Number.isFinite(intakeMl) || intakeMl <= 0) {
      showMessage("Please choose or enter a valid amount.");
      return;
    }

    try {
      setLoading(true);

      const token = await currentUser.getIdToken(true);

      const response = await fetch("/api/habits/water", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          intakeMl,
          logDate: new Date().toISOString().slice(0, 10),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to save water log.");
      }

      const updatedCurrent = Number(data?.habit?.current_value ?? getCurrentWater() + intakeMl);
      localStorage.setItem("water_current_ml", String(updatedCurrent));

      setSelectedAmount(250);
      updateWaterUI(updatedCurrent);
      showMessage("Water logged successfully!", "success");
    } catch (error) {
      console.error("Water log error:", error);
      showMessage(error.message || "Failed to save water log.");
      updatePreviewUI();
    } finally {
      setLoading(false);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupPresetButtons();
  setupAdjustButtons();
  setupFormSubmission();
  setSelectedAmount(0);
  updatePreviewUI();
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    console.log(`✅ Logged in as ${user.email}`);
    await loadWaterFromBackend();
  } else {
    currentUser = null;
    window.location.href = ROUTES.login;
  }
});