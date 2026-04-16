import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function () {
    // 1. Navigation
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = '/profile'; // Use the route name, not the file name
        });
    }

    // 2. Counter Setup logic
    function setupCounter(minusId, plusId, valId, step) {
        const minusBtn = document.getElementById(minusId);
        const plusBtn = document.getElementById(plusId);
        const valSpan = document.getElementById(valId);

        if (minusBtn && plusBtn && valSpan) {
            plusBtn.onclick = () => {
                let current = parseFloat(valSpan.innerText) || 0;
                valSpan.innerText = (current + step).toString();
            };
            minusBtn.onclick = () => {
                let current = parseFloat(valSpan.innerText) || 0;
                if (current > 0) valSpan.innerText = Math.max(0, current - step).toString();
            };
        }
    }

    setupCounter('sleep-minus', 'sleep-plus', 'sleep-val', 0.5);
    setupCounter('exercise-minus', 'exercise-plus', 'exercise-val', 5);
    setupCounter('study-minus', 'study-plus', 'study-val', 0.5);
    setupCounter('water-minus', 'water-plus', 'water-val', 250);

    // 3. Save Logic
    const saveBtn = document.getElementById('save-goals-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log("Saving goals...");

            const user = auth.currentUser;
            if (!user) return alert("Session expired. Please log in again.");

            const goalsToUpdate = [
                { id: 1, val: parseFloat(document.getElementById('sleep-val').innerText) },
                { id: 2, val: parseFloat(document.getElementById('exercise-val').innerText) },
                { id: 3, val: parseFloat(document.getElementById('study-val').innerText) },
                { id: 4, val: parseFloat(document.getElementById('water-val').innerText) }
            ];

            try {
                const token = await user.getIdToken();
                const response = await fetch('/api/goals/update-goals', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ goals: goalsToUpdate })
                });

                if (response.ok) {
                    alert("✅ Goals saved to your profile!");
                    window.location.href = '/profile';
                } else {
                    alert("❌ Failed to save goals.");
                }
            } catch (error) {
                console.error("Save failed:", error);
            }
        });
    }

    // 4. Authentication and Loading Logic
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("Authenticated:", user.email);
            try {
                const token = await user.getIdToken();
                const response = await fetch(`/api/goals/my-targets`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const goals = await response.json();
                    if (goals["1"]) document.getElementById('sleep-val').innerText = goals["1"];
                    if (goals["2"]) document.getElementById('exercise-val').innerText = goals["2"];
                    if (goals["3"]) document.getElementById('study-val').innerText = goals["3"];
                    if (goals["4"]) document.getElementById('water-val').innerText = goals["4"];
                }
            } catch (e) { 
                console.log("No existing goals found, using defaults."); 
            }
        } else {
            window.location.href = "/login";
        }
    });
    
});