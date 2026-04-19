import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 1. Calendar State
let currentViewDate = new Date(); 
const today = new Date();         
let selectedDateStr = today.toDateString(); 

// --- AUTH & INITIAL LOAD ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Auto-fetch today's logs immediately
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        fetchDayLogs(`${y}-${m}-${d}`);
    } else {
        window.location.href = "/login";
    }
});

// --- HELPER FUNCTIONS ---

function updateLiveDuration() {
    const startTime = document.getElementById('edit-start-time').value;
    const endTime = document.getElementById('edit-end-time').value;
    const amountInput = document.getElementById('edit-amount-input');
    const humanLabel = document.getElementById('duration-human-readable');
    const habitId = Number(document.getElementById('edit-habit-type-id').value);

    // Only auto-calculate for Sleep (1) and Exercise (2)
    if (!startTime || !endTime || (habitId !== 1 && habitId !== 2)) return;

    // Convert HH:mm to total minutes from start of day
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    let startTotal = (startH * 60) + startM;
    let endTotal = (endH * 60) + endM;

    // Handle Day Rollover (e.g., 23:00 to 07:00)
    if (endTotal <= startTotal) {
        endTotal += 1440; // Add 24 hours in minutes
    }

    const diffMinutes = endTotal - startTotal;

    // Update the actual numeric input for the database
    amountInput.value = diffMinutes;

    // Update the "Hour and Minutes" display
    const h = Math.floor(diffMinutes / 60);
    const m = diffMinutes % 60;
    humanLabel.textContent = `${h}h ${String(m).padStart(2, '0')}m`;
}

// The Timestamp Formatter
function formatLogTimestamp(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    
    // 1. Get the Day (16)
    const day = date.getDate();
    
    // 2. Get the Month Name (April)
    const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
    
    // 3. Get Hours and Minutes (23:39)
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day} ${month} ${hours}:${minutes}`;
}

// Export Delete Function to Window
window.deleteLog = async (logId) => {
    console.log("Button clicked for ID:", logId); // Debug line
    
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`/api/history/${logId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            // Trigger a refresh of the cards
            const date = new Date(selectedDateStr);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            fetchDayLogs(`${y}-${m}-${d}`);
        }
    } catch (err) {
        console.error("Delete error:", err);
    }
};


function getHabitMeta(id) {
    const habitId = Number(id);
    const meta = {
        1: { title: 'Sleep', icon: 'dark_mode', color: 'indigo' },
        2: { title: 'Exercise', icon: 'fitness_center', color: 'orange' },
        3: { title: 'Study', icon: 'menu_book', color: 'emerald' },
        4: { title: 'Water', icon: 'water_drop', color: 'blue' }
    };
    return meta[habitId] || { title: 'Habit', icon: 'task_alt', color: 'slate' };
}

