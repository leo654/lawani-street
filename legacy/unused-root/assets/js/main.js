'use strict';

/******************
Template Name: Centrix
Description: Centrix - Personal CV/Resume HTML Template
Author: Paul
Author URI: http://themeforest.net/user/Paul_tf

1. Common
2. Inits
	2.1 Init parallax
	2.2 Init google map
	2.3 Animsition init
	2.4 AOS init
3. Header
4. Change opacity logo on scroll
5. Fixed footer
6. Mobile menu
7. Hint fields
8. Accordion
9. Carousels
	9.1 Carousel
	9.2 Team carousel
10. Animation of statistics
11. Tooltip pages
12. Masonry
13. Pagepiling
14. Animation of skills
15. Anchor
16. Projects listing

***************/

/*** 1. Common ***/

var GSAP_CORE_URL = 'assets/js/libs/gsap.min.js';
var GSAP_SCROLLTRIGGER_URL = 'assets/js/libs/ScrollTrigger.min.js';


/*** 2. Inits ***/

/* 2.1 Init parallax */
/*(function() {
	var images = document.querySelectorAll('.__js_parallax img');
	new simpleParallax(images, {
		scale: 1.3
	});
})();*/

/* 2.2 Init google map */
(function() {
	var map = '';

	function initMap() {
		map = new google.maps.Map(document.getElementById("map"), {
			center: {
				lat: -34.397,
				lng: 150.644
			},
			zoom: 8,
		});
	}
})();


/* 9.1 Carousel */
(function() {
	if (!window.Swiper) {
		return;
	}

	var carouselSelectors = ['.__js_carousel-latest-news', '.__js_carousel-latest-projects'];

	var carousel = new Swiper('.__js_carousel', {
		slidesPerView: 'auto',
		spaceBetween: 60,
		loop: true,
		navigation: {
			nextEl: '.carousel__btn--next',
			prevEl: '.carousel__btn--prev',
		},
	});

	carouselSelectors.forEach(function(selector) {
		new Swiper(selector, {
			slidesPerView: 'auto',
			spaceBetween: 60,
			loop: true,
			navigation: {
				nextEl: '.nav-btn--next[data-target="' + selector + '"]',
				prevEl: '.nav-btn--prev[data-target="' + selector + '"]',
			},
		});
	});
})();

/* 9.2 Team carousel */
(function() {
	if (!window.Swiper) {
		return;
	}

	var carouselSelector = '.__js_team-carousel-only-mobile';
	var carousel = null;

	if ($(carouselSelector).length > 0) {

		initTeamCarousel();

		$(window).resize(function() {
			initTeamCarousel();
		});
	}

	function initTeamCarousel() {
		if (window.matchMedia('(min-width: 576px)').matches && carousel) {
			carousel.destroy();
			carousel = null;

		} else if (window.matchMedia('(max-width: 575px)').matches && !carousel) {
			carousel = new Swiper(carouselSelector, {
				speed: 300,
				slidesPerView: 'auto',
				spaceBetween: 40,
				loop: true
			});
		}
	}
})();


(function() {
	var btn = $('.accordion__item-header');
	var modifierClass = 'accordion__item-header--opened';
	var duration = 400; // Smooth animation duration
	var accordionImage = $('#accordion-image');
	var defaultImageSrc = 'assets/img/03.png';

	// Preload accordion images for smoother swaps
	var accordionImageSources = [
		defaultImageSrc,
		'assets/img/04.png',
		'assets/img/strat.png',
		'assets/img/copy.png'
	];

	accordionImageSources.forEach(function(src) {
		var img = new Image();
		img.src = src;
	});

	function swapAccordionImage(targetSrc) {
		if (!accordionImage.length || !targetSrc) return;

		// Avoid unnecessary work if it's already showing this image
		if (accordionImage.attr('src') === targetSrc) return;

		// Start fade-out
		accordionImage.css('opacity', '0');

		// Ensure the new image is loaded before fading back in
		var img = new Image();
		img.onload = function() {
			accordionImage.attr('src', targetSrc);
			// Next paint tick: fade in
			requestAnimationFrame(function() {
				accordionImage.css('opacity', '1');
			});
		};
		img.src = targetSrc;
	}
  
	btn.on('click', function() {
	  var $this = $(this);
	  var isOpen = $this.hasClass(modifierClass);
	  var $accordionItem = $this.closest('.accordion__item');
	  var imageSrc = $accordionItem.attr('data-image');
  
	  // Close all other items
	  btn.removeClass(modifierClass).next('.accordion__item-body').slideUp(duration);
  
	  // Toggle current item
	  if (!isOpen) {
		$this.addClass(modifierClass).next('.accordion__item-body').slideDown(duration);
		// Change image if data-image attribute exists
		if (imageSrc && accordionImage.length) {
		  swapAccordionImage(imageSrc);
		}
	  } else {
		// If closing, reset to default image (first accordion image)
		if (accordionImage.length) {
		  swapAccordionImage(defaultImageSrc);
		}
	  }
	});
  })();


  window.addEventListener('load', () => {
	const countSpan = document.getElementById('count');
	const progressBar = document.querySelector('.progress-bar');
	const loader = document.getElementById('loader');

	// Fail-safe: never leave the loader over the page indefinitely.
	if (loader) {
		setTimeout(() => {
			loader.classList.add('loader-finish');
		}, 4500);
	}

	// Keep a single load screen flow and skip safely on pages without loader markup.
	if (!countSpan || !progressBar || !loader) {
		animateIn();
		return;
	}

	let count = 0;
	const interval = setInterval(() => {
	  count += Math.floor(Math.random() * 15) + 1;
	  
	  if (count >= 100) {
		count = 100;
		clearInterval(interval);
		
		setTimeout(() => {
		  loader.classList.add('loader-finish');
		  animateIn();
		}, 500);
	  }
	  
	  countSpan.innerText = count;
	  progressBar.style.width = count + '%';
	}, 100);
  });


