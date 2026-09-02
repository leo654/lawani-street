(function() {
  'use strict';

  if (!document.body || !document.body.classList.contains('home-index')) return;

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function() {
    var body = document.body;

    var revealItems = Array.prototype.slice.call(document.querySelectorAll('[data-alive-reveal]'));
    if (revealItems.length) {
      if (reduceMotion || !('IntersectionObserver' in window)) {
        revealItems.forEach(function(item) {
          item.classList.add('is-alive-inview');
        });
      } else {
        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-alive-inview');
            observer.unobserve(entry.target);
          });
        }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });

        revealItems.forEach(function(item) {
          observer.observe(item);
        });
      }
    }

    var workRoot = document.querySelector('#work-list-projects');
    var projects = workRoot ? Array.prototype.slice.call(workRoot.querySelectorAll('.work-list-project')) : [];

    function setDimmed(active) {
      projects.forEach(function(project) {
        project.classList.toggle('is-dimmed', !!active && project !== active);
      });
    }

    if (projects.length && !reduceMotion) {
      projects.forEach(function(project) {
        project.addEventListener('mouseenter', function() {
          setDimmed(project);
        }, { passive: true });
        project.addEventListener('focusin', function() {
          setDimmed(project);
        });
        project.addEventListener('pointermove', function(event) {
          var rect = project.getBoundingClientRect();
          var x = rect.width ? ((event.clientX - rect.left) / rect.width) * 100 : 50;
          var y = rect.height ? ((event.clientY - rect.top) / rect.height) * 100 : 50;
          project.style.setProperty('--row-x', clamp(x, 0, 100).toFixed(2) + '%');
          project.style.setProperty('--row-y', clamp(y, 0, 100).toFixed(2) + '%');
        }, { passive: true });
      });

      workRoot.addEventListener('mouseleave', function() {
        setDimmed(null);
      }, { passive: true });
      workRoot.addEventListener('focusout', function(event) {
        if (!workRoot.contains(event.relatedTarget)) setDimmed(null);
      });
    }
  });
})();
