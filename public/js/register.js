console.log("REGISTER JS LOADED");

import { auth, googleProvider } from "/js/firebase-config.js";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

window.addEventListener("DOMContentLoaded", function () {
  const createAccountBtn = document.getElementById("createAccountBtn");
  const googleBtn = document.getElementById("googleBtn");
  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const registerMessage = document.getElementById("registerMessage");

  const goToLogin = (e) => {
    e.preventDefault();
    window.location.href = "/login";
  };

  document.getElementById("loginTab")?.addEventListener("click", goToLogin);
  document.getElementById("loginNowLink")?.addEventListener("click", goToLogin);
  document.getElementById("closeBtn")?.addEventListener("click", () => {
    window.location.href = "/";
  });

  function showMessage(message, isError = true) {
    if (!registerMessage) {
      alert(message);
      return;
    }

    registerMessage.textContent = message;
    registerMessage.className = `text-sm text-center mt-3 ${isError ? "text-red-500" : "text-green-500"}`;
  }

  async function syncUserWithBackend(user, fallbackName = "User") {
    const idToken = await user.getIdToken();
    const fullName = user.displayName || fallbackName || "User";

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        idToken,
        fullName
      })
    });

    const text = await response.text();
    let data = {};

    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    console.log("REGISTER RESPONSE:", response.status, data);

    if (!response.ok && response.status !== 400 && response.status !== 409) {
      throw new Error(
        data.details ||
        data.message ||
        data.error ||
        data.raw ||
        "Database registration failed"
      );
    }
  }

  createAccountBtn?.addEventListener("click", async function (e) {
    e.preventDefault();

    const fullName = fullNameInput?.value.trim();
    const email = emailInput?.value.trim();
    const password = passwordInput?.value;
    const confirmPassword = confirmPasswordInput?.value;

    if (!fullName || !email || !password || !confirmPassword) {
      showMessage("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      localStorage.setItem("pendingFullName", fullName);

      showMessage(
        `Account created. A verification email has been sent to ${email}. Please verify your email before logging in.`,
        false
      );

      await signOut(auth);

      setTimeout(() => {
        window.location.href = "/login";
      }, 1800);
    } catch (error) {
      console.error("Registration error:", error);
      showMessage(error.message || "Registration failed.");
    }
  });

  googleBtn?.addEventListener("click", async function (e) {
    e.preventDefault();

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const fallbackName = fullNameInput?.value.trim() || user.displayName || "Google User";

      await syncUserWithBackend(user, fallbackName);
      localStorage.removeItem("pendingFullName");
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Google Register Error:", error);
      showMessage(error.message || "Google sign up failed.");
    }
  });
});