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
	navigateTo('back-btn', 'profile.html');
	navigateTo('save-goals-btn', 'profile.html');
});

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