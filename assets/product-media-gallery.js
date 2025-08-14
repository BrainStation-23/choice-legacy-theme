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

        // Add a small delay to prevent a flash of unstyled content
        setTimeout(() => {
          this.classList.add("loaded");
        }, 100);
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

        // Switch the main media item
        this.querySelectorAll(".main-media-item").forEach((item) => {
          const isActive = item.dataset.mediaId === mediaId;
          item.classList.toggle("active", isActive);

          if (isActive) {
            // Optional: Auto-play native videos when they become active
            if (item.dataset.mediaType === "video") {
              const video = item.querySelector("video");
              if (video)
                video
                  .play()
                  .catch((e) => console.error("Video play failed:", e));
            }
          }
        });

        // Update the active thumbnail
        this.thumbnails.forEach((thumb) => {
          thumb.classList.toggle("active", thumb.dataset.mediaId === mediaId);
        });
      }

      pauseAllMedia() {
        this.querySelectorAll("video").forEach((video) => video.pause());
        this.querySelectorAll("iframe").forEach((iframe) => {
          const currentSrc = iframe.src;
          // This re-setting of the src is the most reliable way to stop embedded videos
          iframe.src = "";
          iframe.src = currentSrc.replace("&autoplay=1", "");
        });
      }
    }
  );
}
