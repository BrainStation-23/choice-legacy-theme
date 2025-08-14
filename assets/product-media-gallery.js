if (!customElements.get("product-media-gallery")) {
  customElements.define(
    "product-media-gallery",
    class ProductMediaGallery extends HTMLElement {
      constructor() {
        super();
        this.init();
      }

      init() {
        this.thumbnails = this.querySelectorAll(".media-thumbnail");
        this.setupThumbnailClickHandlers();
      }

      setupThumbnailClickHandlers() {
        this.thumbnails.forEach((thumbnail) => {
          thumbnail.addEventListener("click", (event) => {
            event.preventDefault();
            this.showMedia(thumbnail.dataset.mediaId);
          });
        });
      }

      showMedia(mediaId) {
        if (!mediaId) return;

        this.pauseAllMedia();

        // Switch the main media item by toggling utility classes
        this.querySelectorAll(".main-media-item").forEach((item) => {
          const isActive = item.dataset.mediaId === mediaId;
          if (isActive) {
            item.classList.remove("opacity-0", "invisible");
            item.classList.add("opacity-1", "visible");

            if (item.dataset.mediaType === "video") {
              const video = item.querySelector("video");
              if (video)
                video
                  .play()
                  .catch((e) => console.error("Video play failed:", e));
            }
          } else {
            item.classList.remove("opacity-1", "visible");
            item.classList.add("opacity-0", "invisible");
          }
        });

        // Update the active thumbnail by adding/removing your specific border classes
        this.thumbnails.forEach((thumb) => {
          const isActive = thumb.dataset.mediaId === mediaId;
          if (isActive) {
            thumb.classList.add("border-2", "border-solid", "border-brand");
          } else {
            thumb.classList.remove("border-2", "border-solid", "border-brand");
          }
        });
      }

      pauseAllMedia() {
        this.querySelectorAll("video").forEach((video) => video.pause());
        this.querySelectorAll("iframe").forEach((iframe) => {
          const currentSrc = iframe.src;
          iframe.src = "";
          iframe.src = currentSrc.replace("&autoplay=1", "");
        });
      }
    }
  );
}