/* 2.3 GSAP page transition manager */
(function() {
	var navStateKey = 'gsap-page-sweep-pending';
	var precoverClass = 'gsap-page-sweep-precover-active';
	var transitioningClass = 'gsap-page-sweep-transitioning';
	var styleId = 'gsap-page-sweep-style';
	var layerId = 'gsap-page-sweep-layer';
	var gsapLoaderPromise = null;
	var layerParts = null;
	var isTransitioning = false;
	var exitTimeline = null;
	var enterTimeline = null;
	var legacyRouteMap = {
		'/about-us.html': '/team.html',
		'/agency-modern.html': '/agency-default.html',
		'/agency-mono.html': '/agency-default.html',
		'/bcd.html': '/work.html',
		'/blog-grid.html': '/test.html',
		'/blog-listing.html': '/test.html',
		'/blog-masonry.html': '/test.html',
		'/coming-soon.html': '/index.html',
		'/contact.html': '/vcard.html',
		'/creative-agency.html': '/agency-default.html',
		'/faq.html': '/work.html',
		'/me.html': '/index.html',
		'/parallax-projects.html': '/work.html',
		'/portfolio-tooltip.html': '/work.html',
		'/pricing.html': '/work.html',
		'/projects-carousel.html': '/work.html',
		'/projects-masonry.html': '/work.html',
		'/service-detail.html': '/work.html',
		'/services.html': '/work.html',
		'/single-post.html': '/test.html',
		'/single-project.html': '/work.html',
		'/tooltip-projects.html': '/work.html',
		'/vertical-projects.html': '/work.html'
	};

	var timing = {
		exitOrange: 1.04,
		exitWhite: 1.02,
		exitWhiteDelay: 0.16,
		exitHold: 0.06,
		enterWhite: 1.06,
		enterOrange: 1.08,
		enterOrangeDelay: 0.12,
		stagger: 0.07
	};

	var easing = {
		exit: 'expo.inOut',
		enter: 'expo.inOut',
		float: 'power2.out'
	};

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
			script.onerror = function() {
				resolve();
			};
			document.head.appendChild(script);
		});
	}

	function ensureGsapCore() {
		if (window.gsap) return Promise.resolve(window.gsap);
		if (gsapLoaderPromise) return gsapLoaderPromise;

		gsapLoaderPromise = loadScriptOnce(
			GSAP_CORE_URL,
			'data-page-transition-gsap'
		).then(function() {
			return window.gsap || null;
		});

		return gsapLoaderPromise;
	}

	function ensureStyle() {
		if (document.getElementById(styleId)) return;
		var style = document.createElement('style');
		style.id = styleId;
			style.textContent = [
				'html.' + precoverClass + ' body{opacity:0 !important;}',
				'html.' + transitioningClass + ' body{pointer-events:none !important;}',
				'#' + layerId + '{position:fixed !important;inset:0 !important;z-index:2147483647 !important;pointer-events:none !important;visibility:hidden;opacity:0;overflow:hidden !important;isolation:isolate !important;background:transparent !important;contain:paint !important;}',
				'#' + layerId + ' .page-sweep-panel{position:absolute !important;inset:-2px !important;transform:translate3d(102%,0,0);will-change:transform;backface-visibility:hidden;transform-style:preserve-3d;}',
				'#' + layerId + ' .page-sweep-panel--orange{z-index:2147483646 !important;background:#fd4015;}',
				'#' + layerId + ' .page-sweep-panel--white{z-index:2147483647 !important;background:#fff;}'
			].join('');
			document.head.appendChild(style);
		}

	function ensureLayer() {
		var existing = document.getElementById(layerId);
		if (existing) {
			var orange = existing.querySelector('.page-sweep-panel--orange');
			var white = existing.querySelector('.page-sweep-panel--white');
			if (!orange) {
				orange = document.createElement('div');
				orange.className = 'page-sweep-panel page-sweep-panel--orange';
				existing.appendChild(orange);
			}
			if (!white) {
				white = document.createElement('div');
				white.className = 'page-sweep-panel page-sweep-panel--white';
				existing.appendChild(white);
			}
			return {
				layer: existing,
				orange: orange,
				white: white
			};
		}

		var layer = document.createElement('div');
		layer.id = layerId;
		layer.setAttribute('aria-hidden', 'true');
		layer.innerHTML = [
			'<div class="page-sweep-panel page-sweep-panel--orange"></div>',
			'<div class="page-sweep-panel page-sweep-panel--white"></div>'
		].join('');
		document.documentElement.appendChild(layer);
		return {
			layer: layer,
			orange: layer.querySelector('.page-sweep-panel--orange'),
			white: layer.querySelector('.page-sweep-panel--white')
		};
	}

	function readPendingState() {
		try {
			return window.sessionStorage.getItem(navStateKey) === '1';
		} catch (error) {
			return false;
		}
	}

	function writePendingState() {
		try {
			window.sessionStorage.setItem(navStateKey, '1');
		} catch (error) {}
	}

	function clearPendingState() {
		try {
			window.sessionStorage.removeItem(navStateKey);
		} catch (error) {}
	}

	function clearPrecoverLock() {
		var docEl = document.documentElement;
		if (!docEl) return;
		docEl.classList.remove(precoverClass);
	}

	function lockInteraction() {
		var docEl = document.documentElement;
		if (!docEl) return;
		docEl.classList.add(transitioningClass);
	}

	function unlockInteraction() {
		var docEl = document.documentElement;
		if (!docEl) return;
		docEl.classList.remove(transitioningClass);
	}

	function resolveLegacyDestination(url) {
		if (!url) return url;
		var mappedPath = legacyRouteMap[(url.pathname || '').toLowerCase()];
		if (!mappedPath) return url;
		var mapped = new URL(mappedPath, window.location.origin);
		mapped.search = url.search;
		mapped.hash = url.hash;
		return mapped;
	}

	function normalizeDestination(rawUrl) {
		if (!rawUrl) return null;
		var url;
		try {
			url = new URL(rawUrl, window.location.href);
		} catch (error) {
			return null;
		}
		if (url.origin !== window.location.origin) return null;
		return resolveLegacyDestination(url);
	}

	function isSameDocument(url) {
		return url.pathname === window.location.pathname &&
			url.search === window.location.search;
	}

	function shouldHandleLink(event, link) {
		event = event || {};
		if (!link || event.defaultPrevented) return null;
		if (typeof event.button === 'number' && event.button !== 0) return null;
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
		if (link.hasAttribute('download')) return null;
		if (link.hasAttribute('data-no-transition')) return null;

		var href = (link.getAttribute('href') || '').trim();
		if (!href || href.charAt(0) === '#') return null;
		if (/^(mailto:|tel:|javascript:)/i.test(href)) return null;

		var target = (link.getAttribute('target') || '').toLowerCase();
		if (target && target !== '_self') return null;

		var url = normalizeDestination(link.href);
		if (!url) return null;
		if (isSameDocument(url)) return null;
		return url.href;
	}

	function showLayer(gsap) {
		if (!layerParts) return;
		gsap.set(layerParts.layer, { autoAlpha: 1, visibility: 'visible', pointerEvents: 'none' });
	}

	function hideLayer(gsap) {
		if (!layerParts) return;
		gsap.killTweensOf([layerParts.orange, layerParts.white, layerParts.layer]);
		gsap.set(layerParts.layer, { autoAlpha: 0, visibility: 'hidden', pointerEvents: 'none' });
		gsap.set(layerParts.orange, { xPercent: 102 });
		gsap.set(layerParts.white, { xPercent: 102 });
	}

	function staggerIntro(gsap) {
		var scope = document.querySelector('main') || document;
		var nodes = scope.querySelectorAll('h1:not([data-no-reveal]), .card');
		if (!nodes.length) return;
		gsap.set(nodes, { autoAlpha: 0, y: 20 });
		gsap.to(nodes, {
			autoAlpha: 1,
			y: 0,
			duration: 0.9,
			ease: easing.float,
			stagger: { each: timing.stagger, from: 'start' },
			overwrite: true,
			clearProps: 'opacity,transform'
		});
	}

	function refreshScrollTriggers() {
		if (!window.ScrollTrigger) return;
		window.requestAnimationFrame(function() {
			window.ScrollTrigger.refresh();
		});
	}

	function runAfterNextPaint(callback) {
		window.requestAnimationFrame(function() {
			window.requestAnimationFrame(function() {
				callback();
			});
		});
	}

	function playEntrance(gsap) {
		if (enterTimeline) {
			enterTimeline.kill();
			enterTimeline = null;
		}

		lockInteraction();
		showLayer(gsap);
		gsap.set(layerParts.orange, { xPercent: 0, force3D: true });
		gsap.set(layerParts.white, { xPercent: 0, force3D: true });

		// Wait one paint so the full cover is guaranteed visible before content unlock.
		runAfterNextPaint(function() {
			// Content unlock only after full overlay coverage.
			clearPrecoverLock();

			enterTimeline = gsap.timeline({
				onComplete: function() {
					hideLayer(gsap);
					unlockInteraction();
					isTransitioning = false;
					staggerIntro(gsap);
					refreshScrollTriggers();
					enterTimeline = null;
				}
			});
			enterTimeline.to(layerParts.white, {
				xPercent: -102,
				duration: timing.enterWhite,
				ease: easing.enter,
				overwrite: true,
				force3D: true
			}, 0);
			enterTimeline.to(layerParts.orange, {
				xPercent: -102,
				duration: timing.enterOrange,
				ease: easing.enter,
				overwrite: true,
				force3D: true
			}, timing.enterOrangeDelay);
		});
	}

	function navigateWithTransition(gsap, destination) {
		if (isTransitioning) return;
		if (!destination) return;
		isTransitioning = true;
		writePendingState();
		lockInteraction();

		if (exitTimeline) {
			exitTimeline.kill();
			exitTimeline = null;
		}

		// Set panel positions before showing layer to avoid one-frame bleed.
		gsap.set(layerParts.orange, { xPercent: 102, force3D: true });
		gsap.set(layerParts.white, { xPercent: 102, force3D: true });
		showLayer(gsap);

		var didNavigate = false;
		function go() {
			if (didNavigate) return;
			didNavigate = true;
			window.location.assign(destination);
		}

		var exitTotal = Math.max(timing.exitOrange, timing.exitWhite + timing.exitWhiteDelay);
		var fallbackMs = Math.max(Math.ceil((exitTotal + timing.exitHold + 1.2) * 1000), 4200);
		var fallbackTimer = window.setTimeout(go, fallbackMs);

		exitTimeline = gsap.timeline();
		exitTimeline.to(layerParts.orange, {
			xPercent: 0,
			duration: timing.exitOrange,
			ease: easing.exit,
			overwrite: true,
			force3D: true
		}, 0);
		exitTimeline.to(layerParts.white, {
			xPercent: 0,
			duration: timing.exitWhite,
			ease: easing.exit,
			overwrite: true,
			force3D: true
		}, timing.exitWhiteDelay);
		exitTimeline.call(function() {
			window.clearTimeout(fallbackTimer);
			// Ensure a painted full-cover frame before leaving the current page.
			runAfterNextPaint(go);
			exitTimeline = null;
		}, null, '+=' + timing.exitHold);
	}

	function initTransitionManager(gsap) {
		ensureStyle();
		layerParts = ensureLayer();

		var wasPending = readPendingState();
		clearPendingState();

			if (wasPending) {
				isTransitioning = true;
				playEntrance(gsap);
			} else {
				clearPrecoverLock();
				unlockInteraction();
				hideLayer(gsap);
				staggerIntro(gsap);
				refreshScrollTriggers();
			}

		window.navigateWithTransition = function(rawUrl) {
			var url = normalizeDestination(rawUrl);
			if (!url) {
				window.location.assign(rawUrl);
				return;
			}
			if (isSameDocument(url)) return;
			navigateWithTransition(gsap, url.href);
		};

			function onDocumentClick(event) {
				var target = event.target;
				if (!target || typeof target.closest !== 'function') return;
				var link = target.closest('a[href]');
				var destination = shouldHandleLink(event, link);
				if (!destination) return;
				event.preventDefault();
				if (typeof event.stopImmediatePropagation === 'function') {
					event.stopImmediatePropagation();
				}
				if (typeof event.stopPropagation === 'function') {
					event.stopPropagation();
				}
				navigateWithTransition(gsap, destination);
			}

			window.addEventListener('click', onDocumentClick, true);
			window.addEventListener('pageshow', function(event) {
				if (!event.persisted) return;
				isTransitioning = false;
				clearPendingState();
				clearPrecoverLock();
				unlockInteraction();
				hideLayer(gsap);
				refreshScrollTriggers();
			});

			window.addEventListener('pagehide', function() {
				unlockInteraction();
			});
		}

	var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (prefersReducedMotion) {
		clearPendingState();
		clearPrecoverLock();
		unlockInteraction();
		return;
	}

		ensureGsapCore().then(function(gsap) {
			if (!gsap) {
				clearPendingState();
				clearPrecoverLock();
				unlockInteraction();
				return;
			}
			initTransitionManager(gsap);
		});
})();

/* 2.4 GSAP Scroll reveal init (AOS replacement) */
(function() {
	var triggerPrefix = 'aos-reveal-';
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
			script.onerror = function() {
				resolve();
			};
			document.head.appendChild(script);
		});
	}

	function ensureGsapStack() {
		if (window.gsap && window.ScrollTrigger) {
			return Promise.resolve();
		}
		if (gsapLoaderPromise) return gsapLoaderPromise;

		gsapLoaderPromise = Promise.resolve()
			.then(function() {
				if (window.gsap) return;
				return loadScriptOnce(GSAP_CORE_URL, 'data-gsap-core');
			})
			.then(function() {
				if (window.ScrollTrigger) return;
				return loadScriptOnce(GSAP_SCROLLTRIGGER_URL, 'data-gsap-scrolltrigger');
			});

		return gsapLoaderPromise;
	}

	function getFromVars(type) {
		switch ((type || '').toLowerCase()) {
			case 'fade-down':
				return { x: 0, y: -24 };
			case 'fade-left':
				return { x: 24, y: 0 };
			case 'fade-right':
				return { x: -24, y: 0 };
			case 'fade-up':
			default:
				return { x: 0, y: 24 };
		}
	}

	function revealImmediately(nodes) {
		nodes.forEach(function(node) {
			node.style.opacity = '1';
			node.style.visibility = 'visible';
			node.style.transform = 'none';
		});
	}

	function killRevealTriggers() {
		if (!window.ScrollTrigger || typeof window.ScrollTrigger.getAll !== 'function') return;
		window.ScrollTrigger.getAll().forEach(function(trigger) {
			if (!trigger || !trigger.vars || typeof trigger.vars.id !== 'string') return;
			if (trigger.vars.id.indexOf(triggerPrefix) !== 0) return;
			trigger.kill();
		});
	}

	function initGsapAosReveal() {
		var targets = Array.prototype.slice.call(document.querySelectorAll('[data-aos]'));
		if (!targets.length) return;

		var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduceMotion) {
			revealImmediately(targets);
			return;
		}

		ensureGsapStack().then(function() {
			if (!window.gsap || !window.ScrollTrigger) {
				revealImmediately(targets);
				return;
			}

			var gsap = window.gsap;
			var ScrollTrigger = window.ScrollTrigger;

			gsap.registerPlugin(ScrollTrigger);
			killRevealTriggers();

			targets.forEach(function(node, index) {
				var from = getFromVars(node.getAttribute('data-aos'));
				gsap.killTweensOf(node);
				gsap.set(node, {
					autoAlpha: 0,
					x: from.x,
					y: from.y,
					force3D: true
				});
				gsap.to(node, {
					autoAlpha: 1,
					x: 0,
					y: 0,
					duration: 0.9,
					ease: 'power3.out',
					overwrite: 'auto',
					scrollTrigger: {
						id: triggerPrefix + index,
						trigger: node,
						start: 'top 88%',
						once: true
					}
				});
			});

			ScrollTrigger.refresh();
		}).catch(function() {
			revealImmediately(targets);
		});
	}

	$(window).off('page:ready.aosReveal');
	$(window).on('page:ready.aosReveal', initGsapAosReveal);

	window.addEventListener('DOMContentLoaded', function() {
		$(window).trigger('page:ready');
		window.dispatchEvent(new CustomEvent('page:ready'));
	});
})();

