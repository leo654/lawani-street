/* Services breaker marquee with a true continuous loop (index-only) */
(function() {
	'use strict';

	var resizeTimer = 0;
	var REDUCE_MOTION_QUERY = window.matchMedia
		? window.matchMedia('(prefers-reduced-motion: reduce)')
		: null;

	function getPrimarySegment(inner) {
		if (!inner) return null;

		var segments = inner.querySelectorAll('.services-breaker__segment');
		for (var i = 0; i < segments.length; i += 1) {
			if (segments[i].getAttribute('data-marquee-clone') !== '1') {
				return segments[i];
			}
		}

		return null;
	}

	function getSectionMedia(section) {
		var inner = section ? section.querySelector('.services-breaker__track-inner') : null;
		var segment = getPrimarySegment(inner);

		if (!segment) return [];

		return Array.prototype.slice.call(
			segment.querySelectorAll('img, video')
		);
	}

	function ensureTrackLoop(track) {
		var inner = track ? track.querySelector('.services-breaker__track-inner') : null;
		var segment = getPrimarySegment(inner);
		var segmentWidth = 0;
		var trackWidth = 0;
		var requiredSegments = 2;
		var i;

		if (!inner || !segment) return null;

		Array.prototype.slice.call(inner.querySelectorAll('[data-marquee-clone="1"]')).forEach(function(clone) {
			clone.parentNode.removeChild(clone);
		});

		segmentWidth = Math.max(segment.scrollWidth, Math.ceil(segment.getBoundingClientRect().width));
		trackWidth = track.clientWidth || 0;
		requiredSegments = segmentWidth
			? Math.max(2, Math.ceil(trackWidth / segmentWidth) + 1)
			: 2;

		for (i = 1; i < requiredSegments; i += 1) {
			var clone = segment.cloneNode(true);
			clone.setAttribute('aria-hidden', 'true');
			clone.setAttribute('data-marquee-clone', '1');
			inner.appendChild(clone);
		}

		inner.setAttribute('data-loop-cloned', String(requiredSegments));
		return {
			inner: inner,
			segment: segment
		};
	}

	function killTween(inner) {
		if (!inner || !inner._lawaniMarqueeTween) return;
		inner._lawaniMarqueeTween.kill();
		inner._lawaniMarqueeTween = null;
	}

	function resetSection(section) {
		var inner = section ? section.querySelector('.services-breaker__track-inner') : null;
		if (!inner) return;

		killTween(inner);
		inner.style.transform = 'translate3d(0,0,0)';
		inner.classList.remove('is-services-looping');
		inner.style.removeProperty('--services-loop-width');
		inner.style.removeProperty('--services-loop-duration');
	}

	function initSection(section) {
		var track = section ? section.querySelector('.services-breaker__track') : null;
		var loop = ensureTrackLoop(track);
		var inner = loop ? loop.inner : null;
		var segment = loop ? loop.segment : null;
		var prefersReducedMotion = !!(REDUCE_MOTION_QUERY && REDUCE_MOTION_QUERY.matches);

		if (!track || !inner || !segment) return;

		resetSection(section);

		if (prefersReducedMotion) return;

		window.requestAnimationFrame(function() {
			var loopWidth = Math.max(segment.scrollWidth, Math.ceil(segment.getBoundingClientRect().width));
			var speed = 72;
			var duration = loopWidth > 0 ? Math.max(16, loopWidth / speed) : 28;

			if (!loopWidth) return;

			inner.style.setProperty('--services-loop-width', loopWidth + 'px');
			inner.style.setProperty('--services-loop-duration', duration + 's');

			if (window.gsap && typeof window.gsap.fromTo === 'function') {
				window.gsap.set(inner, { x: 0, force3D: true });
				inner._lawaniMarqueeTween = window.gsap.fromTo(inner, {
					x: 0
				}, {
					x: -loopWidth,
					duration: duration,
					ease: 'none',
					repeat: -1
				});
				return;
			}

			inner.classList.add('is-services-looping');
		});
	}

	function bindMediaRefresh(section) {
		getSectionMedia(section).forEach(function(media) {
			if (!media || media.getAttribute('data-marquee-watch') === '1') return;

			media.setAttribute('data-marquee-watch', '1');

			if (media.tagName === 'IMG') {
				if (!media.complete) {
					media.addEventListener('load', scheduleRefresh, { once: true });
				}
				return;
			}

			if (media.tagName === 'VIDEO' && media.readyState < 1) {
				media.addEventListener('loadedmetadata', scheduleRefresh, { once: true });
			}
		});
	}

	function initServicesBreakerMarquee() {
		Array.prototype.slice.call(document.querySelectorAll('.services-breaker')).forEach(function(section) {
			initSection(section);
			bindMediaRefresh(section);
		});
	}

	function scheduleRefresh() {
		window.clearTimeout(resizeTimer);
		resizeTimer = window.setTimeout(initServicesBreakerMarquee, 120);
	}

	$(window).off('page:ready.servicesBreaker resize.servicesBreaker');
	$(window).on('page:ready.servicesBreaker', initServicesBreakerMarquee);
	$(window).on('resize.servicesBreaker', scheduleRefresh);

	if (REDUCE_MOTION_QUERY && typeof REDUCE_MOTION_QUERY.addEventListener === 'function') {
		REDUCE_MOTION_QUERY.addEventListener('change', initServicesBreakerMarquee);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initServicesBreakerMarquee, { once: true });
	} else {
		initServicesBreakerMarquee();
	}
})();
