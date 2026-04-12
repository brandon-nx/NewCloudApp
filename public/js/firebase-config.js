import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCGM_XgttKSThQIi-Xmz6mL93T11lxdjfs",
  authDomain: "cloud-habit-tracker-fc4c6.firebaseapp.com",
  projectId: "cloud-habit-tracker-fc4c6",
  storageBucket: "cloud-habit-tracker-fc4c6.firebasestorage.app",
  messagingSenderId: "363988694379",
  appId: "1:363988694379:web:dbc470ffcd845128b1482e",
  measurementId: "G-26211MTF8G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth so register.js and login.js can use it
export const auth = getAuth(app);