/* Text appear on scroll */
(function() {
	var revealClass = 'scroll-text-reveal';
	var splitReadyAttr = 'data-split-ready';
	var triggerPrefix = 'text-reveal-';
	var gsapLoaderPromise = null;
	var selector = [
		'main p',
		'main h1',
		'main h2',
		'main h3',
		'main h4',
		'main li',
		'main blockquote'
	].join(', ');

	function isExcluded(node) {
		return node.closest('.header, .navigation, .footer, .mobile-canvas, .no-text-reveal, .hero--enhanced, form, button, label');
	}

	function hasMeaningfulText(node) {
		return (node.textContent || '').trim().length > 0;
	}

	function collectTargets() {
		return Array.prototype.filter.call(document.querySelectorAll(selector), function(node) {
			if (!node || !node.tagName) return false;
			if (node.hasAttribute('data-aos')) return false;
			if (node.hasAttribute('data-no-reveal')) return false;
			if (isExcluded(node)) return false;
			if (!hasMeaningfulText(node)) return false;
			node.classList.add(revealClass);
			return true;
		});
	}

	function isSplittableTextNode(node) {
		if (!node || !node.nodeValue || !node.nodeValue.trim()) return false;
		var parent = node.parentElement;
		if (!parent) return false;
		if (parent.closest('script, style, noscript')) return false;
		return true;
	}

	function splitElementWords(node) {
		if (node.getAttribute(splitReadyAttr) === '1') {
			return Array.prototype.slice.call(node.querySelectorAll('.split-word-inner'));
		}

		var textNodes = [];
		var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
		var current;

		while ((current = walker.nextNode())) {
			if (isSplittableTextNode(current)) {
				textNodes.push(current);
			}
		}

		textNodes.forEach(function(textNode) {
			var parts = textNode.nodeValue.split(/(\s+)/);
			var frag = document.createDocumentFragment();

			parts.forEach(function(part) {
				if (!part) return;
				if (/^\s+$/.test(part)) {
					frag.appendChild(document.createTextNode(part));
					return;
				}
				var word = document.createElement('span');
				var inner = document.createElement('span');
				word.className = 'split-word split-text-word';
				inner.className = 'split-word-inner';
				inner.textContent = part;
				word.appendChild(inner);
				frag.appendChild(word);
			});

			textNode.parentNode.replaceChild(frag, textNode);
		});

		node.setAttribute(splitReadyAttr, '1');
		return Array.prototype.slice.call(node.querySelectorAll('.split-word-inner'));
	}

	function loadScriptOnce(src, markerAttr) {
		return new Promise(function(resolve) {
			var existingScript = document.querySelector('script[' + markerAttr + '="1"]');
			if (existingScript) {
				if (existingScript.getAttribute('data-loaded') === '1') {
					resolve();
					return;
				}
				existingScript.addEventListener('load', function() { resolve(); }, { once: true });
				existingScript.addEventListener('error', function() { resolve(); }, { once: true });
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
			script.onerror = function() {
				resolve();
			};
			document.head.appendChild(script);
		});
	}

	function ensureGsapStack() {
		if (window.gsap && window.ScrollTrigger) {
			return Promise.resolve();
		}

		if (gsapLoaderPromise) return gsapLoaderPromise;

		gsapLoaderPromise = Promise.resolve()
			.then(function() {
				if (window.gsap) return;
				return loadScriptOnce(GSAP_CORE_URL, 'data-text-reveal-gsap');
			})
			.then(function() {
				if (window.ScrollTrigger) return;
				return loadScriptOnce(GSAP_SCROLLTRIGGER_URL, 'data-text-reveal-scrolltrigger');
			});

		return gsapLoaderPromise;
	}

	function revealImmediately(targets) {
		targets.forEach(function(node) {
			node.style.opacity = '1';
			node.style.transform = 'none';
			Array.prototype.forEach.call(node.querySelectorAll('.split-word-inner'), function(word) {
				word.style.opacity = '1';
				word.style.transform = 'none';
				word.style.filter = 'none';
			});
		});
	}

	function killRevealTriggers() {
		if (!window.ScrollTrigger || typeof window.ScrollTrigger.getAll !== 'function') return;
		window.ScrollTrigger.getAll().forEach(function(trigger) {
			if (!trigger || !trigger.vars || typeof trigger.vars.id !== 'string') return;
			if (trigger.vars.id.indexOf(triggerPrefix) !== 0) return;
			trigger.kill();
		});
	}

	function initReveal() {
		var targets = collectTargets();
		if (!targets.length) return;

		var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduceMotion) {
			revealImmediately(targets);
			return;
		}

		ensureGsapStack().then(function() {
			if (!window.gsap || !window.ScrollTrigger) {
				revealImmediately(targets);
				return;
			}

			var gsap = window.gsap;
			var ScrollTrigger = window.ScrollTrigger;
			gsap.registerPlugin(ScrollTrigger);
			killRevealTriggers();

			targets.forEach(function(node, index) {
				var words = splitElementWords(node);
				if (!words.length) return;

				gsap.killTweensOf(node);
				gsap.killTweensOf(words);
				gsap.set(node, { autoAlpha: 1 });
				gsap.set(words, {
					autoAlpha: 0,
					yPercent: 118,
					rotateX: -82,
					filter: 'blur(10px)',
					transformOrigin: '50% 100%',
					force3D: true
				});
				gsap.to(words, {
					autoAlpha: 1,
					yPercent: 0,
					rotateX: 0,
					filter: 'blur(0px)',
					duration: 1.02,
					stagger: {
						each: 0.024,
						from: 'start'
					},
					ease: 'expo.out',
					overwrite: 'auto',
					clearProps: 'transform,filter,opacity',
					scrollTrigger: {
						id: triggerPrefix + index,
						trigger: node,
						start: 'top 84%',
						once: true
					}
				});
			});

			ScrollTrigger.refresh();
		}).catch(function() {
			revealImmediately(targets);
		});
	}

	$(window).off('page:ready.textReveal');
	$(window).on('page:ready.textReveal', initReveal);

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initReveal, { once: true });
	} else {
		initReveal();
	}
})();

/* Services breaker marquee with GSAP ScrollTrigger */
(function() {
	var triggerPrefix = 'services-breaker-marquee-';
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
			script.onerror = function() {
				resolve();
			};
			document.head.appendChild(script);
		});
	}

	function ensureGsapStack() {
		if (window.gsap && window.ScrollTrigger) {
			return Promise.resolve();
		}
		if (gsapLoaderPromise) return gsapLoaderPromise;

		gsapLoaderPromise = Promise.resolve()
			.then(function() {
				if (window.gsap) return;
				return loadScriptOnce(GSAP_CORE_URL, 'data-services-breaker-gsap');
			})
			.then(function() {
				if (window.ScrollTrigger) return;
				return loadScriptOnce(GSAP_SCROLLTRIGGER_URL, 'data-services-breaker-scrolltrigger');
			});

		return gsapLoaderPromise;
	}

	function killMarqueeTriggers() {
		if (!window.ScrollTrigger || typeof window.ScrollTrigger.getAll !== 'function') return;
		window.ScrollTrigger.getAll().forEach(function(trigger) {
			if (!trigger || !trigger.vars || typeof trigger.vars.id !== 'string') return;
			if (trigger.vars.id.indexOf(triggerPrefix) !== 0) return;
			trigger.kill();
		});
	}

	function ensureTrackLoop(track) {
		var inner = track ? track.querySelector('.services-breaker__track-inner') : null;
		if (!inner) return null;
		if (inner.getAttribute('data-loop-cloned') === '1') return inner;

		inner.innerHTML += inner.innerHTML;
		inner.setAttribute('data-loop-cloned', '1');
		return inner;
	}

	function resetTrackPositions(sections) {
		sections.forEach(function(section) {
			var track = section.querySelector('.services-breaker__track');
			var inner = section.querySelector('.services-breaker__track-inner');
			if (!track) return;
			track.style.transform = 'translate3d(0,0,0)';
			if (inner) inner.style.transform = 'translate3d(0,0,0)';
		});
	}

	function initServicesBreakerMarquee() {
		var sections = Array.prototype.slice.call(document.querySelectorAll('.services-breaker'));
		if (!sections.length) return;

		var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduceMotion) {
			resetTrackPositions(sections);
			return;
		}

		ensureGsapStack().then(function() {
			if (!window.gsap || !window.ScrollTrigger) {
				resetTrackPositions(sections);
				return;
			}

			var gsap = window.gsap;
			var ScrollTrigger = window.ScrollTrigger;
			gsap.registerPlugin(ScrollTrigger);
			killMarqueeTriggers();

			sections.forEach(function(section, index) {
				var track = section.querySelector('.services-breaker__track');
				var inner = ensureTrackLoop(track);
				if (!track) return;

				gsap.killTweensOf(track);
				if (inner) gsap.killTweensOf(inner);
				gsap.set(track, { xPercent: 0, force3D: true });
					gsap.to(track, {
						xPercent: -35,
						ease: 'none',
						scrollTrigger: {
							id: triggerPrefix + index,
							trigger: section,
							start: 'top bottom',
							end: 'bottom top',
							scrub: 1,
							invalidateOnRefresh: true
						}
					});
			});

			ScrollTrigger.refresh();
		}).catch(function() {
			resetTrackPositions(sections);
		});
	}

	$(window).off('page:ready.servicesBreaker');
	$(window).on('page:ready.servicesBreaker', initServicesBreakerMarquee);

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initServicesBreakerMarquee, { once: true });
	} else {
		initServicesBreakerMarquee();
	}
})();








function animateIn() {
	if (!window.gsap) return;
	gsap.from(".stack-item", {
		y: 60, opacity: 0, duration: 1.4, stagger: 0.1, ease: "expo.out"
	});
}

function initStack() {
	if (!window.gsap) return;

	const items = document.querySelectorAll('.stack-item');
	
	items.forEach(item => {
		if (item.dataset.stackInit === '1') return;
		item.dataset.stackInit = '1';

		const glow = item.querySelector('.color-bg');
		if (!glow) return;
		
		// Create a pulsing timeline for each item
		const pulse = gsap.to(glow, {
			opacity: 0.15,
			scale: 1.2,
			duration: 2,
			repeat: -1,
			yoyo: true,
			ease: "sine.inOut",
			paused: true
		});

		item.addEventListener('mouseenter', () => {
			gsap.to(item, { flex: 1, duration: 1.2, ease: "expo.out" });
			gsap.to(Array.from(items).filter(i => i !== item), { flex: 0.5, opacity: 0.2, duration: 1.2, ease: "expo.out" });
			
			// Show and start pulse
			gsap.to(glow, { opacity: 0.1, duration: 0.5 });
			pulse.play();
		});

		item.addEventListener('mouseleave', () => {
			gsap.to(items, { flex: 1, opacity: 1, duration: 1.2, ease: "expo.out" });
			
			// Hide and pause pulse
			gsap.to(glow, { opacity: 0, duration: 0.5 });
			pulse.pause();
		});
	});
}

window.addEventListener('DOMContentLoaded', () => {
	initStack();
});

$(window).on('page:ready', () => {
	initStack();
});

function initEnhancedHero() {
	var hero = document.querySelector('.hero--enhanced');
	if (!hero || hero.dataset.heroEnhanceInit === '1') return;

	hero.dataset.heroEnhanceInit = '1';

	function setPointerVars(x, y) {
		hero.style.setProperty('--hero-pointer-x', x.toFixed(3));
		hero.style.setProperty('--hero-pointer-y', y.toFixed(3));
	}

	function handlePointerMove(event) {
		var rect = hero.getBoundingClientRect();
		if (!rect.width || !rect.height) return;

		var x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		var y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
		var clampedX = Math.max(-1, Math.min(1, x));
		var clampedY = Math.max(-1, Math.min(1, y));
		setPointerVars(clampedX, clampedY);
	}

	function handlePointerLeave() {
		setPointerVars(0, 0);
	}

	hero.addEventListener('mousemove', handlePointerMove, { passive: true });
	hero.addEventListener('mouseleave', handlePointerLeave, { passive: true });
}

window.addEventListener('DOMContentLoaded', function() {
	initEnhancedHero();
});

$(window).on('page:ready', function() {
	initEnhancedHero();
});

function rafThrottle(fn) {
	var ticking = false;
	return function() {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(function() {
			ticking = false;
			fn();
		});
	};
}










/* 3. Header */
(function() {
	var modifier = {
		FIXED: 'header--fixed',
		IS_FIXED: 'is-fixed',
		ABSOLUTE: 'header--absolute',
		WHITE: 'header--white',
		BG_WHITE: 'header--bg-white'
	};

	function initHeaderState() {
		var header = $('.header');
		if (!header.length) return;
		$(window).off('scroll.headerState resize.headerState');
		header.removeClass('header--idle-hidden');
		header.addClass(modifier.FIXED + ' ' + modifier.IS_FIXED);
		header.css({
			'top': '0',
			'left': '0',
			'right': '0',
			'transform': 'none'
		});

		// Keep document flow stable where header is not intentionally absolute.
		if (!header.hasClass(modifier.ABSOLUTE)) {
			var headerHeight = header.outerHeight() || 0;
			$('body').css('padding-top', headerHeight + 'px');
		}
	}

	$(window).off('page:ready.headerState init.headerState');
	$(window).on('page:ready.headerState init.headerState', initHeaderState);
	$(window).off('resize.headerStateStatic').on('resize.headerStateStatic', rafThrottle(initHeaderState));

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			$(window).trigger('init.headerState');
		}, { once: true });
	} else {
		$(window).trigger('init.headerState');
	}
})();

