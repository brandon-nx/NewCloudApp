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

function to24Hour(hour12, minute, period) {
  let hour = Number(hour12);
  const mins = String(minute).padStart(2, "0");

  if (period === "AM") {
    if (hour === 12) hour = 0;
  } else {
    if (hour !== 12) hour += 12;
  }

  return `${String(hour).padStart(2, "0")}:${mins}`;
}

function calculateDurationMinutes(start24, end24) {
  if (!start24 || !end24) return 0;

  const [startHour, startMinute] = start24.split(":").map(Number);
  const [endHour, endMinute] = end24.split(":").map(Number);

  let startTotal = startHour * 60 + startMinute;
  let endTotal = endHour * 60 + endMinute;

  if (endTotal <= startTotal) {
    endTotal += 24 * 60;
  }

  return endTotal - startTotal;
}

function formatDuration(minutes) {
  const total = Number(minutes || 0);
  const hours = Math.floor(total / 60);
  const mins = total % 60;

  if (hours > 0) {
    return `${hours}h ${String(mins).padStart(2, "0")}m`;
  }

  return `${mins} Minutes`;
}

function showMessage(message, type = "error") {
  const messageBox = document.getElementById("exercise-log-message");
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
  const messageBox = document.getElementById("exercise-log-message");
  if (!messageBox) return;
  messageBox.textContent = "";
  messageBox.classList.add("hidden");
}

function setLoading(isLoading) {
  const saveBtn = document.getElementById("save-exercise-btn");
  const saveBtnText = document.getElementById("save-exercise-btn-text");

  if (!saveBtn || !saveBtnText) return;

  saveBtn.disabled = isLoading;

  if (isLoading) {
    saveBtn.classList.add("opacity-70", "cursor-not-allowed");
    saveBtnText.textContent = "Saving...";
  } else {
    saveBtn.classList.remove("opacity-70", "cursor-not-allowed");
    saveBtnText.textContent = "Log Exercise";
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

function getSelectedTimes() {
  const startHour = document.getElementById("exercise-start-hour")?.value;
  const startMinute = document.getElementById("exercise-start-minute")?.value;
  const startPeriod = document.getElementById("exercise-start-period")?.value;

  const endHour = document.getElementById("exercise-end-hour")?.value;
  const endMinute = document.getElementById("exercise-end-minute")?.value;
  const endPeriod = document.getElementById("exercise-end-period")?.value;

  if (!startHour || !startMinute || !startPeriod || !endHour || !endMinute || !endPeriod) {
    return null;
  }

  return {
    startTime24: to24Hour(startHour, startMinute, startPeriod),
    endTime24: to24Hour(endHour, endMinute, endPeriod),
  };
}

function setupDurationCalculation() {
  const durationDisplay = document.getElementById("exercise-duration-display");
  const selectIds = [
    "exercise-start-hour",
    "exercise-start-minute",
    "exercise-start-period",
    "exercise-end-hour",
    "exercise-end-minute",
    "exercise-end-period",
  ];

  const updateDuration = () => {
    const selected = getSelectedTimes();
    if (!durationDisplay || !selected) return;

    const durationMinutes = calculateDurationMinutes(
      selected.startTime24,
      selected.endTime24
    );

    durationDisplay.textContent = formatDuration(durationMinutes);
  };

  selectIds.forEach((id) => {
    document.getElementById(id)?.addEventListener("change", updateDuration);
  });

  updateDuration();
}

function restoreSavedValues() {
  const savedActivity = localStorage.getItem("exercise_activity_type");
  const savedStart = localStorage.getItem("exercise_start_time");
  const savedEnd = localStorage.getItem("exercise_end_time");
  const savedRemarks = localStorage.getItem("exercise_remarks");

  const activityInput = document.getElementById("exercise-activity-input");
  const remarksInput = document.getElementById("exercise-remarks-input");

  if (savedActivity && activityInput) {
    activityInput.value = savedActivity;
  }

  if (savedRemarks && remarksInput) {
    remarksInput.value = savedRemarks;
  }

  const applyTime = (time24, prefix) => {
    if (!time24 || !time24.includes(":")) return;

    let [hour, minute] = time24.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;
    if (hour === 0) hour = 12;

    const hourEl = document.getElementById(`${prefix}-hour`);
    const minuteEl = document.getElementById(`${prefix}-minute`);
    const periodEl = document.getElementById(`${prefix}-period`);

    if (hourEl) hourEl.value = String(hour);
    if (minuteEl) minuteEl.value = String(minute).padStart(2, "0");
    if (periodEl) periodEl.value = period;
  };

  applyTime(savedStart, "exercise-start");
  applyTime(savedEnd, "exercise-end");
}

function setupFormSubmission() {
  const form = document.getElementById("exercise-log-form");
  const activityInput = document.getElementById("exercise-activity-input");
  const remarksInput = document.getElementById("exercise-remarks-input");

  if (!form || !activityInput || !remarksInput) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    if (!currentUser) {
      showMessage("You must be logged in to save exercise data.");
      return;
    }

    const selected = getSelectedTimes();
    if (!selected) {
      showMessage("Please select both start and end time.");
      return;
    }

    const activityType = activityInput.value;
    const remarks = remarksInput.value.trim();
    const durationMin = calculateDurationMinutes(
      selected.startTime24,
      selected.endTime24
    );

    if (!activityType) {
      showMessage("Please select an activity type.");
      return;
    }

    if (durationMin <= 0) {
      showMessage("Please enter a valid exercise duration.");
      return;
    }

    try {
      setLoading(true);

      const token = await currentUser.getIdToken(true);

      const response = await fetch("/api/habits/exercise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          activityType,
          startTime: selected.startTime24,
          endTime: selected.endTime24,
          durationMin,
          remarks,
          logDate: new Date().toISOString().slice(0, 10),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to save exercise log.");
      }

      localStorage.setItem("exercise_activity_type", activityType);
      localStorage.setItem("exercise_start_time", selected.startTime24);
      localStorage.setItem("exercise_end_time", selected.endTime24);
      localStorage.setItem("exercise_duration_min", String(durationMin));
      localStorage.setItem("exercise_remarks", remarks);

      showMessage("Exercise logged successfully!", "success");

      setTimeout(() => {
        window.location.href = ROUTES.habits;
      }, 900);
    } catch (error) {
      console.error("Exercise log error:", error);
      showMessage(error.message || "Failed to save exercise log.");
    } finally {
      setLoading(false);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  restoreSavedValues();
  setupDurationCalculation();
  setupFormSubmission();
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    console.log(`✅ Logged in as ${user.email}`);
  } else {
    currentUser = null;
    window.location.href = ROUTES.login;
  }
});