function formatProgress(id, value) {
    if (id === 4) return `${value}ml`;
    if (id === 2) return `${value}m`;
    const h = Math.floor(value / 60);
    const m = value % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// --- CORE UI FUNCTIONS ---

async function fetchDayLogs(date) {
    const container = document.getElementById('habit-cards-container');
    const emptyState = document.getElementById('no-records-state');
    if (!container || !emptyState) return;

    try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`/api/history/${date}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const logs = await response.json();
		window.currentLogs = logs;

        // Check if logs is a valid array with items
        if (!Array.isArray(logs) || logs.length === 0) {
            container.classList.add('hidden');
            emptyState.classList.remove('hidden');
        } else {
            container.classList.remove('hidden');
            emptyState.classList.add('hidden');
            renderHabitCards(logs); 
        }
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

function renderHabitCards(logs) {
    const container = document.getElementById('habit-cards-container');
    container.innerHTML = ""; 

    logs.forEach(log => {
        const meta = getHabitMeta(log.habit_type_id);
        const isWater = Number(log.habit_type_id) === 4;
        
        // 1. Calculate values
        const cardValue = isWater ? Number(log.intake_ml || 0) : Number(log.duration_min || 0);
        const dailySum = isWater ? Number(log.daily_total_intake || 0) : Number(log.daily_total_duration || 0);
        const targetValue = Number(log.target_value || 0);
        
        let targetInMins = targetValue;
        if (Number(log.habit_type_id) === 1 || Number(log.habit_type_id) === 3) {
            targetInMins = targetValue * 60;
        }

        // 2. Hide "ghost" cards with no actual value
        if (cardValue <= 0) return;

        const isGoalMet = dailySum >= targetInMins;

        const cardHtml = `
            <div class="flex items-center justify-between gap-4 rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div class="flex items-center gap-4">
                    <div class="flex size-12 items-center justify-center rounded-lg bg-${meta.color}-50 dark:bg-${meta.color}-900/30 text-${meta.color}-600 dark:text-${meta.color}-400">
                        <span class="material-symbols-outlined">${meta.icon}</span>
                    </div>
                    <div class="flex flex-col">
                        <p class="text-slate-900 dark:text-slate-100 text-base font-bold leading-tight">${meta.title}</p>
                        <p class="text-slate-500 dark:text-slate-400 text-sm font-normal mt-1">
                            ${formatProgress(log.habit_type_id, cardValue)}
                        </p>
                    </div>
                </div>

                <div class="flex flex-col items-end gap-1">
                    ${isGoalMet ? `
                        <div class="flex items-center gap-1 text-emerald-600 dark:text-emerald-500 font-bold text-[10px] uppercase tracking-wider mb-0.5">
                            <span class="material-symbols-outlined !text-[14px]" style="font-variation-settings: 'FILL' 1">check_circle</span>
                            <span>Goal Met</span>
                        </div>
                    ` : ''} 
                    <p class="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-2">
                        ${formatLogTimestamp(log.updated_at)}
                    </p>
                    <div class="flex items-center gap-2">
                        
						<button data-id="${log.activity_log_id}" 
								class="edit-btn flex items-center justify-center rounded-full h-8 w-8 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-colors">
							<span class="material-symbols-outlined text-[18px] pointer-events-none">edit</span>
						</button>
						<button data-id="${log.activity_log_id}" 
								class="delete-btn flex items-center justify-center rounded-full h-8 w-8 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors">
							<span class="material-symbols-outlined text-[18px] pointer-events-none">delete</span>
						</button>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// --- MODAL SELECTORS ---
const editModal = document.getElementById('edit-habit-modal');
const logIdDisplay = document.getElementById('test-log-id');
const closeBtn = document.getElementById('close-edit-modal');
const cancelBtn = document.getElementById('cancel-edit-btn');

// Function to toggle modal
const toggleEditModal = (show = true) => {
    if (show) {
        editModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
        editModal.classList.add('hidden');
        document.body.style.overflow = ''; 
    }
};
// Listen for changes on the time inputs
document.getElementById('edit-start-time').addEventListener('input', updateLiveDuration);
document.getElementById('edit-end-time').addEventListener('input', updateLiveDuration);

// Also listen to the numeric input in case they type minutes manually
document.getElementById('edit-amount-input').addEventListener('input', (e) => {
    const val = Number(e.target.value);
    const h = Math.floor(val / 60);
    const m = val % 60;
    document.getElementById('duration-human-readable').textContent = `${h}h ${String(m).padStart(2, '0')}m`;
});

document.getElementById('edit-habit-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Confirm with user
    const isConfirmed = confirm("Are you sure you want to save these changes to your habit log?");
    if (!isConfirmed) return; 

    // 2. Gather IDs
    const logId = document.getElementById('edit-log-id').value;
    const habitId = Number(document.getElementById('edit-habit-type-id').value);
    
    // 3. Gather payload
    const payload = {
        habit_type_id: habitId,
        duration_min: document.getElementById('edit-amount-input').value,
        intake_ml: document.getElementById('edit-amount-input').value,
        start_time: document.getElementById('edit-start-time').value,
        end_time: document.getElementById('edit-end-time').value
    };

    try {
        // Only call setLoading if it's defined to prevent crashes
        if (typeof setLoading === 'function') setLoading(true); 

        // Get Firebase Token
        const token = await auth.currentUser.getIdToken();

        // Use BACKTICKS (``) for the URL, not single quotes
        const response = await fetch(`/api/history/${logId}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log("✅ Update successful");
            toggleEditModal(false);
            
            // Refresh the UI using the current state
            const date = new Date(selectedDateStr);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            
            await fetchDayLogs(`${y}-${m}-${d}`);
        } else {
            const errorData = await response.json();
            alert("Error: " + (errorData.error || "Update failed"));
        }
    } catch (err) {
        console.error("❌ Submit error:", err);
        alert("An error occurred while saving. Check the console.");
    } finally {
        if (typeof setLoading === 'function') setLoading(false);
    }
});

// --- EVENT DELEGATION FOR BOTH DELETE & EDIT ---
document.getElementById('habit-cards-container').addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    const editBtn = e.target.closest('.edit-btn');

    // 1. Handle Delete Logic
    if (deleteBtn) {
        const logIdToDelete = deleteBtn.dataset.id;
        console.log("🚀 Delete triggered for ID:", logIdToDelete);

        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            const token = await auth.currentUser.getIdToken();
            const response = await fetch(`/api/history/${logIdToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                console.log("✅ Deleted successfully");
                const date = new Date(selectedDateStr);
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                fetchDayLogs(`${y}-${m}-${d}`);
            } else {
                alert("Delete failed on server.");
            }
        } catch (err) {
            console.error("❌ Delete error:", err);
        }
    } 
    
    // --- EVENT DELEGATION: EDIT LOGIC ---
	else if (editBtn) {
		const logId = editBtn.dataset.id;
		
		try {
			const token = await auth.currentUser.getIdToken();
			const response = await fetch(`/api/history/log/${logId}`, {
				headers: { 'Authorization': `Bearer ${token}` }
			});
			const logData = await response.json();

			// 1. Fill Hidden IDs
			document.getElementById('edit-log-id').value = logData.activity_log_id;
			document.getElementById('edit-habit-type-id').value = logData.habit_type_id;

			// 2. Setup Meta Data (Title/Icon)
			const meta = getHabitMeta(logData.habit_type_id);
			document.getElementById('edit-title').textContent = meta.title;
			document.getElementById('edit-icon').textContent = meta.icon;

			// 3. Shape-Shift UI and Fill Values
			const habitId = Number(logData.habit_type_id);
			const timeContainer = document.getElementById('time-inputs-container');
			const amountLabel = document.getElementById('amount-label');
			const amountIcon = document.getElementById('amount-icon');
			const amountInput = document.getElementById('edit-amount-input');
			const humanLabel = document.getElementById('duration-human-readable'); // Get the H/M label

			// Tailwind Focus classes
			const noFocusClasses = ['focus:ring-0', 'focus:outline-none', 'focus:border-slate-100', 'dark:focus:border-slate-800'];
			const activeFocusClasses = ['focus:ring-2', 'focus:ring-primary/20', 'focus:border-primary'];

			if (habitId === 1 || habitId === 2) { 
				// SLEEP/EXERCISE
				timeContainer.classList.remove('hidden');
				if (humanLabel) humanLabel.classList.remove('hidden'); // SHOW label
				
				amountLabel.textContent = "Duration (Mins)";
				amountIcon.textContent = "timer";
				
				amountInput.readOnly = true;
				amountInput.classList.add('bg-slate-50', 'text-slate-500', ...noFocusClasses);
				amountInput.classList.remove('bg-white', ...activeFocusClasses);

				amountInput.value = logData.duration_min;
				document.getElementById('edit-start-time').value = logData.start_time ? new Date(logData.start_time).toTimeString().slice(0, 5) : "";
				document.getElementById('edit-end-time').value = logData.end_time ? new Date(logData.end_time).toTimeString().slice(0, 5) : "";

			} else if (habitId === 3) {
				// STUDY
				timeContainer.classList.add('hidden');
				if (humanLabel) humanLabel.classList.remove('hidden'); // SHOW label (Still time-based)
				
				amountInput.readOnly = false;
				amountInput.classList.remove('bg-slate-50', 'text-slate-500', ...noFocusClasses);
				amountInput.classList.add('bg-white', ...activeFocusClasses);

				amountLabel.textContent = "Duration (Mins)";
				amountIcon.textContent = "timer";
				amountInput.value = logData.duration_min;

			} else if (habitId === 4) {
				// WATER
				timeContainer.classList.add('hidden');
				if (humanLabel) humanLabel.classList.add('hidden'); // HIDE label (Not time-based)
				
				amountInput.readOnly = false;
				amountInput.classList.remove('bg-slate-50', 'text-slate-500', ...noFocusClasses);
				amountInput.classList.add('bg-white', ...activeFocusClasses);

				amountLabel.textContent = "Intake (ml)";
				amountIcon.textContent = "water_drop";
				amountInput.step = "50";
				amountInput.value = logData.intake_ml;
			}

			// Trigger the "Hour and Minutes" human-readable text immediately
			if (habitId !== 4) updateLiveDuration();

			toggleEditModal(true);
		} catch (err) {
			console.error("Failed to fetch log details:", err);
			alert("Could not load log data. Please try again.");
		}
	}
});

// --- CLOSE MODAL LISTENERS ---
[closeBtn, cancelBtn].forEach(btn => {
    btn?.addEventListener('click', () => toggleEditModal(false));
});

document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('calendar-grid');
    const monthDisplay = document.getElementById('current-month-display');
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    function updateSelectedDateHeader(day, monthIndex, year) {
        const titleEl = document.getElementById('selected-day-title');
        if (!titleEl) return;
        const date = new Date(year, monthIndex, day);
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
        titleEl.innerText = `History - ${day} ${monthName}`;
    }

    function renderCalendar() {
        if (!grid || !monthDisplay) return;
        grid.innerHTML = "";
        const year = currentViewDate.getFullYear();
        const month = currentViewDate.getMonth();
        monthDisplay.innerText = `${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentViewDate)} ${year}`;

        const firstDayIndex = new Date(year, month, 1).getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const prevLastDay = new Date(year, month, 0).getDate();

        if (year === today.getFullYear() && month === today.getMonth()) nextBtn?.classList.add('invisible'); 
        else nextBtn?.classList.remove('invisible');

        // Render Padding
        for (let x = firstDayIndex; x > 0; x--) {
            const dayBtn = document.createElement('button');
            dayBtn.className = "h-10 w-full text-slate-300 dark:text-slate-700 text-sm font-medium flex items-center justify-center cursor-default";
            dayBtn.innerText = prevLastDay - x + 1;
            grid.appendChild(dayBtn);
        }

        // Render Actual Days
        for (let i = 1; i <= lastDay; i++) {
            const dayBtn = document.createElement('button');
            dayBtn.className = "h-10 w-full text-sm font-medium flex items-center justify-center transition-all relative rounded-lg";
            
            const dateObj = new Date(year, month, i);
            const dateStr = dateObj.toDateString();
            const isToday = dateStr === today.toDateString();
            const isSelected = dateStr === selectedDateStr;
            const isFuture = dateObj > today;

            if (isSelected) {
                dayBtn.innerHTML = `<div class="flex size-9 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/30">${i}</div>`;
            } else if (isFuture) {
                dayBtn.classList.add('text-slate-400', 'dark:text-slate-500', 'cursor-default');
                dayBtn.innerText = i;
            } else {
                dayBtn.classList.add('text-slate-900', 'dark:text-slate-100', 'hover:bg-primary/10');
                dayBtn.innerText = i;
                if (isToday) dayBtn.classList.add('text-primary', 'font-bold');
            }

            if (!isFuture) {
                dayBtn.addEventListener('click', () => {
                    selectedDateStr = dateStr;
                    renderCalendar();
                    updateSelectedDateHeader(i, month, year);
                    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                    fetchDayLogs(formattedDate);
                });
            }
            grid.appendChild(dayBtn);
        }
    }

    renderCalendar();
    updateSelectedDateHeader(today.getDate(), today.getMonth(), today.getFullYear());

    prevBtn?.addEventListener('click', () => { currentViewDate.setMonth(currentViewDate.getMonth() - 1); renderCalendar(); });
    nextBtn?.addEventListener('click', () => { currentViewDate.setMonth(currentViewDate.getMonth() + 1); renderCalendar(); });

    // Navigation setup
    const navigateTo = (id, url) => {
        document.getElementById(id)?.addEventListener('click', (e) => { e.preventDefault(); window.location.href = url; });
    };

    navigateTo('menu-dashboard', '/pages/dashboard.html');
    navigateTo('menu-habits', '/pages/habits.html');
    navigateTo('menu-history', '/pages/historyCalendar.html');
    navigateTo('menu-settings', '/pages/profile.html');
	navigateTo('profile-btn', '/pages/profile.html');
});