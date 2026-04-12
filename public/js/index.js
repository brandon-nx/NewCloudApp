window.addEventListener("DOMContentLoaded", function () {
  const getStartedBtn = document.getElementById("getStartedBtn");
  const signInBtn = document.getElementById("signInBtn");

  if (getStartedBtn) {
    getStartedBtn.addEventListener("click", function () {
      window.location.href = "/register";
    });
  }

  if (signInBtn) {
    signInBtn.addEventListener("click", function () {
      window.location.href = "/login";
    });
  }
});