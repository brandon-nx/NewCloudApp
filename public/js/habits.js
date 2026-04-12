	// Top tab bar navigation
	document.getElementById('tab-habits')?.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/pages/habits.html';
	});
	document.getElementById('tab-sleep')?.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/pages/sleepLog.html';
	});
	document.getElementById('tab-exercise')?.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/pages/exerciseLog.html';
	});
	document.getElementById('tab-study')?.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/pages/studyLog.html';
	});
	document.getElementById('tab-water')?.addEventListener('click', function (e) {
		e.preventDefault();
		window.location.href = '/pages/waterLog.html';
	});
// sleepLog.js
// Move menu and button click handlers here in next steps.

document.addEventListener('DOMContentLoaded', function () {
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