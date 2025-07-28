document.addEventListener("DOMContentLoaded", function () {
  // Handle menu toggles
  const menuToggles = document.querySelectorAll(".footer__menu-toggle");
  menuToggles.forEach((toggle) => {
    toggle.addEventListener("click", function () {
      const isExpanded = this.getAttribute("aria-expanded") === "true";
      const targetId = this.getAttribute("aria-controls");
      const targetMenu = document.getElementById(targetId);

      this.setAttribute("aria-expanded", !isExpanded);
      if (!isExpanded) {
        targetMenu.style.maxHeight = targetMenu.scrollHeight + "px";
        this.classList.add("expanded");
      } else {
        targetMenu.style.maxHeight = "0";
        this.classList.remove("expanded");
      }
    });
  });

  // Handle social toggle
  const socialToggle = document.querySelector(".footer__social-toggle");
  if (socialToggle) {
    socialToggle.addEventListener("click", function () {
      const isExpanded = this.getAttribute("aria-expanded") === "true";
      const targetMenu = document.getElementById("social-menu");

      this.setAttribute("aria-expanded", !isExpanded);
      if (!isExpanded) {
        targetMenu.style.maxHeight = targetMenu.scrollHeight + "px";
        this.classList.add("expanded");
      } else {
        targetMenu.style.maxHeight = "0";
        this.classList.remove("expanded");
      }
    });
  }
});
