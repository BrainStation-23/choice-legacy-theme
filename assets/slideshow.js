if (!customElements.get("slideshow-component")) {
  class SlideshowComponent extends HTMLElement {
    constructor() {
      super();
      this.swiper = null;
    }

    connectedCallback() {
      this.initializeSwiper();
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

        const slidesPerViewForFullSlides =
          parseInt(this.dataset.slidesPerViewDesktop) || 1;

        const customNextButton = this.querySelector(
          ".slideshow-nav-button-next"
        );
        const customPrevButton = this.querySelector(
          ".slideshow-nav-button-prev"
        );

        const swiperConfig = {
          navigation: {
            nextEl: customNextButton,
            prevEl: customPrevButton,
          },
          loop: true,
        };

        if (showProgressBar) {
          swiperConfig.pagination = {
            el: ".custom-pagination",
            type: "progressbar",
          };
        }

        swiperConfig.slidesPerView = slidesPerViewForFullSlides;
        swiperConfig.spaceBetween = 16;
        swiperConfig.centeredSlides = false;

        swiperConfig.breakpoints = {
          769: {
            slidesPerView: showPartialSlides ? 1.2 : slidesPerViewForFullSlides,
            spaceBetween: showPartialSlides ? 20 : 16,
            centeredSlides: showPartialSlides,
          },
        };

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
  }

  customElements.define("slideshow-component", SlideshowComponent);
}
