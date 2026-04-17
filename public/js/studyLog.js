import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let currentUser = null;
let timerInterval = null;

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

const STORAGE_KEY = "study_timer_state_v1";
const RING_CIRCUMFERENCE = 930;

const state = {
  focusMinutes: 25,
  breakMinutes: 5,
  currentPhase: "focus", // focus | break
  remainingSeconds: 25 * 60,
  isRunning: false,
  completedFocusMinutes: 0,
  sessionStartedAt: null, // ISO string for first started focus session in this batch
  lastTickAt: null, // ISO string
};

function showMessage(message, type = "error") {
  const messageBox = document.getElementById("study-log-message");
  if (!messageBox) return;

  messageBox.textContent = message;
  messageBox.classList.remove(
    "hidden",
    "bg-red-100",
    "text-red-700",
    "bg-green-100",
    "text-green-700",
    "bg-orange-100",
    "text-orange-700"
  );

  if (type === "success") {
    messageBox.classList.add("bg-green-100", "text-green-700");
  } else if (type === "info") {
    messageBox.classList.add("bg-orange-100", "text-orange-700");
  } else {
    messageBox.classList.add("bg-red-100", "text-red-700");
  }
}

function clearMessage() {
  const messageBox = document.getElementById("study-log-message");
  if (!messageBox) return;
  messageBox.textContent = "";
  messageBox.classList.add("hidden");
}

function setSaveLoading(isLoading) {
  const saveBtn = document.getElementById("save-study-btn");
  const saveBtnText = document.getElementById("save-study-btn-text");

  if (!saveBtn || !saveBtnText) return;

  saveBtn.disabled = isLoading;

  if (isLoading) {
    saveBtn.classList.add("opacity-70", "cursor-not-allowed");
    saveBtnText.textContent = "Saving...";
  } else {
    saveBtn.classList.remove("opacity-70", "cursor-not-allowed");
    saveBtnText.textContent = "Save Study";
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const saved = JSON.parse(raw);

    state.focusMinutes = Number(saved.focusMinutes || 25);
    state.breakMinutes = Number(saved.breakMinutes || 5);
    state.currentPhase = saved.currentPhase === "break" ? "break" : "focus";
    state.remainingSeconds = Number(saved.remainingSeconds || state.focusMinutes * 60);
    state.isRunning = Boolean(saved.isRunning);
    state.completedFocusMinutes = Number(saved.completedFocusMinutes || 0);
    state.sessionStartedAt = saved.sessionStartedAt || null;
    state.lastTickAt = saved.lastTickAt || null;

    if (!Number.isFinite(state.focusMinutes) || state.focusMinutes < 1) state.focusMinutes = 25;
    if (!Number.isFinite(state.breakMinutes) || state.breakMinutes < 1) state.breakMinutes = 5;
    if (!Number.isFinite(state.remainingSeconds) || state.remainingSeconds < 0) {
      state.remainingSeconds =
        state.currentPhase === "focus" ? state.focusMinutes * 60 : state.breakMinutes * 60;
    }
    if (!Number.isFinite(state.completedFocusMinutes) || state.completedFocusMinutes < 0) {
      state.completedFocusMinutes = 0;
    }
  } catch (error) {
    console.error("Failed to load study timer state:", error);
  }
}

