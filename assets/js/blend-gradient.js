(function () {
  'use strict';

  var ROOT_ID = 'blend-gradient-root';
  var STYLE_HREF = './assets/css/blend-gradient.css';
  var MARKER = 'data-blend-gradient-ready';
  var shared = window.__lawaniShared = window.__lawaniShared || {};

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function isDarkPage(body) {
    if (!body) return false;
    if (body.classList.contains('home-index')) return true;
    if (body.classList.contains('work-archive')) return true;
    if (body.classList.contains('blend-gradient--dark')) return true;
    var themeEl = body.querySelector('[data-theme="dark"]');
    return !!themeEl;
  }

  function ensureStylesheet() {
    if (document.querySelector('link[href*="blend-gradient.css"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = STYLE_HREF + '?v=20260623-blend1';
    document.head.appendChild(link);
  }

  function ensureMount() {
    var existing = document.getElementById(ROOT_ID);
    if (existing) return existing;

    var mount = document.createElement('div');
    mount.id = ROOT_ID;
    mount.className = 'blend-gradient';
    mount.setAttribute('aria-hidden', 'true');
    mount.innerHTML = [
      '<div class="blend-gradient__layer blend-gradient__base"></div>',
      '<div class="blend-gradient__layer blend-gradient__ambient"></div>',
      '<div class="blend-gradient__layer blend-gradient__pointer"></div>',
      '<div class="blend-gradient__layer blend-gradient__texture"></div>',
      '<div class="blend-gradient__layer blend-gradient__grid"></div>',
      '<div class="blend-gradient__layer blend-gradient__scroll"></div>',
      '<div class="blend-gradient__layer blend-gradient__vignette"></div>'
    ].join('');

    var body = document.body;
    if (!body) return null;

    var first = body.firstElementChild;
    if (first) {
      body.insertBefore(mount, first);
    } else {
      body.appendChild(mount);
    }

    return mount;
  }

  function markMediaWrappers() {
    var selectors = [
      '.video-wrapper',
      '.video-container',
      '.hero__bg',
      '.main-screen__image',
      '.home-project-slides__media',
      '.media-wrapper.video-wrapper'
    ];

    selectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (node) {
        if (!node.classList.contains('blend-gradient-media')) {
          node.classList.add('blend-gradient-media');
        }
      });
    });
  }

  function initMotion(body) {
    var root = document.documentElement;
    var reduceMotion = false;

    try {
      reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {}

    var pointer = { x: 0.5, y: 0.38 };
    var ticking = false;

    function writeVars() {
      var scrollMax = Math.max(1, (document.documentElement.scrollHeight || 1) - (window.innerHeight || 1));
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
      var scrollProgress = clamp(scrollTop / scrollMax, 0, 1);

      root.style.setProperty('--blend-x', (pointer.x * 100).toFixed(2) + '%');
      root.style.setProperty('--blend-y', (pointer.y * 100).toFixed(2) + '%');
      root.style.setProperty('--blend-scroll', scrollProgress.toFixed(4));

      /* Legacy aliases used by home alive styles */
      body.style.setProperty('--alive-x', (pointer.x * 100).toFixed(2) + '%');
      body.style.setProperty('--alive-y', (pointer.y * 100).toFixed(2) + '%');
      body.style.setProperty('--alive-scroll', scrollProgress.toFixed(4));

      ticking = false;
    }

    function requestWrite() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(writeVars);
    }

    writeVars();

    if (reduceMotion) return;

    window.addEventListener(
      'pointermove',
      function (event) {
        var width = window.innerWidth || 1;
        var height = window.innerHeight || 1;
        body.classList.add('is-blend-active');
        body.classList.add('is-alive-touched');
        root.style.setProperty('--blend-press', event.buttons ? '1' : '0');
        body.style.setProperty('--alive-press', event.buttons ? '1' : '0');
        pointer.x += (event.clientX / width - pointer.x) * 0.24;
        pointer.y += (event.clientY / height - pointer.y) * 0.24;
        requestWrite();
      },
      { passive: true }
    );

    window.addEventListener(
      'scroll',
      function () {
        if ((window.pageYOffset || document.documentElement.scrollTop || 0) > 16) {
          body.classList.add('is-blend-active');
          body.classList.add('is-alive-touched');
        }
        requestWrite();
      },
      { passive: true }
    );

    window.addEventListener('resize', requestWrite, { passive: true });
  }

  function boot() {
    var body = document.body;
    if (!body || body.getAttribute(MARKER) === '1') return;

    ensureStylesheet();
    ensureMount();
    markMediaWrappers();

    if (isDarkPage(body)) {
      body.classList.add('blend-gradient--dark');
    }

    body.setAttribute(MARKER, '1');
    initMotion(body);

    if ('MutationObserver' in window) {
      var observer = new MutationObserver(function () {
        markMediaWrappers();
      });
      observer.observe(body, { childList: true, subtree: true });
    }
  }

  shared.ensureBlendGradient = boot;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
