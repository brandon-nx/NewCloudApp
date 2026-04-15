import { auth } from "/js/firebase-config.js";
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

window.addEventListener("DOMContentLoaded", function () {
    const loginBtn = document.getElementById("loginBtn");

    if (loginBtn) {
        loginBtn.addEventListener("click", async function (e) {
            e.preventDefault();

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            try {
                // 1. Firebase Login Attempt
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // 2. THE VERIFICATION GATE
                if (!user.emailVerified) {
                    alert("Your email is not verified. Please click the link in your email to activate your account.");
                    await signOut(auth); // Kick them out
                    return;
                }

                // 3. Get Token for Backend
                const idToken = await user.getIdToken();

                // 4. SQL SYNC (The "Final" Registration)
                // We send the fullName from localStorage if it exists (first-time login)
                const fullName = localStorage.getItem("pendingFullName") || "User";

                console.log("Verified! Syncing with Database...");
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        idToken,
                        fullName: fullName 
                    })
                });

                if (response.ok) {
                    localStorage.removeItem("pendingFullName"); // Clean up
                    window.location.href = "/dashboard";
                } else {
                    const errorData = await response.json();
                    // If user already exists in SQL, it might return 400/409, 
                    // in which case we just proceed to dashboard anyway.
                    window.location.href = "/dashboard";
                }

            } catch (error) {
                console.error("Login Error:", error.message);
                alert("Login failed: " + error.message);
            }
        });
    }
});