/* Hide header on idle */
	(function() {
		var header = document.querySelector('.header');
		if (!header) return;
		header.classList.remove('header--idle-hidden');
	})();

	/* Change logo color from black to white on scroll */
		(function() {
			var enterThreshold = 110;
		var exitThreshold = 70;
		var isScrolled = false;
		var isMobile = window.matchMedia && window.matchMedia('(max-width: 991px)').matches;

		if (isMobile) {
			$('.header').removeClass('header--scrolled');
			$(window).off('scroll.logoColor page:ready.logoColor');
			return;
		}

			function updateLogoColor() {
				var header = $('.header');
				if (!header.length) return;
				var scroll = $(window).scrollTop();
		if (!isScrolled && scroll > enterThreshold) {
			isScrolled = true;
			header.addClass('header--scrolled');
		} else if (isScrolled && scroll < exitThreshold) {
			isScrolled = false;
			header.removeClass('header--scrolled');
		}
	}

	var onLogoColorScroll = rafThrottle(updateLogoColor);
	$(window).off('scroll.logoColor').on('scroll.logoColor', onLogoColorScroll);
	$(window).off('page:ready.logoColor').on('page:ready.logoColor', updateLogoColor);

	// Check on page load
	updateLogoColor();
})();

	/* Hide main-screen section on scroll */
		(function() {
			var enterThreshold = 240;
		var exitThreshold = 140;
		var isHidden = false;
		var isMobile = window.matchMedia && window.matchMedia('(max-width: 991px)').matches;

		if (isMobile) {
			$('.main-screen').removeClass('main-screen--scrolled');
			$(window).off('scroll.mainScreen page:ready.mainScreen');
			return;
		}

			function updateMainScreen() {
				var mainScreen = $('.main-screen');
				if (!mainScreen.length) return;
				var scroll = $(window).scrollTop();
		if (!isHidden && scroll > enterThreshold) {
			isHidden = true;
			mainScreen.addClass('main-screen--scrolled');
		} else if (isHidden && scroll < exitThreshold) {
			isHidden = false;
			mainScreen.removeClass('main-screen--scrolled');
		}
	}

	var onMainScreenScroll = rafThrottle(updateMainScreen);
	$(window).off('scroll.mainScreen').on('scroll.mainScreen', onMainScreenScroll);
	$(window).off('page:ready.mainScreen').on('page:ready.mainScreen', updateMainScreen);

	// Check on page load
	updateMainScreen();
})();

/* Hero arrow: static SVG (3D/WebGL removed) */
(function() {
	var arrowIcon = $('.arrow-link__icon--scroll');
	if (!arrowIcon.length) return;

	var arrowPath = arrowIcon.find('#hero-scroll-arrow-path').get(0) || arrowIcon.find('path').get(0);
	var PATH_DOWN = "M 12 5 L 12 19 M 5 12 L 12 19 L 19 12";

	if (arrowPath) {
		arrowPath.setAttribute('d', PATH_DOWN);
	}

	arrowIcon.removeClass('arrow-link__icon--webgl-ready');
	arrowIcon.find('.hero-arrow-webgl').remove();
	arrowIcon.find('svg').css('display', '');
})();

/* Hero scroll-driven effects */
	(function() {
		var heroSection = document.querySelector('.hero--enhanced');
		var heroTitle = heroSection ? heroSection.querySelector('.hero-title') : null;
		var cue = document.querySelector('.hero__scroll-cue');
		if (!heroSection) return;
		if (window.matchMedia && window.matchMedia('(max-width: 991px)').matches) return;

	var hideAt = 10;
	var showAt = 4;
	var isHidden = false;
	var blurMaxScroll = 260;
	var blurMaxPx = 8;
	var imageScaleMin = 1.06;
	var imageScaleMax = 1.09;
	var imageOpacityMin = 0.62;
	var imageOpacityMax = 0.8;
	var titleTweenId = 'hero-title-horizontal';
	var titleFromVw = 0;
	var titleToVw = -22;
	var titleScrollDistance = 900;
	var scrollTriggerLoader = null;
	var isTitleGsapBound = false;

	if (heroTitle) {
		heroTitle.style.removeProperty('transform');
		heroSection.style.setProperty('--hero-title-shift-x', '0px');
	}

	function vwToPx(vwValue) {
		return (window.innerWidth || document.documentElement.clientWidth || 0) * (vwValue / 100);
	}

	function applyTitleShift(shiftPx) {
		if (!heroTitle) return;
		heroTitle.style.transform = 'translate3d(' + shiftPx.toFixed(2) + 'px, 0, 0)';
	}

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
			script.onerror = function() {
				resolve();
			};
			document.head.appendChild(script);
		});
	}

	function ensureHeroTitleScrollTrigger() {
		if (!heroTitle || !window.gsap) {
			return Promise.resolve();
		}
		if (window.ScrollTrigger) {
			window.gsap.registerPlugin(window.ScrollTrigger);
			return Promise.resolve();
		}
		if (scrollTriggerLoader) return scrollTriggerLoader;

		scrollTriggerLoader = loadScriptOnce(
			GSAP_SCROLLTRIGGER_URL,
			'data-hero-title-scrolltrigger'
		).then(function() {
			if (window.gsap && window.ScrollTrigger) {
				window.gsap.registerPlugin(window.ScrollTrigger);
			}
		});

		return scrollTriggerLoader;
	}

	function initHeroTitleHorizontalScroll() {
		if (!heroTitle || !window.gsap) return;

		ensureHeroTitleScrollTrigger().then(function() {
			if (!window.gsap || !window.ScrollTrigger) return;

				var gsap = window.gsap;
				var ScrollTrigger = window.ScrollTrigger;
				var existing = ScrollTrigger.getById(titleTweenId);
				if (existing) existing.kill();

				var startX = vwToPx(titleFromVw);
				var endX = vwToPx(titleToVw);
				heroSection.style.setProperty('--hero-title-shift-x', startX.toFixed(2) + 'px');
				applyTitleShift(startX);

				ScrollTrigger.create({
					id: titleTweenId,
					trigger: heroSection,
					start: 'top top',
					end: '+=' + titleScrollDistance,
					scrub: 0.5,
					invalidateOnRefresh: true,
					onUpdate: function(self) {
						var x = startX + ((endX - startX) * self.progress);
						heroSection.style.setProperty('--hero-title-shift-x', x.toFixed(2) + 'px');
						applyTitleShift(x);
					},
					onRefresh: function() {
						startX = vwToPx(titleFromVw);
						endX = vwToPx(titleToVw);
					}
				});

				isTitleGsapBound = true;
				ScrollTrigger.refresh();
		});
	}

	function updateHeroVisualProgress(scrollY) {
		if (!heroSection) return;

		var progress = Math.max(0, Math.min(1, scrollY / blurMaxScroll));
		var blurPx = blurMaxPx * progress;
		var imageScale = imageScaleMin + ((imageScaleMax - imageScaleMin) * progress);
		var imageOpacity = imageOpacityMax - ((imageOpacityMax - imageOpacityMin) * progress);
		var titleProgress = Math.max(0, Math.min(1, scrollY / titleScrollDistance));
		var titleShiftPx = vwToPx(titleFromVw) + ((vwToPx(titleToVw) - vwToPx(titleFromVw)) * titleProgress);

		heroSection.style.setProperty('--hero-blur', blurPx.toFixed(2) + 'px');
		heroSection.style.setProperty('--hero-image-scale', imageScale.toFixed(4));
		heroSection.style.setProperty('--hero-image-opacity', imageOpacity.toFixed(4));
		if (!isTitleGsapBound) {
			heroSection.style.setProperty('--hero-title-shift-x', titleShiftPx.toFixed(2) + 'px');
			applyTitleShift(titleShiftPx);
		}
	}

	function updateCueVisibility() {
		var y = window.pageYOffset || window.scrollY || 0;

		if (heroSection) {
			heroSection.classList.toggle('hero--scroll-started', y > 0);
		}
		updateHeroVisualProgress(y);

		if (cue) {
			if (!isHidden && y > hideAt) {
				isHidden = true;
				cue.classList.add('is-hidden');
			} else if (isHidden && y <= showAt) {
				isHidden = false;
				cue.classList.remove('is-hidden');
			}
		}
	}

	var ticking = false;
	function onScroll() {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(function() {
			ticking = false;
			updateCueVisibility();
		});
	}

	window.addEventListener('scroll', onScroll, { passive: true });
	$(window).on('page:ready', function() {
		updateCueVisibility();
		initHeroTitleHorizontalScroll();
	});
	updateCueVisibility();
	initHeroTitleHorizontalScroll();
})();

	/* Desktop text color transition (white -> black on scroll) */
	(function() {
		var desktopQuery = window.matchMedia ? window.matchMedia('(min-width: 992px)') : null;
		var scrolled = false;
		var ticking = false;

		function isDesktop() {
			return desktopQuery ? desktopQuery.matches : window.innerWidth >= 992;
		}

		function isExcludedPage() {
			var body = document.body;
			if (!body) return true;
			return body.classList.contains('home-index') || body.classList.contains('work-archive');
		}

		function clearColorState() {
			$('.text-scroll-change').removeClass('text-scroll-change--scrolled text-scroll-change--locked');
			$('body').removeClass('text-scroll-change--scrolled text-scroll-change--locked');
			scrolled = false;
		}

		function getThresholds() {
			var hero = document.querySelector('.hero.main-screen');
			var enter = 110;
			if (hero) {
				enter = Math.max(72, Math.round(hero.getBoundingClientRect().height * 0.22));
			}
			var exit = Math.max(36, enter - 38);
			return { enter: enter, exit: exit };
		}

		function setScrolledState(next) {
			if (scrolled === next) return;
			scrolled = next;
			$('body').toggleClass('text-scroll-change--scrolled', next);
			$('.text-scroll-change').toggleClass('text-scroll-change--scrolled', next);
		}

		function updateColorState() {
			document.documentElement.style.setProperty('--scroll-bg-alpha', '0');
			$('.webpage').removeClass('webpage--scroll-bg');

			if (!isDesktop() || isExcludedPage()) {
				clearColorState();
				return;
			}

			var y = window.pageYOffset || document.documentElement.scrollTop || 0;
			var t = getThresholds();

			if (!scrolled && y > t.enter) {
				setScrolledState(true);
			} else if (scrolled && y < t.exit) {
				setScrolledState(false);
			}
		}

		function requestUpdate() {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(function() {
				ticking = false;
				updateColorState();
			});
		}

		$(window).off('scroll.textColor page:ready.textColor resize.textColor load.textColor');
		$(window).on('scroll.textColor', requestUpdate);
		$(window).on('page:ready.textColor', requestUpdate);
		$(window).on('resize.textColor', requestUpdate);
		$(window).on('load.textColor', requestUpdate);

		window.addEventListener('pageshow', requestUpdate);
		if (desktopQuery && typeof desktopQuery.addEventListener === 'function') {
			desktopQuery.addEventListener('change', requestUpdate);
		}

		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', function() {
				updateColorState();
			}, { once: true });
		} else {
			updateColorState();
		}
	})();

const randomInt = max => Math.floor(Math.random() * max)
const randomFromArray = array => array[randomInt(array.length)]


























/* 4. scramble effect */


