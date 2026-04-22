import { auth, googleProvider } from "/js/firebase-config.js";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

window.addEventListener("DOMContentLoaded", function () {
  const loginBtn = document.getElementById("loginBtn");
  const googleBtn = document.getElementById("googleBtn");
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
      alert("Please enter your email and password.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        alert("Your email is not verified. Please click the link in your email to activate your account.");
        await signOut(auth);
        return;
      }

      await syncUserWithBackend(user, "User");
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login Error:", error);
      alert("Login failed: " + (error.message || "Unknown error"));
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
      alert("Google login failed: " + (error.message || "Unknown error"));
    }
  });
});