if (!customElements.get("slideshow-component")) {
  class SlideshowComponent extends HTMLElement {
    constructor() {
      super();
      this.swiper = null;
      this.customBullets = [];
      this.sliderItems = [];
      this.addThemeEditorEvents.bind(this)();
    }

    connectedCallback() {
      this.isSelectedInThemeEditor = false;
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
          loop: true,
          navigation: {
            nextEl: customNextButton,
            prevEl: customPrevButton,
          },
          pagination: false,
          on: {
            slideChange: (swiper) => {
              // Use realIndex for looped sliders, activeIndex for non-looped
              const carouselMode = this.dataset.carouselMode === "true";
              const singleSlideView = this.dataset.singleSlideView === "true";
              const activeIndex =
                carouselMode || singleSlideView
                  ? swiper.activeIndex
                  : swiper.realIndex;
              this.updateCustomBullets(activeIndex);
            },
          },
        };

        if (showProgressBar && this.querySelector(".progress-bar-pagination")) {
          swiperConfig.pagination = {
            el: ".progress-bar-pagination",
            type: "progressbar",
          };
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

          swiperConfig.loop = false; // Loop disabled for carousel mode
          swiperConfig.grabCursor = true;
          swiperConfig.resistanceRatio = 0; // No resistance - prevents bouncing back
          swiperConfig.slidesPerView = "auto";
          swiperConfig.spaceBetween = 16;
          swiperConfig.centeredSlides = false;
          swiperConfig.watchSlidesProgress = true;
          swiperConfig.watchSlidesVisibility = true;

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
          // Regular slideshow mode
          const singleSlideView = this.dataset.singleSlideView === "true";

          if (singleSlideView) {
            // For single slide view, disable loop and bounce-back but keep normal slide configuration
            swiperConfig.loop = false;
            swiperConfig.resistanceRatio = 0; // Prevent bounce-back to beginning
          }

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
        }

        this.swiper = new Swiper(swiperContainer, swiperConfig);

        // Set sliderItems from swiper-wrapper's swiper-slide elements
        const swiperWrapper = swiperContainer.querySelector(".swiper-wrapper");
        this.sliderItems = Array.from(
          swiperWrapper.querySelectorAll(".swiper-slide")
        );
      }
    }

    initializeCustomBullets() {
      this.customBullets = this.querySelectorAll(".custom-bullet");

      this.customBullets.forEach((bullet, index) => {
        bullet.addEventListener("click", () => {
          if (this.swiper) {
            // Use appropriate slide method based on loop setting
            const carouselMode = this.dataset.carouselMode === "true";
            const singleSlideView = this.dataset.singleSlideView === "true";
            if (carouselMode || singleSlideView) {
              this.swiper.slideTo(index); // For non-looped carousel/single slide view
            } else {
              this.swiper.slideToLoop(index); // For looped slideshow
            }
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
    // Add theme editor block selection event listeners
    addThemeEditorEvents() {
      console.log(
        "🚀 ~ SlideshowComponent ~ addThemeEditorEvents ~ addThemeEditorEvents:",
        addThemeEditorEvents
      );
      this.sliderItems.forEach((slide) => {
        slide.addEventListener(
          "shopify:block:select",
          this.handelThemeEditorBlockSelectEvent.bind(this)
        );

        slide.addEventListener(
          "shopify:block:deselect",
          this.handelThemeEditorBlockDeselectEvent.bind(this)
        );
      });
    }

    // Handle block selection event in theme editor
    handelThemeEditorBlockSelectEvent(event) {
      const target = event.target;
      const itemIndex = +target?.dataset?.index + 1;
      console.log(
        "🚀 ~ SlideshowComponent ~ handelThemeEditorBlockSelectEvent ~ itemIndex:",
        itemIndex
      );

      if (this.swiper) {
        // Scroll to the selected slide
        this.swiper.slideTo(itemIndex);

        // // Optionally highlight the selected slide
        // const selectedSlide = this.sliderItems[itemIndex];
        // if (selectedSlide) {
        //   selectedSlide.classList.add("selected-block");
        //   // Remove highlight after a short delay (e.g., 2 seconds)
        //   setTimeout(() => {
        //     selectedSlide.classList.remove("selected-block");
        //   }, 2000);
        // }
      }
      this.isSelectedInThemeEditor = true;
    }

    handelThemeEditorBlockDeselectEvent() {
      this.isSelectedInThemeEditor = false;
    }
  }

  customElements.define("slideshow-component", SlideshowComponent);
}
