(function() {
	'use strict';

	var NAV_KEY = 'gsap-page-sweep-pending';
	var PRECOVER_CLASS = 'gsap-page-sweep-precover-active';
	var TRANSITIONING_CLASS = 'gsap-page-sweep-transitioning';
	var STYLE_ID = 'gsap-page-sweep-precover-style';
	var LAYER_ID = 'gsap-page-sweep-layer';
	var isNavigating = false;
	var shared = window.__lawaniShared = window.__lawaniShared || {};

	if (typeof shared.loadScriptOnce !== 'function') {
		shared.loadScriptOnce = function(src, markerAttr) {
			return new Promise(function(resolve) {
				if (!src || !markerAttr) {
					resolve(false);
					return;
				}

				var existing = document.querySelector('script[' + markerAttr + '="1"]');
				if (existing) {
					if (existing.getAttribute('data-loaded') === '1') {
						resolve(true);
						return;
					}
					existing.addEventListener('load', function() { resolve(true); }, { once: true });
					existing.addEventListener('error', function() { resolve(false); }, { once: true });
					return;
				}

				var script = document.createElement('script');
				script.src = src;
				script.async = true;
				script.defer = true;
				script.setAttribute(markerAttr, '1');
				script.onload = function() {
					script.setAttribute('data-loaded', '1');
					resolve(true);
				};
				script.onerror = function() {
					resolve(false);
				};
				document.head.appendChild(script);
			});
		};
	}

	if (typeof shared.createZonedClock !== 'function') {
		shared.createZonedClock = function(options) {
			var config = options || {};
			var timezone = config.timezone || 'UTC';
			var fallbackTimeValue = typeof config.fallbackTimeValue === 'string' ? config.fallbackTimeValue : '00:00:00';
			var fallbackZoneLabel = typeof config.fallbackZoneLabel === 'string' ? config.fallbackZoneLabel : '(GMT)';
			var timeFormatter = null;
			var zoneFormatter = null;

			try {
				timeFormatter = new Intl.DateTimeFormat('en-GB', {
					timeZone: timezone,
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					hour12: false
				});

				zoneFormatter = new Intl.DateTimeFormat('en-US', {
					timeZone: timezone,
					timeZoneName: 'shortOffset'
				});
			} catch (error) {
				timeFormatter = null;
				zoneFormatter = null;
			}

			function getZoneLabel(now) {
				if (!zoneFormatter) return fallbackZoneLabel;

				var parts = zoneFormatter.formatToParts(now);
				var zonePart = parts.find(function(part) {
					return part.type === 'timeZoneName';
				});
				if (!zonePart || !zonePart.value) return fallbackZoneLabel;

				var match = zonePart.value.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/i);
				if (!match) return fallbackZoneLabel;

				var hours = parseInt(match[1], 10);
				var minutes = match[2] ? ':' + match[2] : '';
				var prefix = hours >= 0 ? '+' + hours : String(hours);
				return '(GMT' + prefix + (minutes === ':00' ? '' : minutes) + ')';
			}

			return {
				read: function(now) {
					var current = now instanceof Date ? now : new Date();
					return {
						time: timeFormatter ? timeFormatter.format(current) : fallbackTimeValue,
						zone: getZoneLabel(current)
					};
				}
			};
		};
	}

	function getDocEl() {
		return document.documentElement || null;
	}

	function ensureStyle() {
		if (document.getElementById(STYLE_ID)) return;
		var style = document.createElement('style');
		style.id = STYLE_ID;
		style.textContent = [
			'html.' + PRECOVER_CLASS + ' body{opacity:0 !important;}',
			'html.' + TRANSITIONING_CLASS + ' body{pointer-events:none !important;}',
			'#' + LAYER_ID + '{position:fixed !important;inset:0 !important;z-index:2147483647 !important;visibility:hidden;opacity:0;pointer-events:none !important;overflow:hidden !important;isolation:isolate !important;background:transparent !important;contain:paint !important;}',
			'#' + LAYER_ID + ' .page-sweep-panel{position:absolute !important;inset:-2px !important;transform:translate3d(102%,0,0);will-change:transform;backface-visibility:hidden;transform-style:preserve-3d;}',
			'#' + LAYER_ID + ' .page-sweep-panel--orange{z-index:2147483646 !important;background:#fd4015;}',
			'#' + LAYER_ID + ' .page-sweep-panel--white{z-index:2147483647 !important;background:#fff;}'
		].join('');
		document.head.appendChild(style);
	}

	function ensureLayer() {
		var layer = document.getElementById(LAYER_ID);
		if (!layer) {
			layer = document.createElement('div');
			layer.id = LAYER_ID;
			layer.setAttribute('aria-hidden', 'true');
			layer.innerHTML = [
				"<div class='page-sweep-panel page-sweep-panel--orange'></div>",
				"<div class='page-sweep-panel page-sweep-panel--white'></div>"
			].join('');
			var docEl = getDocEl();
			if (docEl) {
				docEl.appendChild(layer);
			}
		}
		return {
			layer: layer,
			orange: layer ? layer.querySelector('.page-sweep-panel--orange') : null,
			white: layer ? layer.querySelector('.page-sweep-panel--white') : null
		};
	}

	function setPending(flag) {
		try {
			if (flag) {
				window.sessionStorage.setItem(NAV_KEY, '1');
			} else {
				window.sessionStorage.removeItem(NAV_KEY);
			}
		} catch (error) {}
	}

	function isPending() {
		try {
			return window.sessionStorage.getItem(NAV_KEY) === '1';
		} catch (error) {
			return false;
		}
	}

	function runAfterPaint(callback) {
		window.requestAnimationFrame(function() {
			window.requestAnimationFrame(function() {
				callback();
			});
		});
	}

	function showCoveredState() {
		var docEl = getDocEl();
		if (!docEl) return;
		ensureStyle();
		var parts = ensureLayer();
		if (!parts.layer || !parts.orange || !parts.white) return;

		docEl.classList.add(PRECOVER_CLASS);
		docEl.classList.add(TRANSITIONING_CLASS);
		parts.layer.style.visibility = 'visible';
		parts.layer.style.opacity = '1';
		parts.orange.style.transition = 'none';
		parts.white.style.transition = 'none';
		parts.orange.style.transform = 'translate3d(0,0,0)';
		parts.white.style.transform = 'translate3d(0,0,0)';
	}

	function unlockFailSafe(delayMs) {
		window.setTimeout(function() {
			setPending(false);
			var docEl = getDocEl();
			if (docEl) {
				docEl.classList.remove(PRECOVER_CLASS);
				docEl.classList.remove(TRANSITIONING_CLASS);
			}
			var layer = document.getElementById(LAYER_ID);
			if (layer) {
				layer.style.opacity = '0';
				layer.style.visibility = 'hidden';
			}
		}, delayMs);
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
		if (url.pathname === window.location.pathname && url.search === window.location.search) return null;
		return url.href;
	}

	function shouldHandleLink(event, link) {
		if (!link || !event || event.defaultPrevented) return null;
		if (typeof event.button === 'number' && event.button !== 0) return null;
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
		if (link.hasAttribute('download')) return null;
		if (link.hasAttribute('data-no-transition')) return null;
		var href = (link.getAttribute('href') || '').trim();
		if (!href || href.charAt(0) === '#') return null;
		if (/^(mailto:|tel:|javascript:)/i.test(href)) return null;
		var target = (link.getAttribute('target') || '').toLowerCase();
		if (target && target !== '_self') return null;
		return normalizeDestination(link.href);
	}

	function runFallbackExit(destination) {
		var docEl = getDocEl();
		if (!docEl) {
			window.location.assign(destination);
			return;
		}

		ensureStyle();
		var parts = ensureLayer();
		if (!parts.layer || !parts.orange || !parts.white) {
			window.location.assign(destination);
			return;
		}

		setPending(true);
		docEl.classList.add(TRANSITIONING_CLASS);
		parts.layer.style.visibility = 'visible';
		parts.layer.style.opacity = '1';
		parts.orange.style.transition = 'none';
		parts.white.style.transition = 'none';
		parts.orange.style.transform = 'translate3d(102%,0,0)';
		parts.white.style.transform = 'translate3d(102%,0,0)';
		void parts.layer.offsetHeight;

		runAfterPaint(function() {
			parts.orange.style.transition = 'transform 1.04s cubic-bezier(0.87,0,0.13,1)';
			parts.white.style.transition = 'transform 1.02s cubic-bezier(0.87,0,0.13,1) 0.16s';
			parts.orange.style.transform = 'translate3d(0,0,0)';
			parts.white.style.transform = 'translate3d(0,0,0)';

			window.setTimeout(function() {
				runAfterPaint(function() {
					window.location.assign(destination);
				});
			}, 1320);
		});
	}

	function onEarlyClick(event) {
		var target = event.target;
		if (!target || typeof target.closest !== 'function') return;
		var link = target.closest('a[href]');
		var destination = shouldHandleLink(event, link);
		if (!destination) return;
		if (isNavigating) {
			event.preventDefault();
			return;
		}

		event.preventDefault();
		if (typeof event.stopImmediatePropagation === 'function') {
			event.stopImmediatePropagation();
		}
		if (typeof event.stopPropagation === 'function') {
			event.stopPropagation();
		}

		isNavigating = true;

		if (typeof window.navigateWithTransition === 'function') {
			window.navigateWithTransition(destination);
			return;
		}

		runFallbackExit(destination);
	}

	try {
		ensureStyle();

		if (typeof shared.loadScriptOnce === 'function') {
			shared.loadScriptOnce('assets/js/blend-gradient.js', 'data-blend-gradient');
		}

		if (isPending()) {
			showCoveredState();
			unlockFailSafe(12000);
		}

		window.addEventListener('click', onEarlyClick, true);
	} catch (error) {
		// Silently ignore to avoid blocking navigation.
	}
})();
