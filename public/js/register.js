console.log("REGISTER JS LOADED");

import { auth } from "/js/firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

window.addEventListener("DOMContentLoaded", function () {
    // 1. Link HTML Elements
    const closeBtn = document.getElementById("closeBtn");
    const loginTab = document.getElementById("loginTab");
    const loginNowLink = document.getElementById("loginNowLink");
    const createAccountBtn = document.getElementById("createAccountBtn");

    const fullNameInput = document.getElementById("fullName");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    // 2. Navigation Logic
    if (closeBtn) {
        closeBtn.addEventListener("click", () => window.location.href = "/");
    }

    const goToLogin = (e) => {
        e.preventDefault();
        window.location.href = "/login";
    };

    if (loginTab) loginTab.addEventListener("click", goToLogin);
    if (loginNowLink) loginNowLink.addEventListener("click", goToLogin);

    // 3. Main Registration Logic
    if (createAccountBtn) {
        createAccountBtn.addEventListener("click", async function (e) {
            e.preventDefault();
            console.log("Create Account Button Clicked");

            // Get Input Values
            const fullName = fullNameInput?.value.trim();
            const email = emailInput?.value.trim();
            const password = passwordInput?.value;
            const confirmPassword = confirmPasswordInput?.value;

            // --- VALIDATION ---
            if (!fullName || !email || !password || !confirmPassword) {
                alert("Please fill in all fields.");
                return;
            }

            if (password !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }

            if (password.length < 6) {
                alert("Password must be at least 6 characters.");
                return;
            }

            try {
                // --- STEP 1: FIREBASE AUTH ---
                console.log("Creating Firebase user...");
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                console.log("Firebase user created! UID:", user.uid);

                // --- STEP 2: GET ID TOKEN ---
                // We need this token so the backend can verify the request is real
                const idToken = await user.getIdToken();

                // --- STEP 3: BACKEND SQL SYNC ---
                console.log("Syncing with Google Cloud SQL...");
                const response = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        idToken: idToken,
                        fullName: fullName 
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || data.message || "Failed to save profile to database.");
                }

                // --- SUCCESS STATE ---
                alert("Success! Account created. Redirecting to your dashboard...");
                
                // Direct redirect to dashboard
                window.location.href = "/dashboard";

            } catch (error) {
                console.error("Registration error:", error);
                
                // Specific Firebase Error Handling
                if (error.code === 'auth/email-already-in-use') {
                    alert("Error: That email is already registered.");
                } else if (error.code === 'auth/invalid-email') {
                    alert("Error: The email address is badly formatted.");
                } else {
                    alert("Registration failed: " + (error.message || "Please try again later."));
                }
            }
        });
    }
});