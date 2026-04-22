import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const token = await user.getIdToken();
            
            // 1. Fetch User Profile Stats (Name, Total, Avg Rate, Streak)
            // Note: Changed endpoint to match the new controller logic
            const profileResponse = await fetch('/api/habits/profile-stats', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (profileResponse.ok) {
                const data = await profileResponse.json();
                
                // Update Name
                const nameElement = document.getElementById("user-name");
                if (nameElement) {
                    nameElement.textContent = data.full_name || user.displayName || "User";
                }

                // Update Stats Grid (Calculated from backend)
                const totalElement = document.getElementById("stat-total");
                const avgElement = document.getElementById("stat-avg");
                const streakElement = document.getElementById("stat-streak");

                if (totalElement) totalElement.textContent = data.total_records.toLocaleString();
                if (avgElement) avgElement.textContent = `${data.avg_rate}%`;
                if (streakElement) streakElement.textContent = `${data.streak} Days`;
            }

            // 2. Fetch User Goals
            const goalsResponse = await fetch('/api/goals/my-targets', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (goalsResponse.ok) {
                const goals = await goalsResponse.json();
                
                // Habit IDs based on your logic: 1=Sleep, 2=Exercise, 3=Study, 4=Water
                if (goals["1"]) document.getElementById('display-sleep').textContent = `${goals["1"]}h daily`;
                if (goals["4"]) document.getElementById('display-water').textContent = `${goals["4"]}ml`;
                if (goals["2"]) document.getElementById('display-exercise').textContent = `${goals["2"]}m daily`;
                if (goals["3"]) document.getElementById('display-study').textContent = `${goals["3"]}h daily`;
            }

        } catch (error) {
            console.error("Profile Load Error:", error);
        }
    } else {
        window.location.href = "/login";
    }
});

document.addEventListener('DOMContentLoaded', function () {
    
    // Helper function to handle navigation safely
    function navigateTo(id, url) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', function (e) {
                e.preventDefault();
                window.location.href = url; 
            });
        }
    }

    // --- LOGOUT LOGIC ---
    const logoutBtn = document.getElementById('logout-btn'); 
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to log out?")) {
                try {
                    await signOut(auth);
                    window.location.href = "/pages/login.html"; 
                } catch (error) {
                    console.error("❌ Logout failed:", error);
                    alert("Logout failed.");
                }
            }
        });
    }

    // Navigation Mapping
    navigateTo('menu-dashboard', '/pages/dashboard.html');
    navigateTo('menu-habits', '/pages/habits.html');
    navigateTo('menu-history', '/pages/historyCalendar.html');
    navigateTo('profile-btn', '/pages/profile.html');
    navigateTo('edit-goal-btn', '/pages/editGoal.html');
});