function clearSavedState() {
  localStorage.removeItem(STORAGE_KEY);
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

function formatClock(seconds) {
  const safe = Math.max(0, Number(seconds || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatCompletedMinutes(minutes) {
  const total = Number(minutes || 0);
  if (total < 60) return `${total} min`;

  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatTime24(date) {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function updateTimerUI() {
  const timerDisplay = document.getElementById("study-timer-display");
  const phaseLabel = document.getElementById("study-phase-label");
  const focusValue = document.getElementById("focus-minutes-value");
  const breakValue = document.getElementById("break-minutes-value");
  const completedDisplay = document.getElementById("completed-study-display");
  const progressRing = document.getElementById("study-progress-ring");

  if (timerDisplay) {
    timerDisplay.textContent = formatClock(state.remainingSeconds);
  }

  if (phaseLabel) {
    phaseLabel.textContent = state.currentPhase === "focus" ? "Focus Session" : "Break Time";
  }

  if (focusValue) {
    focusValue.textContent = String(state.focusMinutes);
  }

  if (breakValue) {
    breakValue.textContent = String(state.breakMinutes);
  }

  if (completedDisplay) {
    completedDisplay.textContent = formatCompletedMinutes(state.completedFocusMinutes);
  }

  if (progressRing) {
    const totalSeconds =
      state.currentPhase === "focus" ? state.focusMinutes * 60 : state.breakMinutes * 60;
    const progress = totalSeconds > 0 ? state.remainingSeconds / totalSeconds : 0;
    const dashOffset = RING_CIRCUMFERENCE * (1 - progress);
    progressRing.style.strokeDashoffset = String(dashOffset);
  }

  saveState();
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  state.isRunning = false;
  state.lastTickAt = null;
  updateTimerUI();
}

function transitionPhase(silent = false) {
  if (state.currentPhase === "focus") {
    state.completedFocusMinutes += state.focusMinutes;
    state.currentPhase = "break";
    state.remainingSeconds = state.breakMinutes * 60;
    if (!silent) {
      showMessage("Focus session completed. Break started.", "info");
    }
  } else {
    state.currentPhase = "focus";
    state.remainingSeconds = state.focusMinutes * 60;
    if (!silent) {
      showMessage("Break finished. Focus session started.", "info");
    }
  }
}

function tick() {
  if (!state.isRunning) return;

  if (state.remainingSeconds > 0) {
    state.remainingSeconds -= 1;
  }

  if (state.remainingSeconds <= 0) {
    transitionPhase(false);
  }

  state.lastTickAt = new Date().toISOString();
  updateTimerUI();
}

function startTimer() {
  if (state.isRunning) return;

  clearMessage();

  if (!state.sessionStartedAt && state.currentPhase === "focus") {
    state.sessionStartedAt = new Date().toISOString();
  }

  state.isRunning = true;
  state.lastTickAt = new Date().toISOString();
  updateTimerUI();

  timerInterval = setInterval(tick, 1000);
}

function reconcileRunningState() {
  if (!state.isRunning || !state.lastTickAt) return;

  const elapsedSeconds = Math.floor((Date.now() - new Date(state.lastTickAt).getTime()) / 1000);

  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) {
    return;
  }

  let remainingElapsed = elapsedSeconds;

  while (remainingElapsed > 0) {
    if (remainingElapsed >= state.remainingSeconds) {
      remainingElapsed -= state.remainingSeconds;
      transitionPhase(true);
    } else {
      state.remainingSeconds -= remainingElapsed;
      remainingElapsed = 0;
    }
  }

  state.lastTickAt = new Date().toISOString();
}

function changeFocusMinutes(delta) {
  if (state.isRunning) {
    showMessage("Pause the timer before changing focus minutes.", "info");
    return;
  }

  state.focusMinutes = Math.min(120, Math.max(1, state.focusMinutes + delta));

  if (state.currentPhase === "focus") {
    state.remainingSeconds = state.focusMinutes * 60;
  }

  clearMessage();
  updateTimerUI();
}

function changeBreakMinutes(delta) {
  if (state.isRunning) {
    showMessage("Pause the timer before changing break minutes.", "info");
    return;
  }

  state.breakMinutes = Math.min(60, Math.max(1, state.breakMinutes + delta));

  if (state.currentPhase === "break") {
    state.remainingSeconds = state.breakMinutes * 60;
  }

  clearMessage();
  updateTimerUI();
}

function resetCurrentTimer() {
  stopTimer();
  state.currentPhase = "focus";
  state.remainingSeconds = state.focusMinutes * 60;

  if (state.completedFocusMinutes === 0) {
    state.sessionStartedAt = null;
  }

  clearMessage();
  updateTimerUI();
}

function setupControls() {
  document.getElementById("start-study-btn")?.addEventListener("click", () => {
    startTimer();
  });

  document.getElementById("pause-study-btn")?.addEventListener("click", () => {
    stopTimer();
  });

  document.getElementById("reset-study-btn")?.addEventListener("click", () => {
    resetCurrentTimer();
  });

  document.getElementById("focus-minus-btn")?.addEventListener("click", () => {
    changeFocusMinutes(-1);
  });

  document.getElementById("focus-plus-btn")?.addEventListener("click", () => {
    changeFocusMinutes(1);
  });

  document.getElementById("break-minus-btn")?.addEventListener("click", () => {
    changeBreakMinutes(-1);
  });

  document.getElementById("break-plus-btn")?.addEventListener("click", () => {
    changeBreakMinutes(1);
  });
}

async function saveStudySession() {
  clearMessage();

  if (!currentUser) {
    showMessage("You must be logged in to save study data.");
    return;
  }

  if (state.completedFocusMinutes <= 0) {
    showMessage("Complete at least one focus session before saving.");
    return;
  }

  const subjectInput = document.getElementById("study-subject-input");
  const remarksInput = document.getElementById("study-remarks-input");

  const subject = subjectInput?.value.trim() || "Study Session";
  const remarks = remarksInput?.value.trim() || "";

  try {
    setSaveLoading(true);

    const token = await currentUser.getIdToken(true);
    const startedAt = state.sessionStartedAt ? new Date(state.sessionStartedAt) : new Date();
    const endedAt = new Date();

    const response = await fetch("/api/habits/study", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        subject,
        startTime: formatTime24(startedAt),
        endTime: formatTime24(endedAt),
        durationMin: state.completedFocusMinutes,
        remarks,
        logDate: startedAt.toISOString().slice(0, 10),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.details || data.error || "Failed to save study session.");
    }

    showMessage("Study logged successfully!", "success");

    state.completedFocusMinutes = 0;
    state.sessionStartedAt = null;
    state.currentPhase = "focus";
    state.remainingSeconds = state.focusMinutes * 60;
    stopTimer();
    updateTimerUI();

    if (subjectInput) subjectInput.value = "";
    if (remarksInput) remarksInput.value = "";

    clearSavedState();

    setTimeout(() => {
      window.location.href = ROUTES.habits;
    }, 900);
  } catch (error) {
    console.error("Study save error:", error);
    showMessage(error.message || "Failed to save study session.");
  } finally {
    setSaveLoading(false);
  }
}

function setupSaveButton() {
  document.getElementById("save-study-btn")?.addEventListener("click", () => {
    saveStudySession();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  loadState();
  reconcileRunningState();
  setupControls();
  setupSaveButton();
  updateTimerUI();

  if (state.isRunning) {
    timerInterval = setInterval(tick, 1000);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    console.log(`✅ Logged in as ${user.email}`);
  } else {
    currentUser = null;
    stopTimer();
    window.location.href = ROUTES.login;
  }
});