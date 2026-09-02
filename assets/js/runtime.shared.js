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
	2.4 Scroll reveal init
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
var ANIME_JS_URL = 'assets/js/libs/anime.umd.min.js';
var THREE_JS_URL = 'assets/js/libs/three.global.js';
var LAWANI_SHARED = window.__lawaniShared || {};
var LAWANI_LOAD_SCRIPT_ONCE = typeof LAWANI_SHARED.loadScriptOnce === 'function'
	? LAWANI_SHARED.loadScriptOnce
	: function() { return Promise.resolve(false); };
var LAWANI_CREATE_ZONED_CLOCK = typeof LAWANI_SHARED.createZonedClock === 'function'
	? LAWANI_SHARED.createZonedClock
	: null;

/* Global loader fail-safe: never block the page on #loader. */
(function() {
	function hideLoader() {
		var loader = document.getElementById('loader');
		if (!loader) return;
		loader.style.opacity = '0';
		loader.style.pointerEvents = 'none';
		loader.style.visibility = 'hidden';
		loader.style.transition = loader.style.transition || 'opacity 280ms ease, visibility 0s linear 280ms';
		window.setTimeout(function() {
			if (!loader) return;
			loader.style.display = 'none';
		}, 340);
	}

	// Hide quickly after DOM is interactive.
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			window.setTimeout(hideLoader, 120);
		}, { once: true });
	} else {
		window.setTimeout(hideLoader, 120);
	}

	// Also hide after a hard timeout, even if scripts fail.
	window.setTimeout(hideLoader, 2500);
	window.addEventListener('load', function() {
		window.setTimeout(hideLoader, 60);
		document.body.classList.add('loaded');
	}, { once: true, passive: true });
})();

/* Global blend-gradient atmosphere on all runtime pages */
(function() {
	LAWANI_LOAD_SCRIPT_ONCE('assets/js/blend-gradient.js', 'data-blend-gradient');
})();

/* Fail-safe: never leave the page hidden by precover classes. */
(function() {
	var PRECOVER_CLASS = 'gsap-page-sweep-precover-active';
	var TRANSITIONING_CLASS = 'gsap-page-sweep-transitioning';

	function unlock() {
		var docEl = document.documentElement;
		if (!docEl) return;
		docEl.classList.remove(PRECOVER_CLASS);
		docEl.classList.remove(TRANSITIONING_CLASS);
		var layer = document.getElementById('gsap-page-sweep-layer');
		if (layer) {
			layer.style.opacity = '0';
			layer.style.visibility = 'hidden';
		}
	}

	function ensureUnlockedSoon() {
		// If we’re still covered after a short window, something went wrong—fail open.
		window.setTimeout(function() {
			var docEl = document.documentElement;
			if (!docEl) return;
			if (docEl.classList.contains(PRECOVER_CLASS) || docEl.classList.contains(TRANSITIONING_CLASS)) {
				unlock();
			}
		}, 1800);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', ensureUnlockedSoon, { once: true });
	} else {
		ensureUnlockedSoon();
	}
	window.addEventListener('pageshow', ensureUnlockedSoon, { passive: true });
})();

/* Global interaction state: single source of truth for menu/scroll lock across pages. */
(function() {
	var root = window.__lawaniInteractionSystem || {};
	if (!root.menu) {
		root.menu = {
			hasGlobalMenu: false,
			open: false,
			animating: false,
			lockY: 0
		};
	}
	window.__lawaniInteractionSystem = root;

	window.__lawaniIsGlobalMenuSystemActive = function() {
		if (root.menu && root.menu.hasGlobalMenu) return true;
		return !!document.querySelector('[data-global-estrela-menu="header"]');
	};

	window.__lawaniIsGlobalMenuOpen = function() {
		if (root.menu && root.menu.open) return true;
		return !!(document.documentElement && document.documentElement.classList.contains('estrela-menu-open'));
	};

	function parseDurationMs(value) {
		if (value === null || value === undefined) return NaN;
		var raw = String(value).trim();
		if (!raw) return NaN;
		if (raw.endsWith('ms')) return parseFloat(raw);
		if (raw.endsWith('s')) return parseFloat(raw) * 1000;
		return parseFloat(raw);
	}

	function readRootCssVar(name) {
		if (!name || typeof name !== 'string') return '';
		var rootEl = document.documentElement;
		if (!rootEl || typeof window.getComputedStyle !== 'function') return '';
		return (window.getComputedStyle(rootEl).getPropertyValue(name) || '').trim();
	}

	window.__lawaniGetInteractionTokenMs = function(name, fallbackMs) {
		var raw = readRootCssVar(name);
		var parsed = parseDurationMs(raw);
		if (isNaN(parsed)) return typeof fallbackMs === 'number' ? fallbackMs : 0;
		return Math.max(0, parsed);
	};

	window.__lawaniGetInteractionTokenNumber = function(name, fallbackNumber) {
		var raw = readRootCssVar(name);
		var parsed = parseFloat(raw);
		if (isNaN(parsed)) return typeof fallbackNumber === 'number' ? fallbackNumber : 0;
		return parsed;
	};

	window.__lawaniGetInteractionScrollY = function() {
		var doc = document.documentElement;
		var body = document.body;
		var menuOpen = !!(window.__lawaniIsGlobalMenuOpen && window.__lawaniIsGlobalMenuOpen());

		if (menuOpen && body) {
			var lockY = parseFloat(body.dataset.estrelaLockY || '');
			if (!isNaN(lockY)) return lockY;

			var top = parseFloat(body.style.top || '');
			if (!isNaN(top)) return Math.abs(top);

			if (root.menu && typeof root.menu.lockY === 'number') return root.menu.lockY;
		}

		return window.pageYOffset || (doc ? doc.scrollTop : 0) || 0;
	};
})();

// Global micro-interactions (hover preview, magnetic) as progressive enhancement.
(function() {
	if (window.__miLoaded) return;
	window.__miLoaded = true;

	var script = document.createElement('script');
	script.src = 'assets/js/modules/micro-interactions.js?v=20260401-globalmenu9';
	script.defer = true;
	script.async = true;
	script.setAttribute('data-mi', '1');
	document.head.appendChild(script);
})();