const scrambleText = (text) => {
  const chars = '*?><[]&@#)(.%$-_:/;?!'.split('')
  return text
    .split('')
    .map(x => randomInt(3) > 1 ? randomFromArray(chars) : x)
    .join('')
}

function initScrambleHover(root) {
  (root || document).querySelectorAll('.scramble').forEach(element => {
    if (element.dataset.scrambleInit === '1') return;
    element.dataset.scrambleInit = '1';

    const originalText = element.innerText;
    let interval, timeout;

    element.addEventListener('mouseover', () => {
      clearInterval(interval);
      clearTimeout(timeout);

      interval = setInterval(() => {
        element.innerText = scrambleText(originalText);
      }, 100);

      timeout = setTimeout(() => {
        clearInterval(interval);
        element.innerText = originalText;
      }, 500);
    });

    element.addEventListener('mouseout', () => {
      clearInterval(interval);
      clearTimeout(timeout);
      element.innerText = originalText;
    });
  });
}

initScrambleHover(document);
$(window).on('page:ready', () => {
  initScrambleHover(document);
});




let timer;

var onArrowPauseScroll = rafThrottle(function() {
	const arrow = document.querySelector(".bigicon");
	if (!arrow) return;
	arrow.classList.add("paused");

	clearTimeout(timer);
	timer = setTimeout(() => {
		arrow.classList.remove("paused");
	}, 100);
});

if (window.matchMedia && window.matchMedia('(min-width: 992px)').matches) {
	window.addEventListener("scroll", onArrowPauseScroll, { passive: true });
}

var body = $('body');
var DURATION = 300;
var mobileBreakpoint = 992;

function setOverlay(cb) {
	var overlay = $('<div class="overlay mobile-menu-overlay"></div>');
	overlay.on('click', cb);
	return overlay;
}

function getScrollbarWidth() {
	var block = $('<div>').css({
		'height': '50px',
		'width': '50px'
	});
	var indicator = $('<div>').css({
		'height': '200px'
	});

	$('body').append(block.append(indicator));

	var w1 = $('div', block).innerWidth();
	block.css('overflow-y', 'scroll');

	var w2 = $('div', block).innerWidth();
	$(block).remove();

	return (w1 - w2);
}

function animate({
	timing,
	draw,
	duration
}) {
	let start = performance.now();

	requestAnimationFrame(function animate(time) {
		let timeFraction = (time - start) / duration;

		if (timeFraction > 1) {
			timeFraction = 1;
		}

		let progress = timing(timeFraction);

		draw(progress);

		if (timeFraction < 1) {
			requestAnimationFrame(animate);
		}
	});
}









const btn = document.querySelector(".btn");
const park_sec = document.querySelectorAll(".park_sec");

var sendFlag = 0;

if (btn) {
	btn.addEventListener("click", function() {
		this.classList.toggle("active");

		if (sendFlag === 0) {
			sendFlag = 1;
			this.textContent = "Hide";
			park_sec.forEach(function(item) {
				item.classList.add("active");
			});
		} else {
			sendFlag = 0;
			this.textContent = "Show All";
			park_sec.forEach(function(item) {
				item.classList.remove("active");
			});
		}
	});
}









// "use strict";
// const preview = document.getElementById("preview");
// const upload = document.getElementById("upload");
// const color = document.getElementById("color");
// const filterSelect = document.getElementById("filter-select");
// upload.addEventListener("input", e => {
//     const file = e.target.files[0];
//     if (!file)
//         return;
//     preview.src = URL.createObjectURL(file);
// });
// color.addEventListener("input", e => {
//     const val = color.value;
//     flood.setAttribute('flood-color', val);
//     floodHd.setAttribute('flood-color', val);
// });
// filterSelect.addEventListener("change", setFilter);
// function setFilter() {
//     const val = filterSelect.value;
//     preview.style.filter = val ? `url(#${val})` : "none";
// }
// setFilter();




/* Scroll-driven icon rotation */


var onIconRotateScroll = rafThrottle(function() {
  const bigicon = document.querySelector(".bigiconk");
  const arrow = document.querySelector(".icon svg");
  if (!bigicon || !arrow) return;

  // Get element position relative to viewport
  const rect = bigicon.getBoundingClientRect();
  const viewportCenter = window.innerHeight / 2;

  // Check if the element is near the middle of the viewport
  if (rect.top < viewportCenter && rect.bottom > viewportCenter) {
    arrow.style.transform = "rotate(75deg)";
    arrow.style.transformOrigin = "center";
    arrow.style.transformBox = "fill-box"; // ensures SVG rotates around center
  } else {
    arrow.style.transform = "rotate(0deg)"; // reset if not in middle
  }
});

if (window.matchMedia && window.matchMedia('(min-width: 992px)').matches) {
	document.addEventListener("scroll", onIconRotateScroll, { passive: true });
}











/* 6. Mobile menu */
(function() {
	var modifier = {
		MOBILE_CANVAS: 'mobile-canvas--opened',
		TOGGLE: 'menu-toggle--opened'
	};
	var enableToggleThreeDots = false;
	var threeLoaderPromise = null;
	var toggleDotsInstances = new Map();
	var toggleDotsSyncFrame = null;

	function loadThreeLibrary() {
		if (window.THREE) {
			return Promise.resolve();
		}

		if (threeLoaderPromise) {
			return threeLoaderPromise;
		}

		threeLoaderPromise = new Promise(function(resolve) {
			var existingScript = document.querySelector('script[data-menu-three="1"]');
			if (existingScript) {
				existingScript.addEventListener('load', function() { resolve(); }, { once: true });
				existingScript.addEventListener('error', function() { resolve(); }, { once: true });
				return;
			}

			var script = document.createElement('script');
			script.src = 'assets/js/libs/three.global.js';
			script.async = true;
			script.defer = true;
			script.setAttribute('data-menu-three', '1');
			script.onload = function() { resolve(); };
			script.onerror = function() { resolve(); };
			document.head.appendChild(script);
		});

		return threeLoaderPromise;
	}

	function disposeToggleDots(line) {
		var instance = toggleDotsInstances.get(line);
		if (!instance) return;

		if (instance.classObserver) {
			instance.classObserver.disconnect();
		}

		instance.material.dispose();
		instance.geometry.dispose();
		instance.renderer.dispose();

		if (instance.canvas && instance.canvas.parentNode) {
			instance.canvas.parentNode.removeChild(instance.canvas);
		}

		line.classList.remove('menu-toggle__line--three-ready');

		if (instance.toggle && instance.toggle.__menuDotsFxSource === line) {
			delete instance.toggle.__menuDotsFx;
			delete instance.toggle.__menuDotsFxSource;
		}

		toggleDotsInstances.delete(line);
	}

	function destroyAllToggleDots() {
		Array.from(toggleDotsInstances.keys()).forEach(function(line) {
			disposeToggleDots(line);
		});
	}

	function renderToggleDots(instance) {
		var toggle = instance.toggle;
		var isOpen = toggle.classList.contains(modifier.TOGGLE);
		var color = window.getComputedStyle(toggle).color || '#ff5b33';
		instance.material.uniforms.uColor.value.set(color);
		instance.material.uniforms.uOpen.value = isOpen ? 1 : 0;
		instance.material.uniforms.uSpreadPx.value = instance.anim.spread;
		instance.material.uniforms.uYOffsetPx.value = instance.anim.yOffset;
		instance.renderer.render(instance.scene, instance.camera);
	}

	function resizeToggleDots(instance) {
		var rect = instance.line.getBoundingClientRect();
		var width = Math.max(1, Math.round(rect.width));
		var height = Math.max(1, Math.round(rect.height));
		var dpr = Math.min(window.devicePixelRatio || 1, 2);
		instance.renderer.setPixelRatio(dpr);
		instance.renderer.setSize(width, height, false);
		instance.material.uniforms.uResolution.value.set(width, height);
	}

	function attachToggleDotsFx(instance) {
		var toggle = instance.toggle;
		toggle.__menuDotsFxSource = instance.line;
		toggle.__menuDotsFx = function(phase) {
			if (!window.gsap) return;

			var anim = instance.anim;
			window.gsap.killTweensOf(anim);

			if (phase === 'hover-in') {
				window.gsap.to(anim, {
					duration: 0.26,
					spread: 5.6,
					yOffset: 0,
					ease: 'back.out(2.2)',
					onUpdate: function() { renderToggleDots(instance); }
				});
				return;
			}

			if (phase === 'hover-out') {
				window.gsap.to(anim, {
					duration: 0.34,
					spread: 4.8,
					yOffset: 0,
					ease: 'power2.out',
					onUpdate: function() { renderToggleDots(instance); }
				});
				return;
			}

			if (phase === 'press') {
				var tl = window.gsap.timeline({
					defaults: { overwrite: 'auto' }
				});
				tl.to(anim, {
					duration: 0.1,
					spread: 4.1,
					yOffset: 0,
					ease: 'power2.out',
					onUpdate: function() { renderToggleDots(instance); }
				});
				tl.to(anim, {
					duration: 0.56,
					spread: 4.8,
					yOffset: 0,
					ease: 'elastic.out(1, 0.42)',
					onUpdate: function() { renderToggleDots(instance); }
				});
			}
		};
	}

	function createToggleDots(line) {
		if (!window.THREE) return null;

		var toggle = line.closest('.menu-toggle');
		if (!toggle) return null;

		var existingCanvas = line.querySelector('.menu-toggle__dots3d');
		if (existingCanvas) {
			existingCanvas.remove();
		}

		var canvas = document.createElement('canvas');
		canvas.className = 'menu-toggle__dots3d';
		line.appendChild(canvas);

		var renderer;
		try {
			renderer = new window.THREE.WebGLRenderer({
				canvas: canvas,
				alpha: true,
				antialias: true,
				premultipliedAlpha: true,
				powerPreference: 'low-power'
			});
		} catch (error) {
			if (canvas.parentNode) {
				canvas.parentNode.removeChild(canvas);
			}
			return null;
		}

		renderer.setClearColor(0x000000, 0);

		var scene = new window.THREE.Scene();
		var camera = new window.THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
		camera.position.z = 1;

		var geometry = new window.THREE.PlaneGeometry(2, 2);
		var material = new window.THREE.ShaderMaterial({
			transparent: true,
			depthWrite: false,
			uniforms: {
				uColor: { value: new window.THREE.Color('#ff5b33') },
				uOpen: { value: 0 },
				uSpreadPx: { value: 4.8 },
				uRadiusPx: { value: 3.0 },
				uYOffsetPx: { value: 0.0 },
				uResolution: { value: new window.THREE.Vector2(22, 12) }
			},
			vertexShader: [
				'varying vec2 vUv;',
				'void main() {',
				'  vUv = uv;',
				'  gl_Position = vec4(position, 1.0);',
				'}'
			].join('\n'),
			fragmentShader: [
				'precision mediump float;',
				'varying vec2 vUv;',
				'uniform vec3 uColor;',
				'uniform float uOpen;',
				'uniform float uSpreadPx;',
				'uniform float uRadiusPx;',
				'uniform float uYOffsetPx;',
				'uniform vec2 uResolution;',
				'float circleAlpha(vec2 p, vec2 center, float radius) {',
				'  float d = length(p - center);',
				'  float aa = max(fwidth(d) * 1.35, 0.6);',
				'  return 1.0 - smoothstep(radius - aa, radius + aa, d);',
				'}',
				'void main() {',
				'  vec2 p = (vUv - 0.5) * uResolution;',
				'  p.y += uYOffsetPx;',
				'  vec2 leftCenter = vec2(mix(-uSpreadPx, 0.0, uOpen), 0.0);',
				'  vec2 rightCenter = vec2(uSpreadPx, 0.0);',
				'  float leftDot = circleAlpha(p, leftCenter, uRadiusPx);',
				'  float rightDot = circleAlpha(p, rightCenter, uRadiusPx) * (1.0 - uOpen);',
				'  float alpha = max(leftDot, rightDot);',
				'  gl_FragColor = vec4(uColor, alpha);',
				'}'
			].join('\n')
		});

		var mesh = new window.THREE.Mesh(geometry, material);
		scene.add(mesh);

		var instance = {
			line: line,
			toggle: toggle,
			canvas: canvas,
			renderer: renderer,
			scene: scene,
			camera: camera,
			geometry: geometry,
			material: material,
			anim: {
				spread: 4.8,
				yOffset: 0
			},
			classObserver: null
		};

		if (window.MutationObserver) {
			var observedHeader = toggle.closest('.header');
			instance.classObserver = new window.MutationObserver(function() {
				renderToggleDots(instance);
			});
			instance.classObserver.observe(toggle, { attributes: true, attributeFilter: ['class', 'style'] });
			if (observedHeader) {
				instance.classObserver.observe(observedHeader, { attributes: true, attributeFilter: ['class', 'style'] });
			}
		}

		toggleDotsInstances.set(line, instance);
		line.classList.add('menu-toggle__line--three-ready');
		attachToggleDotsFx(instance);
		return instance;
	}

	function syncToggleDots() {
		if (!enableToggleThreeDots) {
			destroyAllToggleDots();
			return;
		}

		var isDesktop = $(window).width() >= mobileBreakpoint;
		if (isDesktop) {
			destroyAllToggleDots();
			return;
		}

		var lines = document.querySelectorAll('.menu-toggle .menu-toggle__line');
		if (!lines.length) {
			destroyAllToggleDots();
			return;
		}

		loadThreeLibrary().then(function() {
			if (!window.THREE) return;

			var alive = new Set();

			lines.forEach(function(line) {
				alive.add(line);
				var instance = toggleDotsInstances.get(line) || createToggleDots(line);
				if (!instance) return;

				resizeToggleDots(instance);
				renderToggleDots(instance);
			});

			Array.from(toggleDotsInstances.keys()).forEach(function(line) {
				if (!alive.has(line) || !document.body.contains(line)) {
					disposeToggleDots(line);
				}
			});
		});
	}

	function queueToggleDotsSync() {
		if (toggleDotsSyncFrame !== null) {
			cancelAnimationFrame(toggleDotsSyncFrame);
		}

		toggleDotsSyncFrame = requestAnimationFrame(function() {
			toggleDotsSyncFrame = null;
			syncToggleDots();
		});
	}

	function renderAllToggleDots() {
		toggleDotsInstances.forEach(function(instance) {
			renderToggleDots(instance);
		});
	}

	function syncToggleState(isOpen) {
		$('.menu-toggle')
			.attr('aria-expanded', isOpen ? 'true' : 'false')
			.attr('aria-label', isOpen ? 'Close menu' : 'Open menu');
		renderAllToggleDots();
	}

	function closeMenu() {
		$('.mobile-canvas').removeClass(modifier.MOBILE_CANVAS);
		$('.menu-toggle').removeClass(modifier.TOGGLE);
		syncToggleState(false);
		queueToggleDotsSync();
		$('body').css({
			'overflow': '',
			'margin-right': '0'
		});
		$('.mobile-menu-overlay').stop(true, true).fadeOut(DURATION, function() {
			$(this).remove();
		});
	}

	function openMenu() {
		var menu = $('.mobile-canvas');
		var toggle = $('.menu-toggle');
		if (!menu.length || !toggle.length) return;

		if (!$('.mobile-menu-overlay').length) {
			var overlay = setOverlay(closeMenu);
			overlay.hide();
			body.append(overlay);
			overlay.fadeIn(DURATION);
		}

		toggle.addClass(modifier.TOGGLE);
		menu.addClass(modifier.MOBILE_CANVAS);
		syncToggleState(true);
		queueToggleDotsSync();

		$('body').css({
			'overflow': 'hidden',
			'margin-right': $(window).width() >= mobileBreakpoint ? getScrollbarWidth() + 'px' : '0'
		});
	}

	function toggleMenu(evt) {
		evt.preventDefault();

		if ($('.mobile-canvas').hasClass(modifier.MOBILE_CANVAS)) {
			closeMenu();
		} else {
			openMenu();
		}
	}

	function bindMobileMenuEvents() {
		$(document).off('click.mobileMenuToggle', '.menu-toggle');
		$(document).on('click.mobileMenuToggle', '.menu-toggle', toggleMenu);

		$(document).off('click.mobileMenuLink', '.mobile-canvas .navigation__link');
		$(document).on('click.mobileMenuLink', '.mobile-canvas .navigation__link', function() {
			if ($(window).width() < mobileBreakpoint) {
				closeMenu();
			}
		});

		$(document).off('keydown.mobileMenu').on('keydown.mobileMenu', function(evt) {
			if (evt.key === 'Escape') {
				closeMenu();
			}
		});

		$(window).off('resize.mobileMenu');
		$(window).on('resize.mobileMenu', function() {
			if ($(window).width() >= mobileBreakpoint) {
				closeMenu();
			} else {
				queueToggleDotsSync();
			}
		});

			$(window).off('scroll.mobileMenuDots');
			if (enableToggleThreeDots) {
				$(window).on('scroll.mobileMenuDots', function() {
					renderAllToggleDots();
				});
			}
		}

	$(window).off('page:ready.mobileMenu init.mobileMenu');
	$(window).on('page:ready.mobileMenu init.mobileMenu', function() {
		closeMenu();
		bindMobileMenuEvents();
		queueToggleDotsSync();
	});

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			$(window).trigger('init.mobileMenu');
		}, { once: true });
	} else {
		$(window).trigger('init.mobileMenu');
	}
})();



