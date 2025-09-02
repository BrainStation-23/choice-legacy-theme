class ToastNotificationManager {
  constructor() {
    this.successToastWrapper = document.getElementById("success-toast-wrapper");
    this.errorToastWrapper = document.getElementById("error-toast-wrapper");

    this.successToastText = this.successToastWrapper
      ? this.successToastWrapper.querySelector(".toast-text")
      : null;
    this.errorToastText = this.errorToastWrapper
      ? this.errorToastWrapper.querySelector(".toast-text")
      : null;
  }

  show(message, type = "success", duration = 3000) {
    let targetToastWrapper = null;
    let targetToastText = null;

    this.hideAllToastsImmediate();

    if (type === "success" && this.successToastWrapper) {
      targetToastWrapper = this.successToastWrapper;
      targetToastText = this.successToastText;
    } else if (type === "error" && this.errorToastWrapper) {
      targetToastWrapper = this.errorToastWrapper;
      targetToastText = this.errorToastText;
    } else {
      return;
    }

    if (targetToastText) {
      targetToastText.textContent = message;
    }

    targetToastWrapper.style.display = "flex";

    // First add "show" after a short delay
    setTimeout(() => {
      targetToastWrapper.classList.add("show");

      // Now start hide timer only AFTER showing
      setTimeout(() => {
        targetToastWrapper.classList.remove("show");
        targetToastWrapper.addEventListener(
          "transitionend",
          () => {
            targetToastWrapper.style.display = "none";
          },
          { once: true }
        );
      }, duration);
    }, 50);
  }

  hideAllToastsImmediate() {
    if (this.successToastWrapper) {
      this.successToastWrapper.classList.remove("show");
      this.successToastWrapper.style.display = "none";
    }
    if (this.errorToastWrapper) {
      this.errorToastWrapper.classList.remove("show");
      this.errorToastWrapper.style.display = "none";
    }
  }
}

window.toast = new ToastNotificationManager();

document.addEventListener("DOMContentLoaded", () => {
  const toastArea = document.getElementById("toast-area");

  if (toastArea && toastArea.dataset.showToast === "true") {
    const message = toastArea.dataset.message;
    const type = toastArea.dataset.type || "success";
    const duration = parseInt(toastArea.dataset.duration, 10) || 3000;

    if (message) {
      window.toast.show(message, type, duration);
    }
  }
});
