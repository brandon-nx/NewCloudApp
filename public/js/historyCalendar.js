import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// 1. Calendar State
let currentViewDate = new Date(); // Controls which month is shown
const today = new Date();         // Reference for current real date
let selectedDateStr = today.toDateString(); // Tracks which day has the "Blue Circle"

onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/dashboard', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) console.log(`✅ ${user.email} verified.`);
        } catch (error) {
            console.error("Auth Error:", error);
        }
    } else {
        window.location.href = "/login";
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('calendar-grid');
    const monthDisplay = document.getElementById('current-month-display');
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    function updateProgressUI(day, monthName) {
        const badge = document.getElementById('completion-rate-badge');
        if (badge) badge.innerText = "0% Complete"; 
    }

    function updateSelectedDateHeader(day, monthIndex, year) {
        const titleEl = document.getElementById('selected-day-title');
        if (!titleEl) return;
        const date = new Date(year, monthIndex, day);
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
        titleEl.innerText = `Progress - ${day} ${monthName}`;
    }

    function renderCalendar() {
        if (!grid || !monthDisplay) return;

        grid.innerHTML = "";
        const year = currentViewDate.getFullYear();
        const month = currentViewDate.getMonth();

        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentViewDate);
        monthDisplay.innerText = `${monthName} ${year}`;

        // Arrow Visibility
        const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
        if (isCurrentMonth) nextBtn?.classList.add('invisible'); 
        else nextBtn?.classList.remove('invisible');

        const firstDayIndex = new Date(year, month, 1).getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const prevLastDay = new Date(year, month, 0).getDate();

        // 1. Previous Month Padding
        for (let x = firstDayIndex; x > 0; x--) {
            const dayBtn = document.createElement('button');
            dayBtn.className = "h-10 w-full text-slate-300 dark:text-slate-700 text-sm font-medium flex items-center justify-center cursor-default";
            dayBtn.innerText = prevLastDay - x + 1;
            dayBtn.disabled = true; 
            grid.appendChild(dayBtn);
        }

        // 2. Current Month Days
        for (let i = 1; i <= lastDay; i++) {
            const dayBtn = document.createElement('button');
            dayBtn.className = "h-10 w-full text-sm font-medium flex items-center justify-center transition-all relative rounded-lg";
            
            const dateObj = new Date(year, month, i);
            const dateStr = dateObj.toDateString();
            const isToday = dateStr === today.toDateString();
            const isSelected = dateStr === selectedDateStr; // Check if this is the chosen date
            const isFuture = dateObj > today;

            if (isSelected) {
                // THE HIGHLIGHT STYLE (Blue Circle)
                dayBtn.innerHTML = `<div class="flex size-9 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/30 animate-in zoom-in-75 duration-200">${i}</div>`;
            } else if (isFuture) {
                dayBtn.classList.add('text-slate-400', 'dark:text-slate-500', 'cursor-default');
                dayBtn.innerText = i;
                dayBtn.disabled = true;
            } else {
                // Normal or Today-But-Not-Selected
                dayBtn.classList.add('text-slate-900', 'dark:text-slate-100', 'hover:bg-primary/10', 'active:scale-95');
                dayBtn.innerText = i;
                
                // If it's today but not selected, we give it blue text so the user doesn't lose "now"
                if (isToday) dayBtn.classList.add('text-primary', 'font-bold');
            }

            if (!isFuture) {
                // Inside your renderCalendar loop for click listener:
				dayBtn.addEventListener('click', async () => {
					selectedDateStr = dateStr;
					renderCalendar();
					updateSelectedDateHeader(i, month, year);

					// Format date for the API (YYYY-MM-DD)
					const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
					
					await fetchDayLogs(formattedDate);
				});

				async function fetchDayLogs(date) {
					const container = document.getElementById('habit-cards-container');
					const emptyState = document.getElementById('no-records-state');
					
					try {
						const token = await auth.currentUser.getIdToken();
						const response = await fetch(`/api/history/${date}`, {
							headers: { 'Authorization': `Bearer ${token}` }
						});
						const logs = await response.json();

						// Check if there are any actual logs
						if (!logs || logs.length === 0) {
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
            }
            grid.appendChild(dayBtn);
        }
    }

    // Navigation and Init
    prevBtn?.addEventListener('click', () => {
        currentViewDate.setMonth(currentViewDate.getMonth() - 1);
        renderCalendar();
    });

    nextBtn?.addEventListener('click', () => {
        currentViewDate.setMonth(currentViewDate.getMonth() + 1);
        renderCalendar();
    });

	// Temporary placeholder for rendering cards
	function renderHabitCards(logs) {
		console.log("Data found! Ready to build cards:", logs);
		// We will build the actual card HTML here in the next step
	}

    function navigateTo(id, url) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = url; 
            });
        }
    }

    renderCalendar();
    updateSelectedDateHeader(today.getDate(), today.getMonth(), today.getFullYear());

    navigateTo('menu-dashboard', '/pages/dashboard.html');
    navigateTo('menu-habits', '/pages/habits.html');
    navigateTo('menu-history', '/pages/historyCalendar.html');
    navigateTo('menu-settings', '/pages/profile.html');
    navigateTo('profile-btn', '/pages/profile.html');
    navigateTo('back-btn', '/pages/profile.html');

    document.querySelectorAll('input[name="view-toggle"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'List') {
                setTimeout(() => { window.location.href = '/pages/historyList.html'; }, 150); 
            }
        });
    });
});