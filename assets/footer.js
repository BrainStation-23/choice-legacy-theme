document.addEventListener("DOMContentLoaded", function () {
  const menuToggles = document.querySelectorAll(".footer__menu-toggle");
  menuToggles.forEach((toggle) => {
    toggle.addEventListener("click", function () {
      const isExpanded = this.getAttribute("aria-expanded") === "true";
      const targetId = this.getAttribute("aria-controls");
      const targetMenu = document.getElementById(targetId);

      if (!targetMenu) {
        console.error("Target menu not found:", targetId);
        return;
      }

      this.setAttribute("aria-expanded", !isExpanded);
      if (!isExpanded) {
        targetMenu.style.maxHeight = targetMenu.scrollHeight + "px";
        targetMenu.classList.add("expanded");
        this.classList.add("expanded");
      } else {
        targetMenu.style.maxHeight = "0";
        targetMenu.classList.remove("expanded");
        this.classList.remove("expanded");
      }
    });
  });
});
