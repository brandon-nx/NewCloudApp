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
    navigateTo('back-btn', 'profile.html');
    navigateTo('save-goals-btn', 'profile.html');
});