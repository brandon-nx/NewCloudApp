import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const token = await user.getIdToken();
            
            // This FETCH is what triggers the log in your terminal
            const response = await fetch('/api/dashboard', { // Or /api/auth/profile, etc.
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                console.log(`✅ ${user.email} verified by backend.`);
                // Now you can call your page-specific functions here
                // e.g., loadProfileData();
            }
        } catch (error) {
            console.error("Auth Error:", error);
        }
    } else {
        // If they aren't logged in, kick them back to login
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