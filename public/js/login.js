import { auth, googleProvider } from "/js/firebase-config.js";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

window.addEventListener("DOMContentLoaded", function () {
  const loginBtn = document.getElementById("loginBtn");
  const googleBtn = document.getElementById("googleBtn");
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  const loginMessage = document.getElementById("loginMessage");
  const closeBtn = document.getElementById("closeBtn");
  const signUpTab = document.getElementById("signUpTab");
  const signUpNowLink = document.getElementById("signUpNowLink");

  closeBtn?.addEventListener("click", () => {
    window.location.href = "/";
  });

  signUpTab?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/register";
  });

  signUpNowLink?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/register";
  });

  function showMessage(message, isError = true) {
    if (!loginMessage) {
      alert(message);
      return;
    }

    loginMessage.textContent = message;
    loginMessage.className = `text-sm text-center mt-2 ${isError ? "text-red-500" : "text-green-500"}`;
  }

  async function syncUserWithBackend(user, fallbackName = "User") {
    const idToken = await user.getIdToken();
    const username =
      user.displayName ||
      localStorage.getItem("pendingFullName") ||
      fallbackName ||
      "User";

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        idToken,
        username
      })
    });

    const text = await response.text();
    let data = {};

    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    console.log("LOGIN RESPONSE:", response.status, data);

    if (!response.ok && response.status !== 400 && response.status !== 409) {
      throw new Error(
        data.details ||
        data.message ||
        data.error ||
        data.raw ||
        "Failed to sync account with database."
      );
    }

    localStorage.removeItem("pendingFullName");
  }

  loginBtn?.addEventListener("click", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;

    if (!email || !password) {
      showMessage("Please enter your email and password.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        showMessage("Your email is not verified. Please click the link in your email to activate your account.");
        await signOut(auth);
        return;
      }

      await syncUserWithBackend(user, "User");
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login Error:", error);
      showMessage("Login failed: " + (error.message || "Unknown error"));
    }
  });

  googleBtn?.addEventListener("click", async function (e) {
    e.preventDefault();

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      await syncUserWithBackend(user, user.displayName || "Google User");
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Google Login Error:", error);
      showMessage("Google login failed: " + (error.message || "Unknown error"));
    }
  });

  forgotPasswordLink?.addEventListener("click", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email")?.value.trim();

    if (!email) {
      showMessage("Please enter your email first, then tap Forgot password.");
      return;
    }

    try {
      auth.useDeviceLanguage();

      await sendPasswordResetEmail(auth, email);

      showMessage("If this email is registered, a password reset link has been sent.", false);
    } catch (error) {
      console.error("Forgot Password Error:", error);
      showMessage(error.message || "Failed to send password reset email.");
    }
  });
});