/* Global menu source of truth: render shared HTML menu on every page. */
(function() {
	var root = document.querySelector('.animsition');
	var interactionMenu = window.__lawaniInteractionSystem && window.__lawaniInteractionSystem.menu
		? window.__lawaniInteractionSystem.menu
		: null;
	var MENU_PARTIAL_URL = 'assets/partials/global-menu.html';
	var FALLBACK_TEMPLATE_HTML = [
		"<!-- Edit this file to change global logo/menu/social content site-wide. -->",
		"<header class=\"header header--secondary header--absolute header--estrela __js_fixed-header header--height\" data-global-estrela-menu=\"header\">",
		"  <nav class=\"nav\" data-estrela-nav data-theme=\"dark\" aria-label=\"Primary navigation\">",
		"    <!-- Editable logo -->",
		"    <a class=\"n-logo\" href=\"index.html\" aria-label=\"Home\">",
		"      <img src=\"assets/img/logo.svg\" alt=\"Lawani St Logo\" decoding=\"async\" fetchpriority=\"high\" loading=\"eager\">",
		"    </a>",
		"    <div class=\"n-links\" aria-label=\"Primary navigation links\">",
		"      <div class=\"n-links-inner\">",
		"        <!-- Editable top nav links -->",
		"        <a class=\"n-link\" href=\"team.html\" aria-label=\"About\">About</a>",
		"        <a class=\"n-link\" href=\"pitchdeck.html\" aria-label=\"Resume\">Resume</a>",
		"        <a class=\"n-link\" href=\"contact.html\" aria-label=\"Contact\">Contact</a>",
		"        <a class=\"n-link\" href=\"blog-listing.html\" aria-label=\"Stuff\">Stuff</a>",
		"      </div>",
		"    </div>",
		"    <button class=\"n-toggle\" type=\"button\" aria-expanded=\"false\" aria-label=\"Open menu\" data-estrela-menu-toggle>",
		"      <span class=\"n-toggle-icon\" aria-hidden=\"true\">",
		"        <span class=\"n-toggle-dot\"></span><span class=\"n-toggle-dot\"></span><span class=\"n-toggle-dot\"></span><span class=\"n-toggle-dot\"></span><span class=\"n-toggle-dot\"></span><span class=\"n-toggle-dot\"></span><span class=\"n-toggle-dot\"></span><span class=\"n-toggle-dot\"></span><span class=\"n-toggle-dot\"></span>",
		"      </span>",
		"    </button>",
		"  </nav>",
		"</header>",
		"<div class=\"menu\" data-estrela-menu aria-hidden=\"true\" data-global-estrela-menu=\"overlay\">",
		"  <div class=\"m-bg\" data-estrela-menu-close aria-hidden=\"true\"></div>",
		"  <div class=\"menu-inner\">",
		"    <div class=\"m-top\">",
		"      <div class=\"m-top-col\">",
		"        <div class=\"m-top-item m-showreel btn-block\">",
		"          <figure class=\"m-top-media media-wrapper video-wrapper\" aria-hidden=\"true\">",
		"            <div class=\"media-inner\">",
		"              <video class=\"media video menu-preview-video\" src=\"https://estrelastudio.cdn.prismic.io/estrelastudio/aN6JiJ5xUNkB1alN_EstrelaShowreelPreviewV2.mp4\" width=\"1200\" height=\"900\" autoplay muted playsinline loop preload=\"metadata\" poster=\"assets/img/menu/user-first-tile.png\"></video>",
		"            </div>",
		"          </figure>",
		"          <a class=\"btn-block-link\" href=\"work.html\" aria-label=\"Showreel\"></a>",
		"          <!-- <a class=\"btn\" href=\"work.html\" aria-label=\"Showreel\" target=\"_self\">",
		"            <span class=\"btn-bg\"></span><span class=\"btn-text\">Showreel</span><span class=\"btn-dot\"><span class=\"btn-dot-inner\"></span></span>",
		"          </a> -->",
		"        </div>",
		"      </div>",
		"      <div class=\"m-top-col\">",
		"        <button class=\"m-top-item m-close\" type=\"button\" aria-label=\"Close menu\" data-estrela-menu-close>",
		"          <span class=\"m-close-icon\" aria-hidden=\"true\">",
		"            <span class=\"m-close-dot\"></span><span class=\"m-close-dot\"></span><span class=\"m-close-dot\"></span><span class=\"m-close-dot\"></span><span class=\"m-close-dot\"></span><span class=\"m-close-dot\"></span><span class=\"m-close-dot\"></span><span class=\"m-close-dot\"></span><span class=\"m-close-dot\"></span>",
		"          </span>",
		"          <span class=\"sr-only\">Close menu</span>",
		"        </button>",
		"      </div>",
		"      <div class=\"m-top-col\">",
		"        <div class=\"m-top-item m-contact btn-block\">",
		"          <a class=\"btn-block-link\" href=\"vcard.html\" aria-label=\"Contact Us\"></a>",
		"          <a class=\"btn\" href=\"vcard.html\" aria-label=\"Contact Us\" target=\"_self\">",
		"            <span class=\"btn-bg\"></span><span class=\"btn-text\">Contact Us</span><span class=\"btn-dot\"><span class=\"btn-dot-inner\"></span></span>",
		"          </a>",
		"        </div>",
		"      </div>",
		"    </div>",
		"    <div class=\"m-bottom\">",
		"      <div class=\"m-links\" aria-label=\"Menu links\">",
		"        <!-- Editable full menu links -->",
		"               ",
		"                <a class=\"m-link\" href=\"pitchdeck.html\" aria-label=\"Resume\">",
		"                  <span class=\"m-link-bullet\"></span>",
		"                  <span class=\"m-link-inner\">Resume</span>",
		"                </a>",
		"                <a class=\"m-link\" href=\"contact.html\" aria-label=\"Contact\">",
		"                  <span class=\"m-link-bullet\"></span>",
		"                  <span class=\"m-link-inner\">Contact</span>",
		"                </a>",
		"                <a class=\"m-link\" href=\"blog-listing.html\" aria-label=\"Stuff\">",
		"                  <span class=\"m-link-bullet\"></span>",
		"                  <span class=\"m-link-inner\">Stuff</span>",
		"                </a>",
		"      </div>",
		"      <div class=\"m-bottom-right\">",
		"        <div class=\"contact\" aria-label=\"Contact links\">",
		"          <!-- Editable contact links -->",
		"          <div class=\"contact-link-wrapper\">",
		"            <div class=\"contact-bullet\" aria-hidden=\"true\"></div>",
		"            <a href=\"tel:+27780548476\" class=\"contact-link\" aria-label=\"Phone\"><span class=\"contact-link-text\"><span class=\"line\">+27 (0) 78 054 8476</span></span></a>",
		"          </div>",
		"          <div class=\"contact-link-wrapper\">",
		"            <div class=\"contact-bullet\" aria-hidden=\"true\"></div>",
		"            <a href=\"mailto:accounts@estrela.studio\" class=\"contact-link\" aria-label=\"Email\"><span class=\"contact-link-text\"><span class=\"line\">Write Us</span></span></a>",
		"          </div>",
		"          <div class=\"contact-link-wrapper\">",
		"            <div class=\"contact-bullet\" aria-hidden=\"true\"></div>",
		"            <a href=\"mailto:newsletter@estrela.studio\" class=\"contact-link\" aria-label=\"Newsletter\"><span class=\"contact-link-text\"><span class=\"line\">Newsletter Signup</span></span></a>",
		"          </div>",
		"        </div>",
		"        <div class=\"m-social links\" aria-label=\"Social links\">",
		"          <!-- Editable social links -->",
		"                  <h6 class=\"m-social-title\">Social</h6>",
		"                  <a class=\"m-social-link\" href=\"https://www.instagram.com/estrela_digitalstudio/?hl=en\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"Instagram\">Instagram</a>",
		"                  <a class=\"m-social-link\" href=\"https://www.linkedin.com/company/estrela-digital-studio\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"LinkedIn\">LinkedIn</a>",
		"                  <a class=\"m-social-link\" href=\"https://www.awwwards.com/estrelastudio/\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"Awwwards\">Awwwards</a>",
		"        </div>",
		"      </div>",
		"      <div class=\"clock\" aria-live=\"polite\"><span class=\"clock-time\" data-menu-clock-time>00:00:00</span> <span class=\"clock-zone\" data-menu-clock-zone>(GMT+2)</span></div>",
		"    </div>",
		"  </div>",
		"</div>",
	].join('');

	if (!root) {
		if (interactionMenu) interactionMenu.hasGlobalMenu = false;
		return;
	}

	function markMenuState(hasMenu) {
		if (interactionMenu) {
			interactionMenu.hasGlobalMenu = !!hasMenu;
			if (!hasMenu) {
				interactionMenu.open = false;
				interactionMenu.animating = false;
				interactionMenu.lockY = 0;
			}
		}
		window.__lawaniGlobalMenuInjected = !!hasMenu;
	}

	function emitMenuReady() {
		var eventName = 'lawani:global-menu-ready';
		try {
			window.dispatchEvent(new Event(eventName));
		} catch (error) {
			var fallbackEvent = document.createEvent('Event');
			fallbackEvent.initEvent(eventName, true, true);
			window.dispatchEvent(fallbackEvent);
		}
		if (window.jQuery) {
			window.jQuery(window).trigger(eventName);
		}
	}

	function hasRequiredMarkers(markup) {
		if (!markup) return false;
		return (
			markup.indexOf('data-global-estrela-menu="header"') !== -1 &&
			markup.indexOf('data-global-estrela-menu="overlay"') !== -1
		);
	}

	function getInlineTemplateHtml() {
		var tpl = document.querySelector('template[data-global-estrela-menu-template]');
		if (!tpl) return '';
		return (tpl.innerHTML || '').trim();
	}

	function serializeNode(node) {
		if (!node) return '';
		var wrapper = document.createElement('div');
		wrapper.appendChild(node.cloneNode(true));
		return wrapper.innerHTML;
	}

	function getLegacyMenuMarkupFromPage() {
		if (!root) return '';

		var headerNode = null;
		var overlayNode = null;

		Array.prototype.slice.call(root.children).forEach(function(node) {
			if (!node || node.nodeType !== 1) return;

			if (
				!headerNode &&
				node.tagName === 'HEADER' &&
				!node.hasAttribute('data-global-estrela-menu') &&
				(node.querySelector('[data-estrela-nav]') || node.querySelector('[data-estrela-menu-toggle]'))
			) {
				headerNode = node;
				return;
			}

			if (
				!overlayNode &&
				node.classList &&
				node.classList.contains('menu') &&
				node.hasAttribute('data-estrela-menu') &&
				!node.hasAttribute('data-global-estrela-menu')
			) {
				overlayNode = node;
			}
		});

		if (!headerNode || !overlayNode) return '';

		var headerClone = headerNode.cloneNode(true);
		var overlayClone = overlayNode.cloneNode(true);
		headerClone.setAttribute('data-global-estrela-menu', 'header');
		overlayClone.setAttribute('data-global-estrela-menu', 'overlay');

		return (serializeNode(headerClone) + serializeNode(overlayClone)).trim();
	}

	function removeExistingGlobalMenuAnywhere() {
		document.querySelectorAll('[data-global-estrela-menu]').forEach(function(node) {
			if (node && node.parentNode) node.parentNode.removeChild(node);
		});
	}

	function removeLegacyMenu(rootEl) {
		Array.prototype.slice.call(rootEl.children).forEach(function(node) {
			if (!node || node.nodeType !== 1) return;

			var isLegacyHeader =
				node.tagName === 'HEADER' &&
				(node.querySelector('[data-estrela-nav]') || node.querySelector('[data-estrela-menu-toggle]'));

			var isLegacyOverlayMenu =
				node.classList &&
				node.classList.contains('menu') &&
				node.hasAttribute('data-estrela-menu');

			if (isLegacyHeader || isLegacyOverlayMenu) {
				node.remove();
			}
		});
	}

	function createMenuFragment(markup) {
		var tpl = document.createElement('template');
		tpl.innerHTML = markup;
		return tpl.content.cloneNode(true);
	}

	function findInsertionPoint(rootEl) {
		var loader = rootEl.querySelector('#loader');
		if (loader && loader.parentElement === rootEl) {
			return loader.nextSibling;
		}
		return rootEl.firstChild;
	}

	function applyGlobalMenuMarkup(markup) {
		var finalMarkup = hasRequiredMarkers(markup) ? markup : FALLBACK_TEMPLATE_HTML;
		if (!hasRequiredMarkers(finalMarkup)) {
			markMenuState(false);
			emitMenuReady();
			return;
		}
		removeExistingGlobalMenuAnywhere();
		removeLegacyMenu(root);
		root.insertBefore(createMenuFragment(finalMarkup), findInsertionPoint(root));
		markMenuState(true);
		emitMenuReady();
	}

	function loadMenuTemplate() {
		var inlineHtml = getInlineTemplateHtml();
		if (hasRequiredMarkers(inlineHtml)) {
			return Promise.resolve(inlineHtml);
		}

		if (typeof window.fetch !== 'function') {
			return Promise.resolve(FALLBACK_TEMPLATE_HTML);
		}

		return window
			.fetch(MENU_PARTIAL_URL, { cache: 'no-store' })
			.then(function(response) {
				if (!response || !response.ok) {
					throw new Error('Unable to load global menu partial');
				}
				return response.text();
			})
			.then(function(markup) {
				return hasRequiredMarkers(markup) ? markup : FALLBACK_TEMPLATE_HTML;
			})
			.catch(function() {
				return FALLBACK_TEMPLATE_HTML;
			});
	}

	markMenuState(false);
	loadMenuTemplate()
		.then(applyGlobalMenuMarkup)
		.catch(function() {
			applyGlobalMenuMarkup(FALLBACK_TEMPLATE_HTML);
		});
})();