/* Mobile hero dedupe (only where hero + oldhero coexist) */
(function() {
	function updateMobileHeroDupClass() {
		var bodyEl = document.body;
		if (!bodyEl) return;

		var isMobile = window.matchMedia('(max-width: 991px)').matches;
		var mainEl = document.querySelector('main');
		if (!isMobile || !mainEl) {
			bodyEl.classList.remove('has-mobile-hero-dup');
			return;
		}

		var hasTopHero = !!mainEl.querySelector('.hero.main-screen:not(.hero--enhanced)');
		var hasOldHero = !!mainEl.querySelector('.oldhero');
		bodyEl.classList.toggle('has-mobile-hero-dup', hasTopHero && hasOldHero);
	}

	var rafId = null;
	function queueUpdate() {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
		}
		rafId = requestAnimationFrame(function() {
			rafId = null;
			updateMobileHeroDupClass();
		});
	}

	document.addEventListener('DOMContentLoaded', queueUpdate);
	window.addEventListener('resize', queueUpdate, { passive: true });
	window.addEventListener('pageshow', queueUpdate, { passive: true });
})();

class TextScramble {
	constructor(el) {
	  this.el = el
	  this.chars = '!<>-_\\/[]{}—=+*^?#________'
	  this.update = this.update.bind(this)
	}
	setText(newText) {
	  const oldText = this.el.innerText
	  const length = Math.max(oldText.length, newText.length)
	  const promise = new Promise((resolve) => this.resolve = resolve)
	  this.queue = []
	  for (let i = 0; i < length; i++) {
		const from = oldText[i] || ''
		const to = newText[i] || ''
		const start = Math.floor(Math.random() * 40)
		const end = start + Math.floor(Math.random() * 40)
		this.queue.push({ from, to, start, end })
	  }
	  cancelAnimationFrame(this.frameRequest)
	  this.frame = 0
	  this.update()
	  return promise
	}
	update() {
	  let output = ''
	  let complete = 0
	  for (let i = 0, n = this.queue.length; i < n; i++) {
		let { from, to, start, end, char } = this.queue[i]
		if (this.frame >= end) {
		  complete++
		  output += to
		} else if (this.frame >= start) {
		  if (!char || Math.random() < 0.28) {
			char = this.randomChar()
			this.queue[i].char = char
		  }
		  output += `<span class="dud">${char}</span>`
		} else {
		  output += from
		}
	  }
	  this.el.innerHTML = output
	  if (complete === this.queue.length) {
		this.resolve()
	  } else {
		this.frameRequest = requestAnimationFrame(this.update)
		this.frame++
	  }
	}
	randomChar() {
	  return this.chars[Math.floor(Math.random() * this.chars.length)]
	}
  }
  
  
  const phrases = [
	'Designer',
	'Thinker',
	'Manager',
	'Inovator',
	'connect',
  ]
  
  const el = document.querySelector('.text')
  if (el) {
	const fx = new TextScramble(el)
	
	let counter = 0
	const next = () => {
		fx.setText(phrases[counter]).then(() => {
			setTimeout(next, 1900)
		})
		counter = (counter + 1) % phrases.length
	}
	
	next()
  }
  




/* 4. Change opacity logo on scroll */
(function() {
	var logo = $('.vertical-logo');

	if (logo.length !== 0) {
		var isMobile = window.matchMedia && window.matchMedia('(max-width: 991px)').matches;
		var logoLayer = logo.find('.vertical-logo__layer--yellow');
		var logoHeight = logo.outerHeight();
		var logoOffset = logo.offset().top;
		var shift = $('.header').outerHeight() * 2;
		var distance = (logoHeight + logoOffset) - shift;

		if (isMobile) {
			logoLayer.css('opacity', '1');
			$(window).off('scroll.logoOpacity resize.logoOpacity');
			return;
		}

		function changeOpacity(scroll) {
			var percent = scroll * 100 / distance;
			logoLayer.css('opacity', percent / 100);

			let opacity = logoLayer.css('opacity');

			if (scroll >= distance && opacity < 1) {
				logoLayer.css('opacity', '1');
			}
		}

		$(window).off('scroll.logoOpacity').on('scroll.logoOpacity', function() {
			var scroll = $(window).scrollTop();
			changeOpacity(scroll);
		});

		$(window).off('resize.logoOpacity').on('resize.logoOpacity', function() {
			var scroll = $(window).scrollTop();

			logoHeight = logo.outerHeight();
			logoOffset = logo.offset().top;
			shift = $('.header').outerHeight() * 2;
			distance = (logoHeight + logoOffset) - shift;

			changeOpacity(scroll);
		});

		changeOpacity($(window).scrollTop());
	}

})();

