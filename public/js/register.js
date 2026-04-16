console.log("REGISTER JS LOADED");

import { auth } from "/js/firebase-config.js";
import { 
    createUserWithEmailAndPassword, 
    sendEmailVerification,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

window.addEventListener("DOMContentLoaded", function () {
    const createAccountBtn = document.getElementById("createAccountBtn");
    const fullNameInput = document.getElementById("fullName");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    // Navigation Logic
    const goToLogin = (e) => {
        e.preventDefault();
        window.location.href = "/login";
    };
    document.getElementById("loginTab")?.addEventListener("click", goToLogin);
    document.getElementById("loginNowLink")?.addEventListener("click", goToLogin);
    document.getElementById("closeBtn")?.addEventListener("click", () => window.location.href = "/");

    if (createAccountBtn) {
        createAccountBtn.addEventListener("click", async function (e) {
            e.preventDefault();

            const fullName = fullNameInput?.value.trim();
            const email = emailInput?.value.trim();
            const password = passwordInput?.value;
            const confirmPassword = confirmPasswordInput?.value;

            if (!fullName || !email || !password || !confirmPassword) {
                alert("Please fill in all fields.");
                return;
            }

            if (password !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }

            try {
                // STEP 1: Create Firebase Account
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // STEP 3: Sync with your PostgreSQL Database via your API
                try {
                    await fetch('/api/register-user', { // Change this to your actual registration endpoint
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            firebase_uid: user.uid,
                            email: user.email,
                            full_name: fullName // This is the value from your input
                        })
                    });
                } catch (dbError) {
                    console.error("Failed to sync to SQL database:", dbError);
                }

                // STEP 2: Send Verification Email
                await sendEmailVerification(user);

                // STEP 3: Store Name Temporarily
                // Since we aren't syncing to SQL yet, we save the name in localStorage 
                // so we can use it when they log in for the first time after verifying.
                localStorage.setItem("pendingFullName", fullName);

                alert("Account created! A verification email has been sent to " + email + ". You MUST verify your email before you can complete registration.");
                
                // STEP 4: Force Logout
                await signOut(auth);
                window.location.href = "/login";

            } catch (error) {
                console.error("Registration error:", error);
                alert(error.message);
            }
        });
    }
});