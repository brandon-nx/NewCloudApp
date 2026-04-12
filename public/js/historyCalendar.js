document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('input[name="view-toggle"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'List') {
            // Optional: Add a tiny delay so the user sees the toggle animation
            setTimeout(() => {
                window.location.href = 'historyList.html';
            }, 150); 
        }
    });
});
	document.getElementById('menu-dashboard')?.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/pages/dashboard.html';
	});
	document.getElementById('menu-habits')?.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/pages/habits.html';
	});
	document.getElementById('menu-history')?.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/pages/historyCalendar.html';
	});
	document.getElementById('menu-settings')?.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/pages/profile.html';
	});

	document.getElementById('profile-btn')?.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/pages/profile.html';
	});



});