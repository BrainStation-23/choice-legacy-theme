if (!customElements.get("product-media-gallery")) {
  customElements.define(
    "product-media-gallery",
    class ProductMediaGallery extends HTMLElement {
      constructor() {
        super();
        this.swiper = null;
        this.init();
      }

      init() {
        this.thumbnails = this.querySelectorAll(".media-thumbnail");
        this.setupThumbnailClickHandlers();
        this.initSwiper();
      }

      initSwiper() {
        let retries = 0;
        const maxRetries = 50; // Try for 5 seconds (50 * 100ms)

        const initSwiperWhenReady = () => {
          if (typeof Swiper !== "undefined") {
            this.swiper = new Swiper(
              this.querySelector(".product-media-swiper"),
              {
                // ... your existing Swiper config ...
                slidesPerView: 1,
                spaceBetween: 0,
                loop: false,
                allowTouchMove: false,
                navigation: {
                  nextEl: ".slideshow-nav-button-next",
                  prevEl: ".slideshow-nav-button-prev",
                },
                pagination: {
                  el: ".swiper-pagination",
                  clickable: true,
                  dynamicBullets: true,
                },
                lazy: {
                  loadPrevNext: true,
                  loadPrevNextAmount: 2,
                },
                on: {
                  slideChange: () => {
                    this.pauseAllMedia();
                    this.updateActiveThumbnail();
                    this.playCurrentSlideVideo();
                  },
                  transitionStart: () => {
                    this.pauseAllMedia();
                  },
                },
                watchOverflow: true,
                observer: true,
                observeParents: true,
              }
            );

            // Announce that the gallery is ready for commands
            this.dispatchEvent(
              new CustomEvent("gallery:ready", { bubbles: true })
            );
          } else {
            retries++;
            if (retries < maxRetries) {
              // Retry after a short delay if Swiper is not ready
              setTimeout(initSwiperWhenReady, 100);
            } else {
              console.error(
                "Product Media Gallery: Swiper library did not load in time."
              );
            }
          }
        };

        initSwiperWhenReady();
      }

      setupThumbnailClickHandlers() {
        this.thumbnails.forEach((thumbnail, index) => {
          thumbnail.addEventListener("click", (event) => {
            event.preventDefault();
            this.showMedia(thumbnail.dataset.mediaId, index);
          });
        });
      }

      showMedia(mediaId, slideIndex = null) {
        if (!mediaId) return;

        // If slideIndex is provided, use it; otherwise find the slide
        if (slideIndex !== null) {
          if (this.swiper) {
            this.swiper.slideTo(slideIndex);
          }
        } else {
          // Find the slide index by media ID
          const slides = this.querySelectorAll(".swiper-slide");
          slides.forEach((slide, index) => {
            if (slide.dataset.mediaId === mediaId) {
              if (this.swiper) {
                this.swiper.slideTo(index);
              }
            }
          });
        }

        this.updateActiveThumbnail(mediaId);
      }

      updateActiveThumbnail(mediaId = null) {
        // If no mediaId provided, get current slide's mediaId
        if (!mediaId && this.swiper) {
          const currentSlide = this.swiper.slides[this.swiper.activeIndex];
          mediaId = currentSlide?.dataset.mediaId;
        }

        // Update thumbnail active state
        this.thumbnails.forEach((thumb) => {
          const isActive = thumb.dataset.mediaId === mediaId;
          if (isActive) {
            thumb.classList.add("border-2", "border-solid", "border-brand");
          } else {
            thumb.classList.remove("border-2", "border-solid", "border-brand");
          }
        });
      }

      playCurrentSlideVideo() {
        if (!this.swiper) return;

        const currentSlide = this.swiper.slides[this.swiper.activeIndex];
        if (currentSlide && currentSlide.dataset.mediaType === "video") {
          const video = currentSlide.querySelector("video");
          if (video) {
            video.play().catch((e) => console.error("Video play failed:", e));
          }
        }
      }

      pauseAllMedia() {
        this.querySelectorAll("video").forEach((video) => video.pause());
        this.querySelectorAll("iframe").forEach((iframe) => {
          const currentSrc = iframe.src;
          if (
            currentSrc.includes("youtube.com") ||
            currentSrc.includes("vimeo.com")
          ) {
            iframe.src = "";
            iframe.src = currentSrc.replace("&autoplay=1", "");
          }
        });
      }

      // Public methods for external control
      nextSlide() {
        if (this.swiper) this.swiper.slideNext();
      }

      prevSlide() {
        if (this.swiper) this.swiper.slidePrev();
      }

      goToSlide(index) {
        if (this.swiper) this.swiper.slideTo(index);
      }

      // Method to be called by variant picker
      setActiveMediaById(mediaId) {
        if (!mediaId || !this.swiper) return false;

        const slides = this.querySelectorAll(".swiper-slide");
        let targetIndex = -1;

        slides.forEach((slide, index) => {
          if (slide.dataset.mediaId === mediaId.toString()) {
            targetIndex = index;
          }
        });

        if (targetIndex !== -1) {
          this.swiper.slideTo(targetIndex);
          this.updateActiveThumbnail(mediaId.toString());
          return true;
        }

        return false;
      }

      // Cleanup when element is removed
      disconnectedCallback() {
        if (this.swiper) {
          this.swiper.destroy();
        }
      }
    }
  );
}
