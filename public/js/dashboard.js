import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function () {
    
    // 1. AUTHENTICATION & DATA FETCHING
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("✅ User authenticated:", user.email);
            
            try {
                // Get the secure token from Firebase
                const token = await user.getIdToken();
                
                // Fetch user-specific habits from the backend
                await fetchUserHabits(token);
                
                // Optional: Fetch user profile name (if you have the API ready)
                // await fetchUserProfile(token);

            } catch (error) {
                console.error("❌ Error during dashboard initialization:", error);
            }
        } else {
            // If no user, the HTML Route Guard usually handles this, 
            // but this is a secondary safety check.
            window.location.href = "/login";
        }
    });

    // 2. FETCHING LOGIC
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
        } catch (error) {
            console.error("❌ Fetch Error:", error);
            container.innerHTML = `<p class="text-red-500 text-sm col-span-2 text-center">Failed to load habits.</p>`;
        }
    }

    // 3. RENDERING LOGIC
    function renderHabits(habits) {
        const container = document.getElementById('habits-container');
        container.innerHTML = ''; // Clear loading state

        if (habits.length === 0) {
            container.innerHTML = `<p class="col-span-2 text-center text-slate-400 py-10">No habits tracked yet.</p>`;
            return;
        }

        habits.forEach(habit => {
            const habitCard = `
                <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
                    <div class="relative w-20 h-20 flex items-center justify-center mb-3">
                        <span class="material-symbols-outlined text-primary text-3xl">${habit.icon || 'star'}</span>
                    </div>
                    <p class="font-bold text-slate-900 dark:text-slate-100">${habit.name}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">${habit.current_value || 0} / ${habit.goal_value}</p>
                </div>
            `;
            container.innerHTML += habitCard;
        });
    }

    // 4. NAVIGATION LOGIC
    function navigateTo(id, url) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', function (e) {
                e.preventDefault();
                window.location.href = url; 
            });
        }
    }

    // Nav links (Using your Express routes is better than direct .html paths)
    navigateTo('menu-dashboard', '/dashboard'); 
    navigateTo('menu-habits', '/habits');
    navigateTo('menu-history', '/history');
    navigateTo('menu-settings', '/profile');

    // 5. LOGOUT LOGIC
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', async () => {
            // For now, let's make the profile button log you out 
            // Or you can redirect to profile page if you prefer
            if (confirm("Do you want to logout?")) {
                await signOut(auth);
                window.location.href = "/login";
            }
        });
    }
});