/* Global menu clock (single source of truth across all pages). */
(function() {
	if (window.__estrelaMenuClockInit === true) return;
	window.__estrelaMenuClockInit = true;

	var timezone = 'Africa/Johannesburg';
	var clock = LAWANI_CREATE_ZONED_CLOCK
		? LAWANI_CREATE_ZONED_CLOCK({
			timezone: timezone,
			fallbackZoneLabel: '(GMT+2)'
		})
		: null;

	function tickMenuClock() {
		var timeNodes = document.querySelectorAll('[data-menu-clock-time]');
		var zoneNodes = document.querySelectorAll('[data-menu-clock-zone]');
		if (!timeNodes.length && !zoneNodes.length) return;

		var now = new Date();
		var values = clock ? clock.read(now) : { time: '00:00:00', zone: '(GMT+2)' };
		var timeValue = values.time;
		var zoneValue = values.zone;

		timeNodes.forEach(function(node) {
			node.textContent = timeValue;
		});

		zoneNodes.forEach(function(node) {
			node.textContent = zoneValue;
		});
	}

	function initMenuClock() {
		tickMenuClock();
		if (!window.__estrelaMenuClockTimer) {
			window.__estrelaMenuClockTimer = window.setInterval(tickMenuClock, 1000);
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initMenuClock, { once: true });
	} else {
		initMenuClock();
	}

	if (window.jQuery) {
		window.jQuery(window).off('page:ready.estrelaMenuClock');
		window.jQuery(window).on('page:ready.estrelaMenuClock', tickMenuClock);
	}
})();

/* Estrela-style nav scroll behaviour (collapse center links after scroll). */
(function() {
	var NAV = '[data-estrela-nav]';
	var SCROLLED_CLASS = 'scrolled';
	var fallbackThreshold = 100;
	var ticking = false;

	function getNav() {
		return document.querySelector(NAV);
	}

	function getEffectiveScrollY() {
		if (typeof window.__lawaniGetInteractionScrollY === 'function') {
			return window.__lawaniGetInteractionScrollY();
		}
		var root = document.documentElement;
		return window.pageYOffset || (root ? root.scrollTop : 0) || 0;
	}

	function getScrollThreshold() {
		var isMobileViewport = !!(window.matchMedia && window.matchMedia('(max-width: 1099px)').matches);
		if (typeof window.__lawaniGetInteractionTokenNumber === 'function') {
			if (isMobileViewport) {
				var mobileThreshold = window.__lawaniGetInteractionTokenNumber('--estrela-scroll-threshold-mobile', NaN);
				if (!isNaN(mobileThreshold)) return mobileThreshold;
				return window.__lawaniGetInteractionTokenNumber('--estrela-scroll-threshold', 26);
			}
			return window.__lawaniGetInteractionTokenNumber('--estrela-scroll-threshold', fallbackThreshold);
		}
		return isMobileViewport ? 26 : fallbackThreshold;
	}

	function updateScrolledState() {
		var y = getEffectiveScrollY();
		var threshold = getScrollThreshold();
		document.documentElement.classList.toggle(SCROLLED_CLASS, y > threshold);
	}

	function measureNavLinksWidth() {
		var nav = getNav();
		if (!nav) return;
		var linksInner = nav.querySelector('.n-links-inner');
		if (!linksInner) return;

		var contentWidth = linksInner.scrollWidth || 0;
		if (!contentWidth) return;

		var extra = 44;
		var minWidth = 324;
		var maxWidth = 360;
		var width = Math.ceil(contentWidth + extra);
		if (width < minWidth) width = minWidth;
		if (width > maxWidth) width = maxWidth;

		nav.style.setProperty('--estrela-nav-links-width', width + 'px');
	}

	function requestUpdate() {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(function() {
			ticking = false;
			updateScrolledState();
		});
	}

	function init() {
		measureNavLinksWidth();
		updateScrolledState();
	}

	$(window).off('scroll.estrelaNav resize.estrelaNav page:ready.estrelaNav load.estrelaNav');
	$(window).on('scroll.estrelaNav', requestUpdate);
	$(window).on('resize.estrelaNav', function() {
		measureNavLinksWidth();
		requestUpdate();
	});
	$(window).on('page:ready.estrelaNav', function() {
		measureNavLinksWidth();
		requestUpdate();
	});
	$(window).on('load.estrelaNav', function() {
		measureNavLinksWidth();
		requestUpdate();
	});

	if (document.documentElement.dataset.estrelaNavReadyBound !== '1') {
		document.documentElement.dataset.estrelaNavReadyBound = '1';
		window.addEventListener('lawani:global-menu-ready', function() {
			measureNavLinksWidth();
			requestUpdate();
		});
	}

	if (document.fonts && document.fonts.ready) {
		document.fonts.ready.then(measureNavLinksWidth).catch(function() {});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init, { once: true });
	} else {
		init();
	}
})();