/* Mobile menu toggle GSAP micro-interactions */
(function() {
	if (!window.gsap) return;

	function isDesktopContext() {
		return (window.innerWidth || document.documentElement.clientWidth || 0) >= mobileBreakpoint;
	}

	function bindToggle(toggle) {
		if (!toggle || toggle.dataset.gsapToggleBound === '1') return;
		toggle.dataset.gsapToggleBound = '1';

		var nub = toggle.querySelector('.menu-toggle__line');
		if (!nub) return;

		var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		function baseBorderColor() {
			return toggle.classList.contains('menu-toggle--opened')
				? 'rgba(255, 152, 122, 0.78)'
				: 'rgba(255, 255, 255, 0.28)';
		}

		function activeShadow() {
			return toggle.classList.contains('menu-toggle--opened')
				? 'inset 0 1px 1px rgba(255, 208, 194, 0.46), inset 0 -7px 11px rgba(0, 0, 0, 0.42), 0 10px 22px rgba(253, 64, 21, 0.25)'
				: 'inset 0 1px 1px rgba(255, 255, 255, 0.34), inset 0 -7px 11px rgba(0, 0, 0, 0.42), 0 11px 24px rgba(253, 64, 21, 0.24)';
		}

		function glowIn() {
			window.gsap.to(toggle, {
				duration: 0.24,
				borderColor: 'rgba(255, 170, 145, 0.92)',
				boxShadow: activeShadow(),
				ease: 'power2.out',
				overwrite: 'auto'
			});
		}

		function glowOut() {
			window.gsap.to(toggle, {
				duration: 0.26,
				borderColor: baseBorderColor(),
				boxShadow: activeShadow(),
				ease: 'power2.out',
				overwrite: 'auto'
			});
		}

		if (!reduceMotion) {
			window.gsap.set(nub, { clearProps: 'x,y,rotation,scaleX,scaleY' });
			window.gsap.set(toggle, { borderColor: baseBorderColor(), boxShadow: activeShadow() });
		}

			function onHoverIn() {
				if (!isDesktopContext() || reduceMotion) return;
				window.gsap.to(nub, {
					duration: 0.22,
					filter: 'saturate(1.1) brightness(1.08)',
				ease: 'power2.out',
				overwrite: 'auto'
			});
		}

			function onHoverOut() {
				if (!isDesktopContext() || reduceMotion) return;
				window.gsap.to(nub, {
					duration: 0.22,
					filter: toggle.classList.contains('menu-toggle--opened')
					? 'saturate(1.12) brightness(1.06)'
					: 'none',
				ease: 'power2.out',
				overwrite: 'auto'
			});
		}

		function onMouseEnter() {
			onHoverIn();
			glowIn();
		}

		function onMouseLeave() {
			onHoverOut();
			glowOut();
		}

			function onPress() {
				if (!isDesktopContext() || reduceMotion) return;
				var tl = window.gsap.timeline({ defaults: { overwrite: 'auto' } });
			tl.to(toggle, {
				duration: 0.09,
				scale: 0.94,
				ease: 'power2.out'
			});
			tl.to(toggle, {
				duration: 0.4,
				scale: 1,
				ease: 'power2.out'
			});
			tl.to(nub, {
				duration: 0.12,
				scale: 0.92,
				ease: 'power2.out'
			}, 0);
			tl.to(nub, {
				duration: 0.28,
				scale: 1,
				ease: 'power2.out'
			}, 0.1);
		}

			function onStateChange() {
				if (!isDesktopContext() || reduceMotion) return;
				window.gsap.to(nub, {
				duration: 0.24,
				filter: toggle.classList.contains('menu-toggle--opened')
					? 'saturate(1.12) brightness(1.06)'
					: 'none',
				ease: 'power2.out',
				overwrite: 'auto'
			});
			window.gsap.to(toggle, {
				duration: 0.24,
				borderColor: baseBorderColor(),
				boxShadow: activeShadow(),
				ease: 'power2.out',
				overwrite: 'auto'
			});
		}

		toggle.addEventListener('mouseenter', onMouseEnter, { passive: true });
		toggle.addEventListener('mouseleave', onMouseLeave, { passive: true });
		toggle.addEventListener('focus', onHoverIn, { passive: true });
		toggle.addEventListener('blur', onHoverOut, { passive: true });
		toggle.addEventListener('click', onPress, { passive: true });

		if (window.MutationObserver) {
			var observer = new window.MutationObserver(onStateChange);
			observer.observe(toggle, { attributes: true, attributeFilter: ['class'] });
		}
	}

	function initToggleMicroInteractions() {
		document.querySelectorAll('.menu-toggle').forEach(bindToggle);
	}

	$(window).off('page:ready.menuToggleGsap init.menuToggleGsap');
	$(window).on('page:ready.menuToggleGsap init.menuToggleGsap', initToggleMicroInteractions);

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			$(window).trigger('init.menuToggleGsap');
		}, { once: true });
	} else {
		$(window).trigger('init.menuToggleGsap');
	}
})();

/* 5. Fixed footer */
(function() {
	function resetFooterFlow() {
		var footer = $('.__js_fixed-footer, .footer');
		if (!footer.length) return;

		footer.css({
			'position': '',
			'left': '',
			'right': '',
			'bottom': ''
		});
		body.css('padding-bottom', '0');
	}

	$(window)
		.off('load.fixedFooter page:ready.fixedFooter resize.fixedFooter')
		.on('load.fixedFooter page:ready.fixedFooter resize.fixedFooter', function() {
			requestAnimationFrame(resetFooterFlow);
		});
})();



/* 7. Hint fields */
(function() {
	var fields = $('.field input, .field textarea');
	//var fields = $('.field input').add('.field textarea');
	var ModifierClass = 'field--filled';

	function toggleFilledClass(field) {
		if ($(field).val().trim()) {
			$(field).parent().addClass(ModifierClass);
		} else {
			$(field).parent().removeClass(ModifierClass);
		}
	}

	fields.on('input', function() {
		toggleFilledClass(this);
	});

	fields.on('blur', function() {
		toggleFilledClass(this);
	});

	// Initialize on page load for fields that already have values
	fields.each(function() {
		toggleFilledClass(this);
	});
})();

/* 8. Accordion */


/*** 9. Carousels ***/


/* 10. Animation of statistics */
(function() {
	if (typeof $.fn.easy_number_animate !== 'function') {
		return;
	}

	$(window).on('load', function() {
		var statistics = $('.statistics');
		var numbers = $('.__js_number');
		var animationIsDone = false;
		var scroll = $(window).scrollTop() + $(window).height();
		var isMobile = window.matchMedia && window.matchMedia('(max-width: 991px)').matches;

		if ($('*').is('.statistics')) {
			var offset = statistics.offset().top;

			if (isMobile) {
				animateNumbers();
				return;
			}

			if (!animationIsDone && scroll >= offset) {
				animateNumbers();
			}

			$(window).off('scroll.statistics').on('scroll.statistics', function() {
				scroll = $(window).scrollTop() + $(window).height();

				if (!animationIsDone && scroll >= offset) {
					animateNumbers();
				}
			});
		}

		function animateNumbers() {
			numbers.each(function() {
				var endValue = parseInt($(this).attr('data-end-value'), 10);

				$(this).easy_number_animate({
					start_value: 0,
					end_value: endValue,
					duration: 1800
				});

			});

			animationIsDone = true;
		}
	});
})();

/* 11. Tooltip pages */
(function() {
	if (typeof $.fn.marquee !== 'function') {
		return;
	}

	var windowWidth = $(window).width();

	var marqueeSpeed = windowWidth < mobileBreakpoint ? 10000 : 25000;

	$('.__js-marquee').on('beforeStarting', function() {
		var item = $('.tooltip__item');
		item.on('mouseover', onMarqueeItemHover);
	}).marquee({
		//speed in milliseconds of the marquee
		duration: marqueeSpeed,
		//gap in pixels between the tickers
		gap: 0,
		//time in milliseconds before the marquee will start animating
		delayBeforeStart: 0,
		//'left' or 'right'
		direction: 'left',
		//true or false - should the marquee be duplicated to show an effect of continues flow
		duplicated: true,
		startVisible: true
	});

	$('.__js-marquee--reverse').on('beforeStarting', function() {
		var item = $('.tooltip__item');
		item.on('mouseover', onMarqueeItemHover);
	}).marquee({
		//speed in milliseconds of the marquee
		duration: marqueeSpeed,
		//gap in pixels between the tickers
		gap: 0,
		//time in milliseconds before the marquee will start animating
		delayBeforeStart: 0,
		//'left' or 'right'
		direction: 'right',
		//true or false - should the marquee be duplicated to show an effect of continues flow
		duplicated: true,
		startVisible: true
	});

	function onMarqueeItemHover() {
		var current = $(this);
		var parent = current.closest('.tooltip__marquee');
		var imageData = {
			url: current.attr('data-image'),
			url2x: current.attr('data-image2x'),
			w: current.attr('data-image-w'),
			h: current.attr('data-image-h'),
			isWebp: current.attr('data-webp')
		};

		var itemCard = createItemCard(imageData);

		parent.marquee('pause');
		current.append(itemCard);
		current.off('mousemove.tooltipCard mouseout.tooltipCard');
		current.on('mousemove.tooltipCard', function(evt) {
			var card = current.find('.tooltip__card');
			var x = evt.pageX - current.offset().left;
			var y = evt.pageY - current.offset().top;
			card.css({
				'left': x + 'px',
				'top': y + 'px'
			});
		});

		current.one('mouseout.tooltipCard', function() {
			parent.marquee('resume');
			current.off('mousemove.tooltipCard');
			current.find('.tooltip__card').remove();
		});
	}

	function createItemCard(imageData) {
		if (imageData.url) {
			var card = $('<div class="tooltip__card"></div>');
			var format = imageData.url.slice(imageData.url.lastIndexOf('.'));

			var path = {
				'1x': imageData.url.slice(0, -format.length),
				'2x': imageData.url2x ? imageData.url2x.slice(0, -format.length) : imageData.url.slice(0, -format.length)
			};

			if (imageData.isWebp) {

				var image = $('<picture><source type="image/webp" srcset="' + path['1x'] + '.webp 1x, ' + path['2x'] + '.webp 2x"><img src="' + path['1x'] + format + '" srcset="' + path['2x'] + format + ' 2x" width="' + imageData.w + '" height="' + imageData.h + '" alt=""></picture>');

			} else {

				var image = $('<img src="' + path['1x'] + format + '" srcset="' + path['2x'] + format + ' 2x" width="' + imageData.w + '" height="' + imageData.h + '" alt="">');

			}

			card.append(image);
			card.css({
				'position': 'absolute'
			})

			return card;
		}
	}
})();

/* 12. Masonry */
(function() {
	if (typeof $.fn.isotope !== 'function') {
		return;
	}

	$(window).on('load', function() {
		var filterItem = $('.filter__item');
		var filterActiveClass = 'filter__item--active';

		var grid = $('.__js_blog-grid, .__js_portfolio-section-masonry').isotope({
			itemSelector: '.__js_masonry-item',
			layoutMode: 'packery',
			packery: {
				gutter: 0
			},
		});

		filterItem.on('click', function() {
			var filterValue = $(this).attr('data-filter');

			$(this).addClass(filterActiveClass).siblings().removeClass(filterActiveClass);
			grid.isotope({
				filter: filterValue
			});
		});
	});
})();

/* 13. Pagepiling */
(function() {
	if (typeof $.fn.pagepiling !== 'function') {
		return;
	}

	var headerClasses = $('.header').attr('class');

	initFullPage();

	if ($('#pagepiling .section.active').hasClass('dark')) {
		setDark();
	}

	function initFullPage() {
		if ($('#pagepiling') && $('#pagepiling').length > 0) {
			$('#pagepiling').pagepiling({
				scrollingSpeed: 280,
				loopBottom: true,
				navigation: false,
				afterRender: function() {
					$('.parallax-projects__nav span').height($('.parallax-projects__nav').height() / $('#pagepiling .section').length);
				},
				afterLoad: function(anchorLink, index) {
					var current = $('#pagepiling .section.active');

					if (current.hasClass('dark')) {
						setDark();
					} else {
						removeDark();
					}

					$('.fp-table.active .aos-init').addClass('aos-animate');

					$('.parallax-projects__nav span').height($('.parallax-projects__nav').height() / $('#pagepiling .section').length * index);
				}
			});
		}
	}

	function setDark() {
		$('.webpage').addClass('webpage--parallax-dark');
		$('.header').removeClass('header--white');
	}

	function removeDark() {
		$('.webpage').removeClass('webpage--parallax-dark');
		$('.header').addClass(headerClasses);
	}
})();

