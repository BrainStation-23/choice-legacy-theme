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
          loop: true,
          navigation: {
            nextEl: customNextButton,
            prevEl: customPrevButton,
          },
          pagination: false,
          on: {
            slideChange: (swiper) => {
              this.updateCustomBullets(swiper.realIndex);
            },
          },
        };

        if (showProgressBar && this.querySelector(".custom-pagination")) {
          swiperConfig.pagination = {
            el: ".custom-pagination",
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

          swiperConfig.loop = false;
          swiperConfig.grabCursor = true;
          swiperConfig.resistanceRatio = 0.85;
          swiperConfig.slidesPerView = "auto";
          swiperConfig.spaceBetween = 16;
          swiperConfig.centeredSlides = false;

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
        }

        this.swiper = new Swiper(swiperContainer, swiperConfig);
      }
    }

    initializeCustomBullets() {
      this.customBullets = this.querySelectorAll(".custom-bullet");

      this.customBullets.forEach((bullet, index) => {
        bullet.addEventListener("click", () => {
          if (this.swiper) {
            this.swiper.slideToLoop(index);
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
