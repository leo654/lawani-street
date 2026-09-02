(function() {
	'use strict';

	if (window.__sectionRevealsLoaded) return;
	window.__sectionRevealsLoaded = true;

	var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var gsapLoaderPromise = null;

	function loadScriptOnce(src, markerAttr) {
		return new Promise(function(resolve) {
			var existing = document.querySelector('script[' + markerAttr + '="1"]');
			if (existing) {
				if (existing.getAttribute('data-loaded') === '1') {
					resolve();
					return;
				}
				existing.addEventListener('load', function() { resolve(); }, { once: true });
				existing.addEventListener('error', function() { resolve(); }, { once: true });
				return;
			}

			var script = document.createElement('script');
			script.src = src;
			script.async = true;
			script.defer = true;
			script.setAttribute(markerAttr, '1');
			script.onload = function() {
				script.setAttribute('data-loaded', '1');
				resolve();
			};
			script.onerror = function() { resolve(); };
			document.head.appendChild(script);
		});
	}

	function ensureGsapStack() {
		if (window.gsap && window.ScrollTrigger) return Promise.resolve();
		if (gsapLoaderPromise) return gsapLoaderPromise;

		// GSAP_CORE_URL / GSAP_SCROLLTRIGGER_URL come from runtime.shared.js (global vars).
		gsapLoaderPromise = Promise.resolve()
			.then(function() {
				if (window.gsap) return;
				return loadScriptOnce(typeof GSAP_CORE_URL === 'string' ? GSAP_CORE_URL : 'assets/js/libs/gsap.min.js', 'data-section-gsap');
			})
			.then(function() {
				if (window.ScrollTrigger) return;
				return loadScriptOnce(typeof GSAP_SCROLLTRIGGER_URL === 'string' ? GSAP_SCROLLTRIGGER_URL : 'assets/js/libs/ScrollTrigger.min.js', 'data-section-scrolltrigger');
			});

		return gsapLoaderPromise;
	}

	function isVisibleNode(node) {
		if (!node || !node.getBoundingClientRect) return false;
		return node.getClientRects && node.getClientRects().length > 0;
	}

	function init() {
		if (reduceMotion) return;

		ensureGsapStack().then(function() {
			if (!window.gsap || !window.ScrollTrigger) return;
			var gsap = window.gsap;
			var ScrollTrigger = window.ScrollTrigger;
			var isHomeIndex = !!(document.body && document.body.classList.contains('home-index'));
			gsap.registerPlugin(ScrollTrigger);

			var cards = Array.prototype.slice.call(document.querySelectorAll('.grid-item2 .wrap'));
			cards.filter(isVisibleNode).forEach(function(card) {
				if (card.getAttribute('data-reveal-ready') === '1') return;
				card.setAttribute('data-reveal-ready', '1');

				// Home index grid should stay static (no scroll reveal entrance).
				if (isHomeIndex) {
					card.style.opacity = '1';
					card.style.visibility = 'visible';
					card.style.transform = 'none';
					return;
				}

				gsap.fromTo(card, { autoAlpha: 0, y: 46, rotateX: -6, scale: 0.985 }, {
					autoAlpha: 1,
					y: 0,
					rotateX: 0,
					scale: 1,
					duration: 1.0,
					ease: 'expo.out',
					scrollTrigger: {
						trigger: card,
						start: 'top 86%',
						toggleActions: 'play none none reverse'
					}
				});
			});

			var stacks = Array.prototype.slice.call(document.querySelectorAll('.stack-item'));
			stacks.filter(isVisibleNode).forEach(function(item) {
				if (item.getAttribute('data-reveal-ready') === '1') return;
				item.setAttribute('data-reveal-ready', '1');

				gsap.fromTo(item, { autoAlpha: 0, y: 28 }, {
					autoAlpha: 1,
					y: 0,
					duration: 0.9,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: item,
						start: 'top 88%',
						toggleActions: 'play none none reverse'
					}
				});
			});

			// Note: Video scroll control is handled by index-project-slides.js for unified system

			ScrollTrigger.refresh();
		});
	}

	// Works with the existing runtime.shared "page:ready" convention.
	if (window.jQuery) {
		window.jQuery(window).off('page:ready.sectionReveals');
		window.jQuery(window).on('page:ready.sectionReveals', init);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init, { once: true });
	} else {
		init();
	}
})();
