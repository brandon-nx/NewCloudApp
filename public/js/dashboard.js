import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function () {
    
    // 1. AUTHENTICATION & DATA FETCHING
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("✅ User authenticated:", user.email);
            
            try {
                const token = await user.getIdToken();
                
                // Fetch all data
                await fetchUserHabits(token);
                await updateWeeklyChart(token);

            } catch (error) {
                console.error("❌ Error during dashboard initialization:", error);
            }
        } else {
            window.location.href = "/login";
        }
    });

    // 2. HABITS FETCHING & RENDERING
    async function fetchUserHabits(token) {
        const container = document.getElementById('habits-container');
        
        try {
            const response = await fetch('/api/habits/my-habits', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch habits');

            const habits = await response.json();
            renderHabits(habits);
            updateOverallProgress(habits); 
        } catch (error) {
            console.error("❌ Fetch Error:", error);
            container.innerHTML = `<p class="text-red-500 text-sm col-span-2 text-center">Failed to load habits.</p>`;
        }
    }

    function renderHabits(habits) {
        const container = document.getElementById('habits-container');
        container.innerHTML = ''; 

        if (habits.length === 0) {
            container.innerHTML = `<p class="col-span-2 text-center text-slate-400 py-10">No habits tracked yet today.</p>`;
            return;
        }

        habits.forEach(habit => {
            const progress = habit.goal_value > 0 ? Math.round((habit.current_value / habit.goal_value) * 100) : 0;
            const habitCard = `
                <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center shadow-sm">
                    <div class="relative w-20 h-20 flex items-center justify-center mb-3">
                        <span class="material-symbols-outlined text-primary text-3xl">${habit.icon || 'star'}</span>
                    </div>
                    <p class="font-bold text-slate-900 dark:text-slate-100">${habit.name}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">${habit.current_value || 0} / ${habit.goal_value}</p>
                    <div class="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div class="bg-primary h-full transition-all duration-1000" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                </div>
            `;
            container.innerHTML += habitCard;
        });
    }

    // 3. WEEKLY CHART LOGIC (FIXED)
    async function updateWeeklyChart(token) {
        try {
            const response = await fetch('/api/habits/weekly-activity', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            const dayMap = { 'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6 };
            const bars = document.querySelectorAll('.chart-bar');

            data.forEach(item => {
                const dayKey = item.day.trim(); 
                const idx = dayMap[dayKey];
                
                if (idx !== undefined && bars[idx]) {
                    const count = parseInt(item.count);
                    // 1 habit = 25% height, 4 habits = 100%
                    const height = Math.min(count * 25, 100);
                    
                    // We use cssText to force the color and height past Tailwind
                    bars[idx].style.cssText = `height: ${height}% !important; background-color: #137fec !important; opacity: 1 !important;`;
                }
            });
        } catch (err) {
            console.error("❌ Chart Update Error:", err);
        }
    }

    // 4. PROGRESS BANNER HELPER
    function updateOverallProgress(habits) {
        const textElement = document.getElementById('overall-progress-text');
        const barFill = document.getElementById('progress-bar-fill');
        const statsElement = document.getElementById('progress-stats');

        if (!habits.length) {
            if (textElement) textElement.innerText = "0% Complete";
            if (barFill) barFill.style.width = "0%";
            if (statsElement) statsElement.innerText = "No habits started today";
            return;
        }

        const totalHabits = habits.length;
        const completedHabits = habits.filter(h => h.current_value >= h.goal_value).length;
        const percentage = Math.round((completedHabits / totalHabits) * 100);

        if (textElement) textElement.innerText = `${percentage}% Complete`;
        if (barFill) barFill.style.width = `${percentage}%`;
        if (statsElement) statsElement.innerText = `${completedHabits} of ${totalHabits} habits completed today`;
    }

    // 5. NAVIGATION LOGIC
    function navigateTo(id, url) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', function (e) {
                e.preventDefault();
                window.location.href = url; 
            });
        }
    }

    navigateTo('menu-dashboard', '/dashboard'); 
    navigateTo('menu-habits', '/habits');
    navigateTo('menu-history', '/history');
    navigateTo('menu-settings', '/profile');
    navigateTo('profile-btn', '/profile');
});