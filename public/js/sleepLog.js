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
  } else if (period === "PM") {
    if (hour !== 12) hour += 12;
  }

  return `${String(hour).padStart(2, "0")}:${mins}`;
}

function calculateDurationMinutes(bedtime24, wakeTime24) {
  if (!bedtime24 || !wakeTime24) return 0;

  const [bedHour, bedMinute] = bedtime24.split(":").map(Number);
  const [wakeHour, wakeMinute] = wakeTime24.split(":").map(Number);

  let bedtimeTotal = bedHour * 60 + bedMinute;
  let wakeTimeTotal = wakeHour * 60 + wakeMinute;

  if (wakeTimeTotal <= bedtimeTotal) {
    wakeTimeTotal += 24 * 60;
  }

  return wakeTimeTotal - bedtimeTotal;
}

function formatDuration(minutes) {
  const total = Number(minutes || 0);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours}h ${String(mins).padStart(2, "0")}m`;
}

function format12HourString(hour, minute, period) {
  return `${hour}:${String(minute).padStart(2, "0")} ${period}`;
}

function showMessage(message, type = "error") {
  const messageBox = document.getElementById("sleep-log-message");
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
  const messageBox = document.getElementById("sleep-log-message");
  if (!messageBox) return;
  messageBox.textContent = "";
  messageBox.classList.add("hidden");
}

function setLoading(isLoading) {
  const saveBtn = document.getElementById("save-sleep-btn");
  const saveBtnText = document.getElementById("save-sleep-btn-text");

  if (!saveBtn || !saveBtnText) return;

  saveBtn.disabled = isLoading;

  if (isLoading) {
    saveBtn.classList.add("opacity-70", "cursor-not-allowed");
    saveBtnText.textContent = "Saving...";
  } else {
    saveBtn.classList.remove("opacity-70", "cursor-not-allowed");
    saveBtnText.textContent = "Log Sleep";
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

function setupQualityButtons() {
  const qualityButtons = document.querySelectorAll(".quality-btn");
  const qualityInput = document.getElementById("sleep-quality-input");

  qualityButtons.forEach((button) => {
    button.addEventListener("click", () => {
      qualityButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      if (qualityInput) {
        qualityInput.value = button.dataset.quality || "3";
      }
    });
  });
}

function getSelectedTimes() {
  const bedtimeHour = document.getElementById("bedtime-hour")?.value;
  const bedtimeMinute = document.getElementById("bedtime-minute")?.value;
  const bedtimePeriod = document.getElementById("bedtime-period")?.value;

  const wakeHour = document.getElementById("wake-hour")?.value;
  const wakeMinute = document.getElementById("wake-minute")?.value;
  const wakePeriod = document.getElementById("wake-period")?.value;

  if (!bedtimeHour || !bedtimeMinute || !bedtimePeriod || !wakeHour || !wakeMinute || !wakePeriod) {
    return null;
  }

  const bedtime24 = to24Hour(bedtimeHour, bedtimeMinute, bedtimePeriod);
  const wakeTime24 = to24Hour(wakeHour, wakeMinute, wakePeriod);

  return {
    bedtime24,
    wakeTime24,
    bedtimeDisplay: format12HourString(bedtimeHour, bedtimeMinute, bedtimePeriod),
    wakeDisplay: format12HourString(wakeHour, wakeMinute, wakePeriod),
  };
}

function setupDurationCalculation() {
  const durationDisplay = document.getElementById("calculated-duration");
  const selectIds = [
    "bedtime-hour",
    "bedtime-minute",
    "bedtime-period",
    "wake-hour",
    "wake-minute",
    "wake-period",
  ];

  const updateDuration = () => {
    const selected = getSelectedTimes();
    if (!durationDisplay || !selected) return;

    const durationMinutes = calculateDurationMinutes(selected.bedtime24, selected.wakeTime24);
    durationDisplay.textContent = formatDuration(durationMinutes);
  };

  selectIds.forEach((id) => {
    document.getElementById(id)?.addEventListener("change", updateDuration);
  });

  updateDuration();
}

function setupFormSubmission() {
  const form = document.getElementById("sleep-log-form");
  const qualityInput = document.getElementById("sleep-quality-input");

  if (!form || !qualityInput) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    if (!currentUser) {
      showMessage("You must be logged in to save sleep data.");
      return;
    }

    const selected = getSelectedTimes();
    if (!selected) {
      showMessage("Please select both bedtime and wake up time.");
      return;
    }

    const sleepQuality = Number(qualityInput.value || 3);
    const durationMin = calculateDurationMinutes(selected.bedtime24, selected.wakeTime24);

    if (durationMin <= 0) {
      showMessage("Please enter a valid sleep duration.");
      return;
    }

    try {
      setLoading(true);

      const token = await currentUser.getIdToken(true);

      const response = await fetch("/api/habits/sleep", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          bedtime: selected.bedtime24,
          wakeTime: selected.wakeTime24,
          durationMin,
          sleepQuality,
          logDate: new Date().toISOString().slice(0, 10),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to save sleep log.");
      }

      // store for habits page display
      localStorage.setItem("sleep_bedtime", selected.bedtime24);
      localStorage.setItem("sleep_waketime", selected.wakeTime24);
      localStorage.setItem("sleep_duration_min", String(durationMin));
      localStorage.setItem("sleep_quality", String(sleepQuality));

      showMessage("Sleep logged successfully!", "success");

      setTimeout(() => {
        window.location.href = ROUTES.habits;
      }, 900);
    } catch (error) {
      console.error("Sleep log error:", error);
      showMessage(error.message || "Failed to save sleep log.");
    } finally {
      setLoading(false);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupQualityButtons();
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