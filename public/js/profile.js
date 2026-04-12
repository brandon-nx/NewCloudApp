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