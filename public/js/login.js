import { auth } from "/js/firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

window.addEventListener("DOMContentLoaded", function () {
  const loginBtn = document.getElementById("loginBtn");

  if (loginBtn) {
    console.log("✅ Login button found!");
    
    loginBtn.addEventListener("click", async function (e) {
      e.preventDefault();
      
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      if (!email || !password) {
        alert("Please enter both email and password");
        return;
      }

      try {
        console.log("Attempting Firebase Login...");
        
        // 1. Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Firebase Auth Success! UID:", user.uid);

        // 2. Get the Token for the Backend
        const idToken = await user.getIdToken();

        // 3. Sync with Cloud SQL (Updates last_login column)
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });

        if (response.ok) {
          console.log("Cloud SQL Sync Successful!");
          alert("Login successful!");
          window.location.href = "/dashboard";
        } else {
          const errorData = await response.json();
          alert("Database Error: " + (errorData.error || "Failed to update login time"));
        }
      } catch (error) {
        console.error("Login Error:", error.message);
        alert("Login failed: " + error.message);
      }
    });
  } else {
    console.error("❌ Could not find button with ID 'loginBtn'");
  }
});

// window.addEventListener("DOMContentLoaded", function () {
//   const closeBtn = document.getElementById("closeBtn");
//   const signUpTab = document.getElementById("signUpTab");
//   const signUpNowLink = document.getElementById("signUpNowLink");
//   const signInBtn = document.getElementById("signInBtn");

//   if (closeBtn) {
//     closeBtn.addEventListener("click", function () {
//       window.location.href = "/";
//     });
//   }

//   if (signUpTab) {
//     signUpTab.addEventListener("click", function (e) {
//       e.preventDefault();
//       window.location.href = "/register";
//     });
//   }

//   if (signUpNowLink) {
//     signUpNowLink.addEventListener("click", function (e) {
//       e.preventDefault();
//       window.location.href = "/register";
//     });
//   }

//   if (signInBtn) {
//     signInBtn.addEventListener("click", function () {
//       console.log("Sign In button clicked");
//     });
//   }
// });