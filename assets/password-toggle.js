document.querySelectorAll(".toggle-password").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const targetId = toggle.dataset.target;
    const input = document.getElementById(targetId);
    const openEye = document.getElementById(`password-toggle-eye-open-${targetId}`);
    const closeEye = document.getElementById(`password-toggle-eye-close-${targetId}`);

    if (!input) return;

    if (input.type === "password") {
      input.type = "text";
      if (openEye) openEye.style.display = "none";
      if (closeEye) closeEye.style.display = "flex";
    } else {
      input.type = "password";
      if (openEye) openEye.style.display = "flex";
      if (closeEye) closeEye.style.display = "none";
    }
  });
});
