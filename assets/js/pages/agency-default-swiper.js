/* Agency page carousels (page-specific) */
(function() {
	if (!window.Swiper) {
		return;
	}

	var carouselSelectors = ['.__js_carousel-latest-news', '.__js_carousel-latest-projects'];
	var hasPrimaryCarousel = document.querySelector('.__js_carousel');

	if (hasPrimaryCarousel) {
		new Swiper('.__js_carousel', {
			slidesPerView: 'auto',
			spaceBetween: 60,
			loop: true,
			navigation: {
				nextEl: '.carousel__btn--next',
				prevEl: '.carousel__btn--prev'
			}
		});
	}

	carouselSelectors.forEach(function(selector) {
		if (!document.querySelector(selector)) return;
		new Swiper(selector, {
			slidesPerView: 'auto',
			spaceBetween: 60,
			loop: true,
			navigation: {
				nextEl: '.nav-btn--next[data-target="' + selector + '"]',
				prevEl: '.nav-btn--prev[data-target="' + selector + '"]'
			}
		});
	});
})();

/* Team carousel on mobile (only when markup exists) */
(function() {
	if (!window.Swiper) {
		return;
	}

	var carouselSelector = '.__js_team-carousel-only-mobile';
	var carousel = null;

	if (!document.querySelector(carouselSelector)) {
		return;
	}

	function initTeamCarousel() {
		if (window.matchMedia('(min-width: 576px)').matches && carousel) {
			carousel.destroy();
			carousel = null;
			return;
		}

		if (window.matchMedia('(max-width: 575px)').matches && !carousel) {
			carousel = new Swiper(carouselSelector, {
				speed: 300,
				slidesPerView: 'auto',
				spaceBetween: 40,
				loop: true
			});
		}
	}

	initTeamCarousel();
	window.addEventListener('resize', initTeamCarousel, { passive: true });
})();
