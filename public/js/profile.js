import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const token = await user.getIdToken();
            
            // 1. Fetch User Profile (Name)
            const profileResponse = await fetch('/api/dashboard', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (profileResponse.ok) {
                const userData = await profileResponse.json();
                const nameElement = document.getElementById("user-name");
                if (nameElement) {
                    nameElement.textContent = userData.full_name || user.displayName || "User";
                }
            }

            // 2. Fetch User Goals (NEW)
            const goalsResponse = await fetch('/api/goals/my-targets', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (goalsResponse.ok) {
                const goals = await goalsResponse.json();
                
                // Update the UI with data from database
                // Habit IDs: 1=Sleep, 2=Exercise, 3=Study, 4=Water (Verify these match your DB!)
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
                // Removed the leading '/' to use relative paths
                window.location.href = url; 
            });
        }
    }

    // Apply navigation to all buttons
    navigateTo('menu-dashboard', '/pages/dashboard.html'); // If dashboard.js is in /js/ and html is in /pages/
    navigateTo('menu-habits', '/pages/habits.html');
    navigateTo('menu-history', '/pages/historyCalendar.html');
    navigateTo('menu-settings', '/pages/profile.html');
    navigateTo('profile-btn', '/pages/profile.html');
    navigateTo('edit-goal-btn', '/pages/editGoal.html');
    navigateTo('logout-btn', '/pages/login.html');
});