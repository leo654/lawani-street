(function() {
	'use strict';

	if (window.__sectionRevealsLoaded) return;
	window.__sectionRevealsLoaded = true;

	var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var gsapLoaderPromise = null;
	var motionConfig = window.LawaniConstants || {};
	var revealDuration = ((motionConfig.DURATION && motionConfig.DURATION.REVEAL) || 760) / 1000;
	var revealEase = (motionConfig.EASING && motionConfig.EASING.GSAP_OUT) || 'power3.out';

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

		// Use configured global URLs when available, with local library paths as fallbacks.
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

	function addRevealGroups() {
		var revealGroups = [
			'.ll-services-columns',
			'.cs-related__head',
			'.cs-related-list',
			'.cs-footer__main',
			'.cs-footer__bottom'
		];

		revealGroups.forEach(function(selector) {
			Array.prototype.slice.call(document.querySelectorAll(selector)).forEach(function(group) {
				Array.prototype.slice.call(group.children).forEach(function(node, index) {
					node.classList.add('ll-reveal');
					node.style.setProperty('--ll-reveal-delay', Math.min(index * 70, 280) + 'ms');
				});
			});
		});
	}

	function getRevealTargets() {
		var targets = Array.prototype.slice.call(document.querySelectorAll('.ll-reveal'))
			.filter(function(node) {
				return !node.closest('.home-index .ll-footer') &&
					node.getAttribute('data-home-reveal') === null &&
					isVisibleNode(node);
			});
		var sections = Array.prototype.slice.call(document.querySelectorAll(
			'main > section:not([aria-hidden="true"]):not([inert]):not([data-ll-home-hero]):not([data-ll-hero-showreel]):not([data-no-scroll-reveal]):not(.ll-work):not(.ll-client-strip)'
		));

		sections.forEach(function(section) {
			if (!section.querySelector('.ll-reveal') && isVisibleNode(section)) targets.push(section);
		});

		return targets;
	}

	function observeReveals(targets, options) {
		if (!targets.length) return;

		if (window.LawaniMotion && typeof window.LawaniMotion.observe === 'function') {
			window.LawaniMotion.observe(targets, function(node) {
				node.classList.add('is-visible');
			}, options);
			return;
		}

		if (reduceMotion || !('IntersectionObserver' in window)) {
			targets.forEach(function(node) { node.classList.add('is-visible'); });
			return;
		}

		var observer = new IntersectionObserver(function(entries) {
			entries.forEach(function(entry) {
				if (!entry.isIntersecting) return;
				entry.target.classList.add('is-visible');
				observer.unobserve(entry.target);
			});
		}, options || { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });

		targets.forEach(function(node) { observer.observe(node); });

		window.addEventListener('beforeunload', function() {
			observer.disconnect();
		}, { once: true });
	}

	function initHomeScrollReveals() {
		if (!document.body || !document.body.classList.contains('home-index')) return;

		var targets = [];
		[
			{ selector: '.ll-services-breakdown', effect: 'rise' },
			{ selector: '.ll-services-columns > section', effect: 'rise', stagger: 110 },
			{ selector: '.ll-manifesto__visual', effect: 'rise' },
			{ selector: '.ll-manifesto__copy', effect: 'rise' }
		].forEach(function(group) {
			Array.prototype.slice.call(document.querySelectorAll(group.selector)).forEach(function(node, index) {
				node.setAttribute('data-home-reveal', group.effect);
				if (group.stagger) node.style.setProperty('--home-reveal-delay', Math.min(index * group.stagger, 220) + 'ms');
				targets.push(node);
			});
		});

		if (!targets.length) return;
		document.body.classList.toggle('home-scroll-reveals-ready', !reduceMotion && 'IntersectionObserver' in window);
		observeReveals(targets, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
	}

	function initScrollReveals(gsap) {
		var targets = getRevealTargets();

		targets.forEach(function(node) {
			if (node.getAttribute('data-scroll-reveal-ready') === '1') return;
			node.setAttribute('data-scroll-reveal-ready', '1');
			var originalTransition = node.style.transition;
			node.style.transition = 'none';

			var delay = parseFloat(window.getComputedStyle(node).getPropertyValue('--ll-reveal-delay')) || 0;
			gsap.fromTo(node, {
				autoAlpha: 0,
				y: 14
			}, {
				autoAlpha: 1,
				y: 0,
				duration: revealDuration,
				delay: delay / 1000,
				ease: revealEase,
				overwrite: 'auto',
				onComplete: function() {
					node.classList.add('is-visible');
					node.style.transition = originalTransition;
				},
				scrollTrigger: {
					trigger: node,
					start: 'top 90%',
					toggleActions: 'play none none none',
					once: true,
					invalidateOnRefresh: true
				}
			});
		});

	}

	function init() {
		initHomeScrollReveals();
		addRevealGroups();
		var revealTargets = getRevealTargets();
		if (reduceMotion) {
			revealTargets.forEach(function(node) { node.classList.add('is-visible'); });
			return;
		}

		ensureGsapStack().then(function() {
			if (!window.gsap || !window.ScrollTrigger) {
				observeReveals(revealTargets);
				return;
			}
			var gsap = window.gsap;
			var ScrollTrigger = window.ScrollTrigger;
			var isHomeIndex = !!(document.body && document.body.classList.contains('home-index'));
			gsap.registerPlugin(ScrollTrigger);
			initScrollReveals(gsap);

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

				gsap.fromTo(card, { autoAlpha: 0, y: 18, scale: 0.99 }, {
					autoAlpha: 1,
					y: 0,
					scale: 1,
					duration: revealDuration,
					ease: revealEase,
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

				gsap.fromTo(item, { autoAlpha: 0, y: 14 }, {
					autoAlpha: 1,
					y: 0,
					duration: revealDuration,
					ease: revealEase,
					scrollTrigger: {
						trigger: item,
						start: 'top 88%',
						toggleActions: 'play none none reverse'
					}
				});
			});

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
