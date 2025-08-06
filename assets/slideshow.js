if (!customElements.get("slideshow-component")) {
  class SlideshowComponent extends HTMLElement {
    constructor() {
      super();
      this.swiper = null;
      this.customBullets = [];
    }

    connectedCallback() {
      this.initializeSwiper();
      this.initializeCustomBullets();
    }

    disconnectedCallback() {
      if (this.swiper) {
        this.swiper.destroy();
      }
    }

    initializeSwiper() {
      const swiperContainer = this.querySelector(".swiper-container");

      if (swiperContainer) {
        const autoplayEnabled = this.dataset.autoplay === "true";
        const autoplayDelay = parseInt(this.dataset.autoplayDelay) || 3000;
        const pauseOnHover = this.dataset.pauseOnHover === "true";
        const showPartialSlides = this.dataset.showPartialSlides === "true";
        const showProgressBar = this.dataset.showProgressBar === "true";
        const carouselMode = this.dataset.carouselMode === "true";

        const slidesPerViewForFullSlides =
          parseInt(this.dataset.slidesPerViewDesktop) || 1;

        const customNextButton = this.querySelector(
          ".slideshow-nav-button-next"
        );
        const customPrevButton = this.querySelector(
          ".slideshow-nav-button-prev"
        );

        const swiperConfig = {
          loop: false,
          navigation: false,
          pagination: false,
          resistance: true,
          resistanceRatio: 0.85,
          on: {
            slideChange: (swiper) => {
              this.updateCustomBullets(swiper.realIndex);
            },
            touchMove: (swiper, event) => {
              // Track if user is dragging beyond boundaries
              const touchCurrentX = event.touches
                ? event.touches[0].clientX
                : event.clientX;
              const touchStartX = swiper.touchStartX || touchCurrentX;
              const dragDistance = touchCurrentX - touchStartX;
              const threshold = 100; // Large threshold for very deliberate action

              // Store intent to loop based on strong drag beyond boundary
              // FIXED: At END + drag RIGHT (positive) = go to START
              if (
                swiper.activeIndex === swiper.slides.length - 1 &&
                dragDistance > threshold
              ) {
                swiper.intentToLoopToStart = true;
                swiper.intentToLoopToEnd = false;
                // FIXED: At START + drag LEFT (negative) = go to END
              } else if (
                swiper.activeIndex === 0 &&
                dragDistance < -threshold
              ) {
                swiper.intentToLoopToEnd = true;
                swiper.intentToLoopToStart = false;
              } else {
                // Reset intent if drag becomes less aggressive
                swiper.intentToLoopToStart = false;
                swiper.intentToLoopToEnd = false;
              }
            },
            touchEnd: (swiper, event) => {
              // Only loop if there was clear intent during the drag
              if (swiper.intentToLoopToStart) {
                // From END to START
                setTimeout(() => {
                  swiper.slideTo(0, 600);
                }, 200);
              } else if (swiper.intentToLoopToEnd) {
                // From START to END
                setTimeout(() => {
                  swiper.slideTo(swiper.slides.length - 1, 600);
                }, 200);
              }

              // Reset intent flags
              swiper.intentToLoopToStart = false;
              swiper.intentToLoopToEnd = false;
            },
            touchStart: (swiper, event) => {
              // Store the starting touch position
              swiper.touchStartX = event.touches
                ? event.touches[0].clientX
                : event.clientX;
              swiper.intentToLoopToStart = false;
              swiper.intentToLoopToEnd = false;
            },
            transitionEnd: (swiper) => {
              // Update bullets after any transition completes
              this.updateCustomBullets(swiper.activeIndex);
            },
          },
        };

        if (showProgressBar && this.querySelector(".progress-bar-pagination")) {
          swiperConfig.pagination = {
            el: ".progress-bar-pagination",
            type: "progressbar",
            clickable: true,
          };

          // Add click handler for progress bar looping
          const progressBar = this.querySelector(".progress-bar-pagination");
          if (progressBar) {
            progressBar.addEventListener("click", (e) => {
              const rect = progressBar.getBoundingClientRect();
              const clickPosition = (e.clientX - rect.left) / rect.width;
              const totalSlides = this.swiper.slides.length;
              const targetSlide = Math.floor(clickPosition * totalSlides);

              // Handle wraparound if clicking near the edges
              if (targetSlide >= totalSlides) {
                this.swiper.slideTo(0, 400);
              } else if (targetSlide < 0) {
                this.swiper.slideTo(totalSlides - 1, 400);
              } else {
                this.swiper.slideTo(targetSlide);
              }
            });
          }
        }

        // Carousel mode configuration
        if (carouselMode) {
          swiperConfig.freeMode = {
            enabled: true,
            sticky: false,
            momentumRatio: 1,
            momentumVelocityRatio: 1,
            momentumBounceRatio: 1,
          };

          // Enhanced carousel mode with gentle looping
          swiperConfig.grabCursor = true;
          swiperConfig.resistanceRatio = 0.85;
          swiperConfig.slidesPerView = "auto";
          swiperConfig.spaceBetween = 16;
          swiperConfig.centeredSlides = false;

          // Override the touchMove handler specifically for carousel mode
          const originalTouchMove = swiperConfig.on.touchMove;
          swiperConfig.on.touchMove = (swiper, event) => {
            const touchCurrentX = event.touches
              ? event.touches[0].clientX
              : event.clientX;
            const touchStartX = swiper.touchStartX || touchCurrentX;
            const dragDistance = touchCurrentX - touchStartX;
            const threshold = 150; // Very high threshold for carousel mode

            // Check if we're at the actual end (last slide)
            const isAtActualEnd =
              swiper.activeIndex === swiper.slides.length - 1;

            // FIXED: When at END and user drags RIGHT (positive dragDistance)
            // = user wants to go to START (wrap around)
            if (isAtActualEnd && dragDistance > threshold) {
              swiper.intentToLoopToStart = true;
              swiper.intentToLoopToEnd = false;
            }
            // FIXED: When at START and user drags LEFT (negative dragDistance)
            // = user wants to go to END (wrap around backwards)
            else if (swiper.activeIndex === 0 && dragDistance < -threshold) {
              swiper.intentToLoopToEnd = true;
              swiper.intentToLoopToStart = false;
            } else {
              // Reset intent if drag is not strong enough or not at boundaries
              swiper.intentToLoopToStart = false;
              swiper.intentToLoopToEnd = false;
            }
          };

          // Override the touchEnd handler specifically for carousel mode
          const originalTouchEnd = swiperConfig.on.touchEnd;
          swiperConfig.on.touchEnd = (swiper, event) => {
            if (swiper.intentToLoopToStart) {
              // From END to START
              setTimeout(() => {
                swiper.setTransition(600);
                swiper.slideTo(0);
              }, 300);
            } else if (swiper.intentToLoopToEnd) {
              // From START to END
              setTimeout(() => {
                swiper.setTransition(600);
                swiper.slideTo(swiper.slides.length - 1);
              }, 300);
            }

            swiper.intentToLoopToStart = false;
            swiper.intentToLoopToEnd = false;
          };

          swiperConfig.breakpoints = {
            320: {
              slidesPerView: "auto",
              spaceBetween: 12,
            },
            768: {
              slidesPerView: "auto",
              spaceBetween: 16,
            },
            1024: {
              slidesPerView: "auto",
              spaceBetween: 20,
            },
          };

          const slideWidthMobile = this.dataset.slideWidthMobile || "220px";
          const slideWidthTablet = this.dataset.slideWidthTablet || "240px";
          const slideWidthDesktop = this.dataset.slideWidthDesktop || "268px";

          if (!document.querySelector("#carousel-mode-styles")) {
            const style = document.createElement("style");
            style.id = "carousel-mode-styles";
            style.textContent = `
              .swiper-container[data-carousel-mode="true"] .swiper-slide {
                width: auto !important;
                margin-right: 0 !important;
              }
              
              .swiper-container[data-carousel-mode="true"] .product-video-item {
                width: var(--slide-width-mobile, 220px);
                flex-shrink: 0;
              }
              
              @media screen and (min-width: 768px) {
                .swiper-container[data-carousel-mode="true"] .product-video-item {
                  width: var(--slide-width-tablet, 240px);
                }
              }
              
              @media screen and (min-width: 1024px) {
                .swiper-container[data-carousel-mode="true"] .product-video-item {
                  width: var(--slide-width-desktop, 268px);
                }
              }
            `;
            document.head.appendChild(style);
          }

          swiperContainer.style.setProperty(
            "--slide-width-mobile",
            slideWidthMobile
          );
          swiperContainer.style.setProperty(
            "--slide-width-tablet",
            slideWidthTablet
          );
          swiperContainer.style.setProperty(
            "--slide-width-desktop",
            slideWidthDesktop
          );
          swiperContainer.setAttribute("data-carousel-mode", "true");
        } else {
          swiperConfig.slidesPerView = slidesPerViewForFullSlides;
          swiperConfig.spaceBetween = 16;
          swiperConfig.centeredSlides = false;

          swiperConfig.breakpoints = {
            769: {
              slidesPerView: showPartialSlides
                ? 1.2
                : slidesPerViewForFullSlides,
              spaceBetween: showPartialSlides ? 20 : 16,
              centeredSlides: showPartialSlides,
            },
          };

          swiperContainer.removeAttribute("data-carousel-mode");
        }

        if (autoplayEnabled) {
          swiperConfig.autoplay = {
            delay: autoplayDelay,
            disableOnInteraction: false,
            pauseOnMouseEnter: pauseOnHover,
          };

          // Enhanced autoplay with looping
          const originalAutoplayConfig = swiperConfig.on.slideChange;
          swiperConfig.on.slideChange = (swiper) => {
            originalAutoplayConfig(swiper);

            // If autoplay reaches the end, loop to beginning
            if (swiper.activeIndex === swiper.slides.length - 1) {
              setTimeout(() => {
                swiper.slideTo(0, 800);
              }, autoplayDelay);
            }
          };
        }

        this.swiper = new Swiper(swiperContainer, swiperConfig);

        // Setup manual navigation (keeping existing behavior)
        if (customNextButton) {
          customNextButton.addEventListener("click", () => {
            if (this.swiper.activeIndex === this.swiper.slides.length - 1) {
              // At last slide, slide back to first
              this.swiper.slideTo(0, 800);
            } else {
              // Normal next slide
              this.swiper.slideNext();
            }
          });
        }

        if (customPrevButton) {
          customPrevButton.addEventListener("click", () => {
            if (this.swiper.activeIndex === 0) {
              // At first slide, slide to last
              this.swiper.slideTo(this.swiper.slides.length - 1, 800);
            } else {
              // Normal prev slide
              this.swiper.slidePrev();
            }
          });
        }
      }
    }

    initializeCustomBullets() {
      this.customBullets = this.querySelectorAll(".custom-bullet");

      this.customBullets.forEach((bullet, index) => {
        bullet.addEventListener("click", () => {
          if (this.swiper) {
            // Use slideTo instead of slideToLoop for consistent behavior
            this.swiper.slideTo(index);
          }
        });
      });

      this.updateCustomBullets(0);
    }

    updateCustomBullets(activeIndex) {
      this.customBullets.forEach((bullet, index) => {
        if (index === activeIndex) {
          bullet.classList.add("active");
        } else {
          bullet.classList.remove("active");
        }
      });
    }
  }

  customElements.define("slideshow-component", SlideshowComponent);
}