// Section reveal motion for cards/stack items (keeps markup clean).
(function() {
	if (window.__sectionRevealsInjected) return;
	window.__sectionRevealsInjected = true;

	var script = document.createElement('script');
	script.src = 'assets/js/modules/section-reveals.js';
	script.defer = true;
	script.async = true;
	script.setAttribute('data-section-reveals', '1');
	document.head.appendChild(script);
})();

/* Shared motion dependency loaders */
(function() {
	var animeLoaderPromise = null;
	var threeLoaderPromise = null;
	var loadScriptOnce = LAWANI_LOAD_SCRIPT_ONCE;

	function ensureAnimeJs() {
		if (window.anime) return Promise.resolve(window.anime);
		if (animeLoaderPromise) return animeLoaderPromise;

		animeLoaderPromise = loadScriptOnce(ANIME_JS_URL, 'data-motion-anime').then(function() {
			return window.anime || window.AnimeJS || null;
		});

		return animeLoaderPromise;
	}

	function ensureThreeJs() {
		if (window.THREE) return Promise.resolve(window.THREE);
		if (threeLoaderPromise) return threeLoaderPromise;

		threeLoaderPromise = loadScriptOnce(THREE_JS_URL, 'data-motion-three').then(function() {
			return window.THREE || null;
		});

		return threeLoaderPromise;
	}

	window.MotionLibs = window.MotionLibs || {};
	window.MotionLibs.ensureAnimeJs = ensureAnimeJs;
	window.MotionLibs.ensureThreeJs = ensureThreeJs;
})();