/* 14. Animation of skills */
(function() {
	if (typeof $.fn.easy_number_animate !== 'function') {
		return;
	}

	$(window).on('load', function() {
		var skills = $('.skills');
		var skill = $('.skill');
		var numbers = $('.skill .__js_number');
		var animationIsDone = false;
		var scroll = $(window).scrollTop() + $(window).height();
		var isMobile = window.matchMedia && window.matchMedia('(max-width: 991px)').matches;

		var duration = 1800;

		if ($('*').is('.skills')) {
			var offset = skills.offset().top;

			if (isMobile) {
				animateNumbers();
				animateProgress();
				return;
			}

			if (!animationIsDone && scroll >= offset) {
				animateNumbers();
				animateProgress();
			}

			$(window).off('scroll.skills').on('scroll.skills', function() {
				scroll = $(window).scrollTop() + $(window).height();

				if (!animationIsDone && scroll >= offset) {
					animateNumbers();
					animateProgress();
				}
			});
		}

		function animateNumbers() {
			numbers.each(function() {
				var endValue = parseInt($(this).parent().parent().parent().attr('data-percent'), 10);

				$(this).easy_number_animate({
					start_value: 0,
					end_value: endValue,
					duration: 1800
				});

			});

			animationIsDone = true;
		}

		function animateProgress() {
			skill.each(function() {
				var current = $(this);
				var progress = current.find('.skill__progress');
				var percent = parseInt(current.attr('data-percent'), 10);

				progress.attr('style', 'transform: scale(' + (percent / 100) + ', 1)')
			});
		}
	});
})();

/* 15. Anchor */
(function() {
	anchorScroll($('.anchor'));

	function anchorScroll(e) {
		e.on('click', function(event) {
			var link = $(this).attr('href');
			if (!link || link.charAt(0) !== '#') return;
			var target = $(link);
			if (!target.length) return;
			var to = target.offset().top;
			if (typeof to !== 'number') return;
			event.preventDefault();
			$('body, html').animate({
				scrollTop: to
			}, 800);
		});
	}
})();

/* 16. Projects listing */
(function() {
	var container = $('.projects-listing__container');

	if (container.length !== 0) {
		var aside = $('.projects-listing__aside');
		var title = $('.projects-listing__title');
		var category = $('.projects-listing__category');
		var btn = $('.projects-listing__more');
		var cards = $('.project-card');
		var isFixed = false;

		var currentCard = cards[0];
		var hideClass = 'd-none';
		var containerParams = {
			TOP: container.offset().top,
			LEFT: container.offset().left,
			HEIGHT: container.height(),
			WIDTH: container.width(),
			BOTTOM: container.offset().top + container.height(),
			LEFT_PADDING: parseInt(container.css('padding-left'), 10)
		};

		var maxTop = $(window).width() >= 768 ? $(cards[cards.length - 1]).offset().top - containerParams.TOP : containerParams.BOTTOM - aside.outerHeight();

		function changeProjectMeta() {
			title.html(currentCard.attr('data-title'));
			btn.attr('href', currentCard.attr('data-url'));

			if (currentCard.attr('data-category')) {
				category.removeClass(hideClass).text(currentCard.attr('data-category'));
			} else {
				category.addClass(hideClass).text('');
			}
		}

		function changeCurrentCard(index, item) {
			if (aside.offset().top >= item.offset().top) {
				currentCard = item;
				changeProjectMeta();
			}
		}

			$(window).off('scroll.projectsListing').on('scroll.projectsListing', function() {
				var scroll = $(window).scrollTop();
				if ($(window).width() < 768) {
					aside.removeAttr('style');
					return;
				}
				isFixed = scroll > containerParams.TOP && scroll <= maxTop;

				if (isFixed) {
					aside.css({
						'position': 'fixed',
						'left': (containerParams.LEFT + containerParams.LEFT_PADDING) + 'px',
						'top': '0',
						'transform': 'translateY(' + containerParams.TOP + 'px)'
					});

				} else {
					var top = scroll >= maxTop ? maxTop : 0;
					var y = scroll >= maxTop ? containerParams.TOP + 'px' : 0;
					aside.css({
						'position': 'absolute',
						'left': containerParams.LEFT_PADDING + 'px',
						'top': top + 'px',
						'transform': 'translateY(' + y + ')'
					});
				}

				cards.each(function(index) {
					var i = index;
				changeCurrentCard(i, $(this));
			});
		});

		$(window).on('resize', function() {
			var scroll = $(window).scrollTop();
			containerParams = {
				TOP: container.offset().top,
				LEFT: container.offset().left,
				HEIGHT: container.height(),
				WIDTH: container.width(),
				BOTTOM: container.offset().top + container.height(),
				LEFT_PADDING: parseInt(container.css('padding-left'), 10)
			};

			maxTop = $(window).width() >= 768 ? $(cards[cards.length - 1]).offset().top - containerParams.TOP : containerParams.BOTTOM - aside.outerHeight();
			isFixed = scroll > containerParams.TOP && scroll <= maxTop;

			aside.removeAttr('style');
		});
	}
})();









// Video player bindings (class/data selector based, multi-instance safe)
(function() {
	var SELECTORS = {
		container: '.js-video-container, [data-video-container]',
		video: '[data-video], video',
		playButton: '[data-video-play], .js-video-play',
		source: 'source[data-video-source]',
		urlInput: '[data-video-url]',
		loadButton: '[data-video-load]'
	};

	function setPlayButtonState(button, isPlaying) {
		if (!button) return;
		if (isPlaying) {
			button.innerHTML = '<span class="pause-icon"><i class="fa fa-solid fa-pause"></i></span>';
			return;
		}
		button.innerHTML = '<span class="play-icon"><i class="fa fa-solid fa-play"></i></span>';
		button.style.opacity = '1';
	}

	function bindVideoContainer(container) {
		if (!container || container.dataset.videoBound === '1') return;

		var video = container.querySelector(SELECTORS.video);
		if (!video) return;

		container.dataset.videoBound = '1';
		var playButton = container.querySelector(SELECTORS.playButton);
		var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

		function resetButtonPosition() {
			if (!playButton) return;
			playButton.style.left = '50%';
			playButton.style.top = '50%';
			playButton.style.transform = 'translate(-50%, -50%) scale(1)';
			playButton.style.transition = 'all 0.3s ease-out';
		}

		function togglePlayback() {
			if (video.paused) {
				video.play().catch(function() {});
				setPlayButtonState(playButton, true);
				return;
			}
			video.pause();
			setPlayButtonState(playButton, false);
		}

		if (playButton) {
			playButton.setAttribute('aria-label', playButton.getAttribute('aria-label') || 'Toggle video playback');
			playButton.setAttribute('aria-pressed', String(!video.paused));
		}

		container.addEventListener('click', function(event) {
			if (playButton && playButton.contains(event.target)) return;
			togglePlayback();
		});

		if (playButton) {
			playButton.addEventListener('click', function(event) {
				event.preventDefault();
				event.stopPropagation();
				togglePlayback();
			});
		}

		video.addEventListener('play', function() {
			if (!playButton) return;
			setPlayButtonState(playButton, true);
			playButton.setAttribute('aria-pressed', 'true');
		});

		video.addEventListener('pause', function() {
			if (!playButton) return;
			setPlayButtonState(playButton, false);
			playButton.setAttribute('aria-pressed', 'false');
		});

		video.addEventListener('ended', function() {
			if (!playButton) return;
			setPlayButtonState(playButton, false);
			playButton.style.opacity = '1';
		});

		if (playButton && canHover) {
			container.addEventListener('mousemove', function(event) {
				var containerRect = container.getBoundingClientRect();
				var mouseX = event.clientX - containerRect.left;
				var mouseY = event.clientY - containerRect.top;
				var buttonWidth = playButton.offsetWidth;
				var buttonHeight = playButton.offsetHeight;
				var buttonX = mouseX - buttonWidth / 2;
				var buttonY = mouseY - buttonHeight / 2;
				var maxButtonX = containerRect.width - buttonWidth;
				var maxButtonY = containerRect.height - buttonHeight;

				playButton.style.left = Math.min(Math.max(buttonX, 0), maxButtonX) + 'px';
				playButton.style.top = Math.min(Math.max(buttonY, 0), maxButtonY) + 'px';
			});

			container.addEventListener('mouseover', function() {
				playButton.style.transition = 'transform ease-out 0.3s';
				playButton.style.transform = 'scale(1.2)';
			});

			container.addEventListener('mouseenter', function() {
				if (!video.paused) {
					playButton.style.opacity = '1';
				}
			});

			container.addEventListener('mouseleave', function() {
				setTimeout(resetButtonPosition, 50);
				if (!video.paused) {
					playButton.style.opacity = '0';
					playButton.style.transition = 'opacity ease 1s';
				}
			});
		}

		var loadButton = container.querySelector(SELECTORS.loadButton);
		var videoSource = container.querySelector(SELECTORS.source);
		var videoUrl = container.querySelector(SELECTORS.urlInput);

		if (loadButton && videoSource && videoUrl) {
			loadButton.addEventListener('click', function() {
				var url = (videoUrl.value || '').trim();
				if (!url) return;

				videoSource.setAttribute('src', url);
				video.load();
				video.play().catch(function() {});
				if (playButton) {
					setPlayButtonState(playButton, true);
					playButton.style.opacity = '0';
					playButton.style.transition = 'opacity ease 1s';
				}
			});
		}
	}

	function initVideoPlayers(root) {
		var scope = root || document;
		scope.querySelectorAll(SELECTORS.container).forEach(bindVideoContainer);
	}

	$(window).off('page:ready.videoPlayers init.videoPlayers');
	$(window).on('page:ready.videoPlayers init.videoPlayers', function() {
		initVideoPlayers(document);
	});

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			$(window).trigger('init.videoPlayers');
		}, { once: true });
	} else {
		$(window).trigger('init.videoPlayers');
	}
})();



if (window.SplitText && window.gsap && document.querySelector("h1")) {
	new SplitText("h1", { type: "lines", linesClass: "lineChild" });
	new SplitText("h1", { type: "lines", linesClass: "lineParent" });
	gsap.from(".lineChild", {
	  duration: 0.75,
	  yPercent: 100,
	  stagger: 0.25,
	  repeat: -0,
	  repeatDelay: 0.5,
	  yoyo: true
	});
}





// Auto resize input
function resizeInput() {
    $(this).attr('size', $(this).val().length);
}

$('input[type="text"], input[type="email"]')
    // event handler
    .keyup(resizeInput)
    // resize on page load
    .each(resizeInput);

// Realtime clock and location
(function() {
  function updateClock() {
    var now = new Date();
    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');
    var seconds = String(now.getSeconds()).padStart(2, '0');
    var dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    var timeStr = hours + ':' + minutes + ':' + seconds;
    
    var clockElement = document.getElementById('realtime-clock');
    if (clockElement) {
      clockElement.textContent = dateStr + ' ' + timeStr;
    }
  }
  
  function updateLocation() {
    var locationElement = document.getElementById('location-info');
    if (locationElement && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(position) {
          // Get approximate location name (simplified - you might want to use a geocoding API)
          var lat = position.coords.latitude.toFixed(2);
          var lon = position.coords.longitude.toFixed(2);
          locationElement.textContent = lat + ', ' + lon;
        },
        function(error) {
          locationElement.textContent = 'Location unavailable';
        }
      );
    } else if (locationElement) {
      locationElement.textContent = 'Location unavailable';
    }
  }
  
  // Update clock every second
  updateClock();
  setInterval(updateClock, 1000);
  
  // Update location on page load
  updateLocation();
})();

// Auto-expand textarea inputs with class "expanding".
(function() {
	function hasFixedHeight(el) {
		return el && (el.classList.contains('footerareaheight') || el.hasAttribute('data-fixed-height'));
	}

	function resizeTextarea(el) {
		if (hasFixedHeight(el)) {
			el.style.height = '250px';
			el.style.overflow = '';
			return;
		}
		el.style.height = 'auto';
		el.style.overflow = 'hidden';
		el.style.height = el.scrollHeight + 'px';
		el.style.overflow = '';
	}

	function bindAutoExpand(el) {
		if (!el || el.dataset.autoExpandInit === '1') return;
		el.dataset.autoExpandInit = '1';
		resizeTextarea(el);
		el.addEventListener('input', function() {
			resizeTextarea(el);
		});
		el.addEventListener('mouseup', function() {
			resizeTextarea(el);
		});
	}

document.querySelectorAll('.expanding').forEach(bindAutoExpand);
})();
