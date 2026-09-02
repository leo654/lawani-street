(function() {
	'use strict';

	var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
	var gsapLoaderPromise = null;
	var loadScriptOnce = window.__lawaniShared && typeof window.__lawaniShared.loadScriptOnce === 'function'
		? window.__lawaniShared.loadScriptOnce
		: function() { return Promise.resolve(false); };

	function $(selector, root) {
		return Array.prototype.slice.call((root || document).querySelectorAll(selector));
	}

	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	function hoverDisabled(link) {
		if (!link || !link.getAttribute) return false;
		var raw = (link.getAttribute('data-disable-hover') || '').toLowerCase();
		return raw === 'true' || raw === '1' || raw === 'yes';
	}

	function cssNumberPx(el, varName, fallback) {
		if (!el || !window.getComputedStyle) return fallback;
		var raw = window.getComputedStyle(el).getPropertyValue(varName);
		var value = parseFloat(raw);
		return Number.isFinite(value) ? value : fallback;
	}

	function ensureGsap() {
		if (window.gsap) return Promise.resolve(window.gsap);
		if (gsapLoaderPromise) return gsapLoaderPromise;
		var src = typeof GSAP_CORE_URL === 'string' ? GSAP_CORE_URL : 'assets/js/libs/gsap.min.js';
		gsapLoaderPromise = loadScriptOnce(src, 'data-mi-gsap').then(function() { return window.gsap || null; });
		return gsapLoaderPromise;
	}

	// ---- Hover preview (nav + cards) ----
	function initPreview() {
		if (reduced || !finePointer) return;

		var preview = document.createElement('div');
		preview.className = 'mi-preview';
		preview.setAttribute('aria-hidden', 'true');
		preview.innerHTML = '<img alt="">';
		document.body.appendChild(preview);

		var img = preview.querySelector('img');
		var active = false;
		var targetX = -9999;
		var targetY = -9999;
		var x = targetX;
		var y = targetY;

		function tick() {
			x += (targetX - x) * 0.18;
			y += (targetY - y) * 0.18;
			preview.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0) scale(' + (active ? 1 : 0.96) + ')';
			requestAnimationFrame(tick);
		}

		function show(src) {
			if (!src) return;
			img.src = src;
			active = true;
			preview.classList.add('mi-preview--active');
		}

		function hide() {
			active = false;
			preview.classList.remove('mi-preview--active');
		}

		document.addEventListener('pointermove', function(e) {
			targetX = e.clientX + 18;
			targetY = e.clientY + 18;
		}, { passive: true });

		var hrefPreview = {
			'index.html': 'assets/img/bg2.png',
			'work.html': 'assets/img/bpm.png'
		};

		function previewForLink(link) {
			if (!link) return '';
			var explicit = link.getAttribute('data-preview');
			if (explicit) return explicit;
			var href = (link.getAttribute('href') || '').trim();
			if (!href) return '';
			if (hrefPreview[href]) return hrefPreview[href];
			return '';
		}

		$('a.navigation__link, .grid-item2 a[href]').forEach(function(node) {
			var link = node.tagName.toLowerCase() === 'a' ? node : node.closest('a[href]');
			if (!link) return;
			if (hoverDisabled(link)) return;
			var src = previewForLink(link);
			if (!src) return;

			link.addEventListener('pointerenter', function() { show(src); });
			link.addEventListener('pointerleave', hide);
		});

		tick();
	}

	// ---- Magnetic (CTAs) ----
	function initMagnetic() {
		if (reduced || !finePointer) return;

		ensureGsap().then(function(gsap) {
			if (!gsap) return;

			$('.btn, .menu-toggle, .navigation__link').forEach(function(el) {
				var bounds;
				var maxX = 14;
				var maxY = 10;
				function measure() {
					bounds = el.getBoundingClientRect();
					maxX = cssNumberPx(el, '--mi-magnet-x', 14);
					maxY = cssNumberPx(el, '--mi-magnet-y', 10);
				}
				measure();
				window.addEventListener('resize', measure);

				var toX = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'expo.out' });
				var toY = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'expo.out' });

				el.addEventListener('pointermove', function(e) {
					if (!bounds) return;
					var x = (e.clientX - bounds.left) / bounds.width - 0.5;
					var y = (e.clientY - bounds.top) / bounds.height - 0.5;
					toX(clamp(x * maxX, -maxX, maxX));
					toY(clamp(y * maxY, -maxY, maxY));
				});

				el.addEventListener('pointerleave', function() {
					toX(0);
					toY(0);
				});
			});
		});
	}

	// ---- Tile hover hotspot (projects grid) ----
	function initTileHotspot() {
		if (reduced || !finePointer) return;

		$('.grid-item2 a[href]').forEach(function(link) {
			if (hoverDisabled(link)) return;
			if (link.getAttribute('data-mi-hotspot') === '1') return;
			link.setAttribute('data-mi-hotspot', '1');
			link.style.setProperty('--mi-x', '50%');
			link.style.setProperty('--mi-y', '50%');

			function update(e) {
				var rect = link.getBoundingClientRect();
				if (!rect.width || !rect.height) return;
				var x = ((e.clientX - rect.left) / rect.width) * 100;
				var y = ((e.clientY - rect.top) / rect.height) * 100;
				link.style.setProperty('--mi-x', clamp(x, 0, 100).toFixed(2) + '%');
				link.style.setProperty('--mi-y', clamp(y, 0, 100).toFixed(2) + '%');
			}

			link.addEventListener('pointerenter', update, { passive: true });
			link.addEventListener('pointermove', update, { passive: true });
		});
	}

	function init() {
		initPreview();
		initMagnetic();
		initTileHotspot();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init, { once: true });
	} else {
		init();
	}
})();