/* Global media loading optimization */
(function() {
	function isCriticalImage(img, viewportHeight) {
		if (!img || !img.getBoundingClientRect) return false;
		if (img.closest('.hero, .main-screen, .main-screen__image, .header, #loader')) return true;
		var rect = img.getBoundingClientRect();
		return rect.top < (viewportHeight * 1.15) && rect.bottom > -64;
	}

	function optimizeMediaLoading() {
		var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 900;
		var images = document.querySelectorAll('img');
		var videos = document.querySelectorAll('video');

		images.forEach(function(img) {
			if (!img.hasAttribute('decoding')) {
				img.setAttribute('decoding', 'async');
			}
			if (!img.hasAttribute('fetchpriority')) {
				img.setAttribute('fetchpriority', isCriticalImage(img, viewportHeight) ? 'high' : 'low');
			}
			if (!img.hasAttribute('loading')) {
				img.setAttribute('loading', isCriticalImage(img, viewportHeight) ? 'eager' : 'lazy');
			}
		});

		videos.forEach(function(video) {
			if (!video.hasAttribute('preload')) {
				video.setAttribute('preload', 'metadata');
			}
		});
	}

	function scheduleMediaOptimize() {
		window.requestAnimationFrame(function() {
			optimizeMediaLoading();
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', scheduleMediaOptimize, { once: true });
	} else {
		scheduleMediaOptimize();
	}

	if (window.jQuery) {
		window.jQuery(window).off('page:ready.mediaOptimize');
		window.jQuery(window).on('page:ready.mediaOptimize', scheduleMediaOptimize);
	}
})();


/*** 2. Inits ***/

/* 2.1 Init parallax */
/*(function() {
	var images = document.querySelectorAll('.__js_parallax img');
	new simpleParallax(images, {
		scale: 1.3
	});
})();*/



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
	if (!countSpan || !loader) {
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
	  if (progressBar) progressBar.style.width = count + '%';
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
		'/blog-grid.html': '/blog-listing.html',
		'/blog-masonry.html': '/blog-listing.html',
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
		'/single-post.html': '/blog-listing.html',
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
	var loadScriptOnce = LAWANI_LOAD_SCRIPT_ONCE;

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

/* 2.4 GSAP Scroll reveal init (uses data-aos attributes for compatibility) */
(function() {
	var triggerPrefix = 'aos-reveal-';
	var gsapLoaderPromise = null;
	var loadScriptOnce = LAWANI_LOAD_SCRIPT_ONCE;

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

	function clampNumber(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	function toNumber(value, fallback) {
		var parsed = parseFloat(value);
		return Number.isFinite(parsed) ? parsed : fallback;
	}

	function getDurationSeconds(node, fallbackSeconds) {
		var raw = (node.getAttribute('data-aos-duration') || '').trim();
		if (!raw) return fallbackSeconds;
		var n = toNumber(raw, fallbackSeconds);
		// If author passed milliseconds, normalize to seconds.
		if (n > 10) return clampNumber(n / 1000, 0.12, 6);
		return clampNumber(n, 0.12, 6);
	}

	function getDelaySeconds(node) {
		var raw = (node.getAttribute('data-aos-delay') || '').trim();
		if (!raw) return 0;
		var n = toNumber(raw, 0);
		if (n > 10) return clampNumber(n / 1000, 0, 6);
		return clampNumber(n, 0, 6);
	}

	function getEase(node, fallback) {
		var raw = (node.getAttribute('data-aos-ease') || '').trim();
		return raw || fallback;
	}

	function getStart(node, fallback) {
		var raw = (node.getAttribute('data-aos-start') || '').trim();
		return raw || fallback;
	}

	function getOnce(node, fallback) {
		var raw = (node.getAttribute('data-aos-once') || '').trim().toLowerCase();
		if (!raw) return fallback;
		if (raw === 'false' || raw === '0' || raw === 'no') return false;
		if (raw === 'true' || raw === '1' || raw === 'yes') return true;
		return fallback;
	}

	function getScrub(node) {
		var raw = (node.getAttribute('data-aos-scrub') || '').trim().toLowerCase();
		if (!raw) return null;
		if (raw === 'true') return 1;
		if (raw === 'false') return null;
		var n = toNumber(raw, 1);
		return clampNumber(n, 0.2, 6);
	}

	function supportsClipPath() {
		try {
			return typeof window.CSS !== 'undefined' && typeof window.CSS.supports === 'function' && window.CSS.supports('clip-path', 'inset(0 0 0 0)');
		} catch (e) {
			return false;
		}
	}

	function findMediaNode(node) {
		if (!node || !node.tagName) return null;
		var tag = node.tagName.toUpperCase();
		if (tag === 'IMG' || tag === 'VIDEO') return node;

		// Prefer direct media children to avoid catching complex grids.
		if (node.children && node.children.length) {
			for (var i = 0; i < node.children.length; i++) {
				var child = node.children[i];
				if (!child || !child.tagName) continue;
				var childTag = child.tagName.toUpperCase();
				if (childTag === 'IMG' || childTag === 'VIDEO') return child;
			}
		}

		var descendants = node.querySelectorAll ? node.querySelectorAll('img, video') : [];
		if (descendants && descendants.length === 1) return descendants[0];
		return null;
	}

	function getPreset(node, type) {
		var t = ((type || '') + '').toLowerCase().trim();
		var from = getFromVars(t);
		var preset = {
			set: { force3D: true, transformPerspective: 900 },
			from: { autoAlpha: 0, x: from.x, y: from.y },
			to: { autoAlpha: 1, x: 0, y: 0 },
			child: null,
			childFrom: null,
			childTo: null,
			isMedia: false
		};

		// Premium defaults for basic fades.
		if (t === 'fade-up' || t === '') {
			preset.from.rotateX = -4;
			preset.to.rotateX = 0;
		} else if (t === 'fade-down') {
			preset.from.rotateX = 4;
			preset.to.rotateX = 0;
		} else if (t === 'fade-left') {
			preset.from.rotateY = -4;
			preset.to.rotateY = 0;
		} else if (t === 'fade-right') {
			preset.from.rotateY = 4;
			preset.to.rotateY = 0;
		}

		// Mask / wipe reveal (Awwwards-style).
		if ((t === 'reveal' || t === 'reveal-up' || t === 'wipe-up' || t === 'aw-reveal') && supportsClipPath()) {
			preset.from.x = 0;
			preset.from.y = 18;
			preset.from.rotateX = -4;
			preset.from.clipPath = 'inset(0 0 100% 0 round 0px)';
			preset.to.x = 0;
			preset.to.y = 0;
			preset.to.rotateX = 0;
			preset.to.clipPath = 'inset(0 0 0% 0 round 0px)';
		}

		if ((t === 'reveal-down' || t === 'wipe-down') && supportsClipPath()) {
			preset.from.x = 0;
			preset.from.y = -18;
			preset.from.rotateX = 4;
			preset.from.clipPath = 'inset(100% 0 0 0 round 0px)';
			preset.to.x = 0;
			preset.to.y = 0;
			preset.to.rotateX = 0;
			preset.to.clipPath = 'inset(0% 0 0 0 round 0px)';
		}

		// Media reveal animates media elements for depth.
		var mediaNode = findMediaNode(node);

			if (mediaNode) {
				preset.isMedia = true;
				node.classList.add('aw-reveal-media');

				preset.from.x = 0;
				preset.from.y = 40;
				preset.from.rotateX = -10;
				preset.from.filter = 'blur(3px)';
				preset.to.x = 0;
				preset.to.y = 0;
				preset.to.rotateX = 0;
				preset.to.filter = 'blur(0px)';

			if (supportsClipPath()) {
				preset.from.clipPath = 'inset(0 0 100% 0 round 0px)';
				preset.to.clipPath = 'inset(0 0 0% 0 round 0px)';
			}

				if (mediaNode === node) {
					preset.from.scale = 1.2;
					preset.to.scale = 1;
				} else {
					preset.child = mediaNode;
					preset.childFrom = { scale: 1.26, y: 24 };
					preset.childTo = { scale: 1, y: 0 };
				}
			}

		return preset;
	}

	function revealImmediately(nodes) {
		nodes.forEach(function(node) {
			node.style.opacity = '1';
			node.style.visibility = 'visible';
			node.style.transform = 'none';
			node.style.clipPath = 'none';
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
				var type = node.getAttribute('data-aos');
				var preset = getPreset(node, type);
				var duration = getDurationSeconds(node, preset.isMedia ? 1.2 : 0.9);
				var delay = getDelaySeconds(node);
				var ease = getEase(node, preset.isMedia ? 'power4.out' : 'power3.out');
				var once = getOnce(node, true);
				var scrub = getScrub(node);
				var hasScrubAttr = node.hasAttribute('data-aos-scrub');
				if (!hasScrubAttr && preset.isMedia) scrub = 0.1;
				var start = getStart(node, preset.isMedia ? 'top 95%' : 'top 88%');
				var end = (node.getAttribute('data-aos-end') || '').trim() || (scrub ? (preset.isMedia ? 'top 35%' : 'bottom 60%') : 'bottom 60%');

				gsap.killTweensOf(node);
				if (preset.child) gsap.killTweensOf(preset.child);

				var st = {
					id: triggerPrefix + index,
					trigger: node,
					start: start
				};

				if (scrub) {
					st.scrub = scrub;
					st.end = end;
					st.fastScrollEnd = true;
					st.invalidateOnRefresh = true;
				} else {
					st.once = once;
				}

				var tl = gsap.timeline({
					defaults: { duration: duration, ease: scrub ? 'none' : ease },
					scrollTrigger: st
				});

				tl.set(node, preset.set || {});
				tl.fromTo(node, preset.from, Object.assign({}, preset.to, { overwrite: 'auto', delay: delay }), 0);

				if (preset.child && preset.childFrom && preset.childTo) {
					tl.fromTo(preset.child, preset.childFrom, preset.childTo, 0);
				}
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
		'main h1',
		'main h2',
		'main h3'
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

	var loadScriptOnce = LAWANI_LOAD_SCRIPT_ONCE;

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








function animateIn() {
	if (!window.gsap) return;
	gsap.from(".stack-item", {
		y: 60, opacity: 0, duration: 1.4, stagger: 0.1, ease: "expo.out"
	});
}

function initStack() {
	if (!window.gsap) return;

	const items = Array.from(document.querySelectorAll('.stack-item'));
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	items.forEach(item => {
		if (item.dataset.stackInit === '1') return;
		item.dataset.stackInit = '1';

		const glow = item.querySelector('.color-bg');
		if (!glow) return;

		const group = item.closest('.soty-container');
		const peers = group
			? Array.from(group.querySelectorAll('.stack-item'))
			: items;
		const usesGrid = group && window.getComputedStyle(group).display === 'grid';
		const img = glow.querySelector('img');
		const hasImage = Boolean(img);
		const idleOpacity = hasImage ? 0.38 : 0.42;
		const activeOpacity = hasImage ? 1 : 0.72;

		gsap.set(glow, {
			opacity: idleOpacity,
			scale: 1,
			backgroundSize: 'cover',
			backgroundPosition: 'center',
			mixBlendMode: 'normal'
		});

		if (img) {
			gsap.set(img, { scale: 1 });
			img.style.transform = 'none';
		}

		const activate = () => {
			if (reduceMotion) {
				gsap.set(glow, { opacity: activeOpacity });
				return;
			}

			if (!usesGrid) {
				gsap.to(item, { flex: 1.12, duration: 1.2, ease: 'expo.out' });
			}

			gsap.to(peers.filter(i => i !== item), {
				flex: 0.88,
				opacity: 0.55,
				duration: 1.2,
				ease: 'expo.out'
			});
			gsap.to(glow, { opacity: activeOpacity, duration: 0.45, ease: 'power2.out' });
		};

		const deactivate = () => {
			if (reduceMotion) {
				gsap.set(peers, { opacity: 1 });
				gsap.set(glow, { opacity: idleOpacity });
				return;
			}

			const reset = { opacity: 1, duration: 1.2, ease: 'expo.out' };
			if (!usesGrid) reset.flex = 1;
			gsap.to(peers, reset);
			gsap.to(glow, { opacity: idleOpacity, duration: 0.45, ease: 'power2.out' });
		};

		item.addEventListener('mouseenter', activate);
		item.addEventListener('mouseleave', deactivate);
		item.addEventListener('focus', activate);
		item.addEventListener('blur', deactivate);
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
		var isScrolled = false;
		var isMobile = window.matchMedia && window.matchMedia('(max-width: 991px)').matches;

		function getThresholds() {
			var enter = typeof window.__lawaniGetInteractionTokenNumber === 'function'
				? window.__lawaniGetInteractionTokenNumber('--estrela-logo-scroll-enter', 110)
				: 110;
			var exit = typeof window.__lawaniGetInteractionTokenNumber === 'function'
				? window.__lawaniGetInteractionTokenNumber('--estrela-logo-scroll-exit', 70)
				: 70;
			if (exit >= enter) exit = Math.max(0, enter - 1);
			return { enter: enter, exit: exit };
		}

		if (isMobile) {
			$('.header').removeClass('header--scrolled');
			$(window).off('scroll.logoColor page:ready.logoColor');
			return;
		}

			function updateLogoColor() {
				var header = $('.header');
				if (!header.length) return;
				if (typeof window.__lawaniIsGlobalMenuOpen === 'function' && window.__lawaniIsGlobalMenuOpen()) {
					return;
				}
				var scroll = typeof window.__lawaniGetInteractionScrollY === 'function'
					? window.__lawaniGetInteractionScrollY()
					: $(window).scrollTop();
		var thresholds = getThresholds();
		if (!isScrolled && scroll > thresholds.enter) {
			isScrolled = true;
			header.addClass('header--scrolled');
		} else if (isScrolled && scroll < thresholds.exit) {
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
		var isHidden = false;
		var isMobile = window.matchMedia && window.matchMedia('(max-width: 991px)').matches;

		function getThresholds() {
			var enter = typeof window.__lawaniGetInteractionTokenNumber === 'function'
				? window.__lawaniGetInteractionTokenNumber('--estrela-main-screen-enter', 240)
				: 240;
			var exit = typeof window.__lawaniGetInteractionTokenNumber === 'function'
				? window.__lawaniGetInteractionTokenNumber('--estrela-main-screen-exit', 140)
				: 140;
			if (exit >= enter) exit = Math.max(0, enter - 1);
			return { enter: enter, exit: exit };
		}

		if (isMobile) {
			$('.main-screen').removeClass('main-screen--scrolled');
			$(window).off('scroll.mainScreen page:ready.mainScreen');
			return;
		}

			function updateMainScreen() {
				var mainScreen = $('.main-screen');
				if (!mainScreen.length) return;
				if (typeof window.__lawaniIsGlobalMenuOpen === 'function' && window.__lawaniIsGlobalMenuOpen()) {
					return;
				}
				var scroll = typeof window.__lawaniGetInteractionScrollY === 'function'
					? window.__lawaniGetInteractionScrollY()
					: $(window).scrollTop();
		var thresholds = getThresholds();
		if (!isHidden && scroll > thresholds.enter) {
			isHidden = true;
			mainScreen.addClass('main-screen--scrolled');
		} else if (isHidden && scroll < thresholds.exit) {
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
	var blurMaxPx = 0;
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

	var loadScriptOnce = LAWANI_LOAD_SCRIPT_ONCE;

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

	function hasGlobalEstrelaMenu() {
		if (typeof window.__lawaniIsGlobalMenuSystemActive === 'function') {
			return window.__lawaniIsGlobalMenuSystemActive();
		}
		return !!document.querySelector('[data-estrela-menu]') || !!document.querySelector('[data-estrela-menu-toggle]');
	}

	if (hasGlobalEstrelaMenu()) {
		$(document).off('click.mobileMenuToggle', '.menu-toggle');
		$(document).off('click.mobileMenuLink', '.mobile-canvas .navigation__link');
		$(document).off('keydown.mobileMenu');
		$(window).off('resize.mobileMenu');
		$(window).off('page:ready.mobileMenu init.mobileMenu');
		return;
	}

	function syncToggleState(isOpen) {
		$('.menu-toggle')
			.attr('aria-expanded', isOpen ? 'true' : 'false')
			.attr('aria-label', isOpen ? 'Close menu' : 'Open menu');
	}

	function closeMenu() {
		$('.mobile-canvas').removeClass(modifier.MOBILE_CANVAS);
		$('.menu-toggle').removeClass(modifier.TOGGLE);
		syncToggleState(false);
		$('body').css({
			overflow: '',
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

		$('body').css({
			overflow: 'hidden',
			'margin-right': $(window).width() >= mobileBreakpoint ? getScrollbarWidth() + 'px' : '0'
		});
	}

	function toggleMenu(evt) {
		var currentTarget = evt && evt.currentTarget ? evt.currentTarget : null;
		if (currentTarget && currentTarget.hasAttribute && currentTarget.hasAttribute('data-estrela-menu-toggle')) {
			return;
		}
		evt.preventDefault();
		if ($('.mobile-canvas').hasClass(modifier.MOBILE_CANVAS)) {
			closeMenu();
			return;
		}
		openMenu();
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

		$(window).off('resize.mobileMenu').on('resize.mobileMenu', function() {
			if ($(window).width() >= mobileBreakpoint) {
				closeMenu();
			}
		});
	}

	$(window).off('page:ready.mobileMenu init.mobileMenu');
	$(window).on('page:ready.mobileMenu init.mobileMenu', function() {
		if (hasGlobalEstrelaMenu()) {
			closeMenu();
			return;
		}
		closeMenu();
		bindMobileMenuEvents();
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
	var gsapLoaderPromise = null;

	function hasGlobalEstrelaMenu() {
		if (typeof window.__lawaniIsGlobalMenuSystemActive === 'function') {
			return window.__lawaniIsGlobalMenuSystemActive();
		}
		return !!document.querySelector('[data-estrela-menu]') || !!document.querySelector('[data-estrela-menu-toggle]');
	}

	if (hasGlobalEstrelaMenu()) {
		$(window).off('page:ready.menuToggleGsap init.menuToggleGsap');
		return;
	}

	function canHoverContext() {
		return window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
	}
	var loadScriptOnce = LAWANI_LOAD_SCRIPT_ONCE;

	function ensureGsapCore() {
		if (window.gsap) return Promise.resolve(window.gsap);
		if (gsapLoaderPromise) return gsapLoaderPromise;

		gsapLoaderPromise = loadScriptOnce(GSAP_CORE_URL, 'data-menu-toggle-gsap').then(function() {
			return window.gsap || null;
		});

		return gsapLoaderPromise;
	}

	function bindToggle(toggle, gsap) {
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
				return 'none';
			}

		function glowIn() {
			gsap.to(toggle, {
				duration: 0.24,
				borderColor: 'rgba(255, 170, 145, 0.92)',
				boxShadow: activeShadow(),
				ease: 'power2.out',
				overwrite: 'auto'
			});
		}

		function glowOut() {
			gsap.to(toggle, {
				duration: 0.26,
				borderColor: baseBorderColor(),
				boxShadow: activeShadow(),
				ease: 'power2.out',
				overwrite: 'auto'
			});
		}

			if (!reduceMotion) {
				gsap.set(nub, { clearProps: 'x,y,rotation,scaleX,scaleY' });
				gsap.set(toggle, {
					borderColor: baseBorderColor(),
					boxShadow: 'none',
					transformOrigin: '50% 50%'
				});
			} else {
				toggle.style.borderColor = baseBorderColor();
				toggle.style.boxShadow = 'none';
				nub.style.filter = toggle.classList.contains('menu-toggle--opened')
					? 'saturate(1.12) brightness(1.06)'
					: 'none';
			}

			function onHoverIn() {
				if (reduceMotion || !canHoverContext()) return;
				gsap.to(nub, {
					duration: 0.22,
				filter: 'saturate(1.1) brightness(1.08)',
				ease: 'power2.out',
				overwrite: 'auto'
			});
		}

		function onHoverOut() {
			if (reduceMotion || !canHoverContext()) return;
			gsap.to(nub, {
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
			if (reduceMotion) return;
			var tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
			tl.to(toggle, {
				duration: 0.1,
				scale: 0.92,
				ease: 'power2.out'
			});
			tl.to(toggle, {
				duration: 0.36,
				scale: 1,
				ease: 'back.out(2.6)'
			});
			tl.to(nub, {
				duration: 0.14,
				scale: 0.9,
				ease: 'power2.out'
			}, 0);
			tl.to(nub, {
				duration: 0.3,
				scale: 1,
				ease: 'back.out(2.2)'
			}, 0.1);
		}

		function onStateChange() {
			if (reduceMotion) {
				toggle.style.borderColor = baseBorderColor();
				toggle.style.boxShadow = activeShadow();
				nub.style.filter = toggle.classList.contains('menu-toggle--opened')
					? 'saturate(1.12) brightness(1.06)'
					: 'none';
				return;
			}

			gsap.to(nub, {
				duration: 0.24,
				filter: toggle.classList.contains('menu-toggle--opened')
					? 'saturate(1.12) brightness(1.06)'
					: 'none',
				ease: 'power2.out',
				overwrite: 'auto'
			});
			gsap.to(toggle, {
				duration: 0.24,
				borderColor: baseBorderColor(),
				boxShadow: activeShadow(),
				ease: 'power2.out',
				overwrite: 'auto'
			});
		}

			toggle.addEventListener('mouseenter', onMouseEnter);
			toggle.addEventListener('mouseleave', onMouseLeave);
			toggle.addEventListener('focus', onHoverIn);
			toggle.addEventListener('blur', function() {
				onHoverOut();
			});
		toggle.addEventListener('click', onPress, { passive: true });

		if (window.MutationObserver) {
			var observer = new window.MutationObserver(onStateChange);
			observer.observe(toggle, { attributes: true, attributeFilter: ['class'] });
		}

		onStateChange();
	}

		function initToggleMicroInteractions() {
			if (hasGlobalEstrelaMenu()) return;
			ensureGsapCore().then(function(gsap) {
				if (!gsap) return;
				document.querySelectorAll('.menu-toggle').forEach(function(toggle) {
					if (toggle.hasAttribute('data-estrela-menu-toggle')) return;
					bindToggle(toggle, gsap);
				});
			});
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







// Auto resize input
function resizeInput() {
    $(this).attr('size', $(this).val().length);
}

$('input[type="text"], input[type="email"]')
    // event handler
    .keyup(resizeInput)
    // resize on page load
    .each(resizeInput);

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

/* Estrela-style overlay menu (for pages using `data-estrela-*` markup). */
(function() {
	var selectors = {
		MENU: '[data-estrela-menu]',
		TOGGLE: '[data-estrela-menu-toggle]',
		CLOSE: '[data-estrela-menu-close]'
	};

		var closeMq = window.matchMedia ? window.matchMedia('(max-width: 1099px)') : null;
		var defaultLockMs = 1150;
			var state = {
				open: false,
				animating: false,
			queued: null,
			timer: null,
			lockY: 0,
			lockStyles: null,
			lockMode: ''
		};
		var lastActiveElement = null;
			var interactionMenu = window.__lawaniInteractionSystem && window.__lawaniInteractionSystem.menu
				? window.__lawaniInteractionSystem.menu
				: null;
			var hoverPrimeHandler = null;

		function setMenuHoverEnabled(enabled) {
			var root = document.documentElement;
			var body = document.body;
			if (root) root.classList.toggle('estrela-menu-hover-enabled', !!enabled);
			if (body) body.classList.toggle('estrela-menu-hover-enabled', !!enabled);
		}

		function teardownMenuHoverPriming(menu) {
			if (!menu || !hoverPrimeHandler) return;
			menu.removeEventListener('pointermove', hoverPrimeHandler, true);
			menu.removeEventListener('mousemove', hoverPrimeHandler, true);
			hoverPrimeHandler = null;
		}

		function primeMenuHover(menu) {
			if (!menu) return;
			teardownMenuHoverPriming(menu);
			setMenuHoverEnabled(false);

			hoverPrimeHandler = function() {
				if (!state.open) return;
				setMenuHoverEnabled(true);
				teardownMenuHoverPriming(menu);
			};

			menu.addEventListener('pointermove', hoverPrimeHandler, true);
			menu.addEventListener('mousemove', hoverPrimeHandler, true);
		}

	function syncInteractionMenuState() {
		if (interactionMenu) {
			interactionMenu.hasGlobalMenu = true;
			interactionMenu.open = !!state.open;
			interactionMenu.animating = !!state.animating;
			interactionMenu.lockY = typeof state.lockY === 'number' ? state.lockY : 0;
		}

		var root = document.documentElement;
		var body = document.body;
		if (root) {
			root.classList.toggle('estrela-menu-animating', !!state.animating);
		}
		if (body) {
			body.classList.toggle('estrela-menu-animating', !!state.animating);
		}
	}

	function escapeHtml(value) {
		var map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#39;'
		};
		return String(value).replace(/[&<>"']/g, function(ch) {
			return map[ch];
		});
	}

	function applySplitHoverMarkup(el) {
		if (!el || el.dataset.estrelaSplitReady === '1') return;
		if (el.querySelector && el.querySelector('.split-hover')) {
			el.dataset.estrelaSplitReady = '1';
			return;
		}

		var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
		if (!text) return;

		var safeText = escapeHtml(text);
		el.innerHTML =
			'<span class="split split-hover">' +
				'<span class="line line-normal">' + safeText + '</span>' +
				'<span class="line line-hover">' + safeText + '</span>' +
			'</span>';
		el.dataset.estrelaSplitReady = '1';
	}

	function normalizeHoverMarkup(menu, nav) {
		if (nav) {
			nav.querySelectorAll('.n-link').forEach(applySplitHoverMarkup);
		}
		if (menu) {
			menu.querySelectorAll('.m-social-link').forEach(applySplitHoverMarkup);
		}
	}

		function bindCloseButtonMicroInteraction(menu) {
			if (!menu) return;
			var closeBtn = menu.querySelector('.m-close');
			if (!closeBtn || closeBtn.dataset.estrelaCloseFxBound === '1') return;
			closeBtn.dataset.estrelaCloseFxBound = '1';

			function resetPointerState() {
				closeBtn.style.setProperty('--estrela-close-px', '0');
				closeBtn.style.setProperty('--estrela-close-py', '0');
				closeBtn.classList.remove('is-pointing');
			}

			closeBtn.addEventListener('pointermove', function(evt) {
				if (!state.open) return;
				var rect = closeBtn.getBoundingClientRect();
				if (!rect.width || !rect.height) return;
				var x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
				var y = ((evt.clientY - rect.top) / rect.height) * 2 - 1;
				var px = Math.max(-1, Math.min(1, x));
				var py = Math.max(-1, Math.min(1, y));
				closeBtn.style.setProperty('--estrela-close-px', px.toFixed(3));
				closeBtn.style.setProperty('--estrela-close-py', py.toFixed(3));
				closeBtn.classList.add('is-pointing');
			});

			closeBtn.addEventListener('pointerleave', resetPointerState);
			closeBtn.addEventListener('blur', resetPointerState);
			resetPointerState();
		}

		function syncMenuPreviewVideos(menu, shouldPlay) {
			if (!menu) return;
			menu.querySelectorAll('.menu-preview-video').forEach(function(videoEl) {
				if (!(videoEl instanceof HTMLMediaElement)) return;
				if (shouldPlay) {
					videoEl.muted = true;
					videoEl.loop = true;
					var playbackPromise = videoEl.play();
					if (playbackPromise && typeof playbackPromise.catch === 'function') {
						playbackPromise.catch(function() {});
					}
				} else {
					try {
						videoEl.pause();
					} catch (err) {}
				}
			});
		}

			function updateCloseMobileState(menu) {
				if (!menu) return;
				var closeBtn = menu.querySelector('.m-close');
				if (!closeBtn) return;

			var isMobile = closeMq ? closeMq.matches : window.innerWidth <= 1099;
			closeBtn.classList.toggle('is-mobile', !!isMobile);
		}

		function prefersFixedBodyLock() {
			if (!window.matchMedia) return false;
			return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
		}

		function restoreScrollPositionInstant(y) {
			var root = document.documentElement;
			if (!root) {
				window.scrollTo(0, y);
				return;
			}

			var previousBehavior = root.style.scrollBehavior;
			root.style.scrollBehavior = 'auto';
			window.scrollTo(0, y);

			window.requestAnimationFrame(function() {
				root.style.scrollBehavior = previousBehavior;
			});
		}

		function lockBodyScroll() {
			var body = document.body;
			var root = document.documentElement;
			if (!body || !root) return;
			if (body.dataset.estrelaBodyLock === '1') return;

			state.lockY = window.pageYOffset || root.scrollTop || 0;
			state.lockStyles = {
				position: body.style.position,
				top: body.style.top,
				left: body.style.left,
				right: body.style.right,
				width: body.style.width,
				overflow: body.style.overflow,
				touchAction: body.style.touchAction,
				overscrollBehavior: root.style.overscrollBehavior
			};

			state.lockMode = prefersFixedBodyLock() ? 'fixed' : 'overflow';
			if (state.lockMode === 'fixed') {
				body.style.position = 'fixed';
				body.style.top = (-state.lockY) + 'px';
				body.style.left = '0';
				body.style.right = '0';
				body.style.width = '100%';
			} else {
				body.style.position = state.lockStyles.position || '';
				body.style.top = state.lockStyles.top || '';
				body.style.left = state.lockStyles.left || '';
				body.style.right = state.lockStyles.right || '';
				body.style.width = state.lockStyles.width || '';
			}
			body.style.overflow = 'hidden';
			body.style.touchAction = 'none';
			root.style.overscrollBehavior = 'none';
			body.dataset.estrelaBodyLock = '1';
			body.dataset.estrelaLockY = String(state.lockY);
			syncInteractionMenuState();
		}

		function unlockBodyScroll() {
			var body = document.body;
			if (!body || body.dataset.estrelaBodyLock !== '1') return;

			var prev = state.lockStyles || {};
			body.style.position = prev.position || '';
			body.style.top = prev.top || '';
			body.style.left = prev.left || '';
			body.style.right = prev.right || '';
			body.style.width = prev.width || '';
			body.style.overflow = prev.overflow || '';
			body.style.touchAction = prev.touchAction || '';
			var root = document.documentElement;
			if (root) {
				root.style.overscrollBehavior = prev.overscrollBehavior || '';
			}
			delete body.dataset.estrelaBodyLock;
			delete body.dataset.estrelaLockY;

			var y = typeof state.lockY === 'number' ? state.lockY : 0;
			if (state.lockMode === 'fixed') {
				restoreScrollPositionInstant(y);
			}
			state.lockStyles = null;
			state.lockY = 0;
			state.lockMode = '';
			syncInteractionMenuState();
		}

		function syncMenuScrollLockCompensation(open) {
			var root = document.documentElement;
			var body = document.body;
			if (!root || !body) return;

			if (!open) {
				root.style.removeProperty('--estrela-scroll-lock-pr');
				return;
			}

			var gutterValue = '';
			var hasStableGutter = false;
			if (window.getComputedStyle) {
				gutterValue = (window.getComputedStyle(root).getPropertyValue('scrollbar-gutter') || '').trim();
				hasStableGutter = gutterValue.indexOf('stable') !== -1;
			}

			if (hasStableGutter) {
				root.style.setProperty('--estrela-scroll-lock-pr', '0px');
				return;
			}

			var viewportWidth = window.innerWidth || 0;
			var layoutWidth = root.clientWidth || 0;
			var scrollbarGap = Math.max(0, viewportWidth - layoutWidth);
			root.style.setProperty('--estrela-scroll-lock-pr', scrollbarGap + 'px');
		}

			function applyOpenClasses(open) {
				document.documentElement.classList.toggle('estrela-menu-open', open);
				document.documentElement.classList.toggle('menu-active', open);
				document.body.classList.toggle('estrela-menu-open', open);
				document.body.classList.toggle('menu-active', open);
				if (!open) {
					setMenuHoverEnabled(false);
				}
				syncMenuScrollLockCompensation(open);
				if (open) {
					lockBodyScroll();
				} else {
					unlockBodyScroll();
			}
			syncInteractionMenuState();
		}

	function parseDurationMs(value) {
		if (!value) return NaN;
		var raw = String(value).trim();
		if (!raw) return NaN;
		if (raw.endsWith('ms')) return parseFloat(raw);
		if (raw.endsWith('s')) return parseFloat(raw) * 1000;
		return parseFloat(raw);
	}

	function getMenuLockMs() {
		if (typeof window.__lawaniGetInteractionTokenMs === 'function') {
			return window.__lawaniGetInteractionTokenMs('--estrela-menu-state-lock', defaultLockMs);
		}
		var rootStyle = window.getComputedStyle ? window.getComputedStyle(document.documentElement) : null;
		if (!rootStyle) return defaultLockMs;
		var fromCss = parseDurationMs(rootStyle.getPropertyValue('--estrela-menu-state-lock'));
		return isNaN(fromCss) ? defaultLockMs : Math.max(0, fromCss);
	}

	function syncA11y(menu, toggle, open) {
		menu.setAttribute('aria-hidden', open ? 'false' : 'true');
		toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
		toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
	}

	function flushQueuedState() {
		state.animating = false;
		syncInteractionMenuState();
		if (state.queued === null) return;

		var nextState = state.queued;
		state.queued = null;
		if (nextState !== state.open) {
			setOpen(nextState, true);
		}
	}

		function resetClosedState() {
			var menu = document.querySelector(selectors.MENU);
			var toggle = document.querySelector(selectors.TOGGLE);
			if (!menu || !toggle) return;

		clearTimeout(state.timer);
		state.timer = null;
		state.open = false;
		state.animating = false;
		state.queued = null;
		syncInteractionMenuState();

			applyOpenClasses(false);
			teardownMenuHoverPriming(menu);
			setMenuHoverEnabled(false);
			syncMenuPreviewVideos(menu, false);
			syncA11y(menu, toggle, false);
			updateCloseMobileState(menu);
		}

	function isOpen() {
		return state.open;
	}

	function setOpen(open, force) {
		var menu = document.querySelector(selectors.MENU);
		var toggle = document.querySelector(selectors.TOGGLE);
		if (!menu || !toggle) return;

		if (state.animating && !force) {
			state.queued = open;
			return;
		}

		if (!force && state.open === open) {
			return;
		}

		clearTimeout(state.timer);
		state.timer = null;
		state.animating = true;
		state.open = open;
		syncInteractionMenuState();

		if (open) {
			lastActiveElement = document.activeElement || null;
		}

			updateCloseMobileState(menu);
			applyOpenClasses(open);
			syncA11y(menu, toggle, open);
			syncMenuPreviewVideos(menu, open);
			if (open) {
				primeMenuHover(menu);
			} else {
				teardownMenuHoverPriming(menu);
				setMenuHoverEnabled(false);
			}

		if (open) {
			var focusTarget = menu.querySelector(selectors.CLOSE) || menu.querySelector('.m-link');
			if (focusTarget && typeof focusTarget.focus === 'function') {
				window.requestAnimationFrame(function() {
					try {
						focusTarget.focus();
					} catch (e) {}
				});
			}
		} else if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
			try {
				lastActiveElement.focus();
			} catch (e) {}
			lastActiveElement = null;
		}

		state.timer = window.setTimeout(flushQueuedState, getMenuLockMs());
	}

	function openMenu(evt) {
		if (evt) evt.preventDefault();
		setOpen(true);
	}

	function closeMenu(evt) {
		if (evt) evt.preventDefault();
		setOpen(false);
	}

	function toggleMenu(evt) {
		if (evt) evt.preventDefault();
		setOpen(!isOpen());
	}

	function bindMenuEvents() {
		var menu = document.querySelector(selectors.MENU);
		var toggle = document.querySelector(selectors.TOGGLE);
		var nav = document.querySelector('[data-estrela-nav]');
		if (!menu || !toggle) return;

		normalizeHoverMarkup(menu, nav);
		updateCloseMobileState(menu);
		bindCloseButtonMicroInteraction(menu);
		syncMenuPreviewVideos(menu, isOpen());

		if (toggle.dataset.estrelaMenuBound !== '1') {
			toggle.dataset.estrelaMenuBound = '1';
			toggle.addEventListener('click', toggleMenu);
		}

		menu.querySelectorAll(selectors.CLOSE).forEach(function(el) {
			if (el.dataset.estrelaMenuCloseBound === '1') return;
			el.dataset.estrelaMenuCloseBound = '1';
			el.addEventListener('click', closeMenu);
		});

		menu.querySelectorAll('.m-link').forEach(function(el) {
			if (el.dataset.estrelaMenuLinkBound === '1') return;
			el.dataset.estrelaMenuLinkBound = '1';
			el.addEventListener('click', closeMenu);
		});

		if (document.documentElement.dataset.estrelaMenuEscapeBound !== '1') {
			document.documentElement.dataset.estrelaMenuEscapeBound = '1';
			document.addEventListener('keydown', function(evt) {
				if (evt.key === 'Escape') closeMenu();
			});
		}

			if (document.documentElement.dataset.estrelaMenuResizeBound !== '1') {
				document.documentElement.dataset.estrelaMenuResizeBound = '1';
				window.addEventListener('resize', rafThrottle(function() {
					var currentMenu = document.querySelector(selectors.MENU);
					updateCloseMobileState(currentMenu);
					if (isOpen()) {
						syncMenuScrollLockCompensation(true);
					}
				}));
			}
		}

	function init() {
		resetClosedState();
		bindMenuEvents();
		syncInteractionMenuState();
	}

	$(window).off('page:ready.estrelaMenu init.estrelaMenu');
	$(window).on('page:ready.estrelaMenu init.estrelaMenu', init);

	if (document.documentElement.dataset.estrelaMenuReadyBound !== '1') {
		document.documentElement.dataset.estrelaMenuReadyBound = '1';
		window.addEventListener('lawani:global-menu-ready', function() {
			$(window).trigger('init.estrelaMenu');
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener(
			'DOMContentLoaded',
			function() {
				$(window).trigger('init.estrelaMenu');
			},
			{ once: true }
		);
	} else {
		$(window).trigger('init.estrelaMenu');
	}
})();
