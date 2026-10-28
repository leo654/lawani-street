(function () {
  "use strict";

  if (window.LawaniMotion) return;

  var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  var scheduled = new Map();
  var frameId = 0;
  var smoothScroll = null;
  var smoothScrollCleanup = null;
  var smoothScrollGeneration = 0;
  var smoothScrollLoading = false;
  var navigateToPage = null;

  function reduced() {
    return motionPreference.matches;
  }

  function flushFrame() {
    frameId = 0;
    var jobs = Array.from(scheduled.values());
    scheduled.clear();
    jobs.forEach(function (job) { job(); });
  }

  function frame(key, callback) {
    scheduled.set(key, callback);
    if (!frameId) frameId = window.requestAnimationFrame(flushFrame);
  }

  function animate(element, keyframes, options) {
    if (!element || typeof element.animate !== "function" || reduced()) return null;
    return element.animate(keyframes, options);
  }

  function initSmoothScroll() {
    if (reduced() || smoothScroll || smoothScrollLoading || !document.querySelector("main") || document.body.classList.contains("ll-deck-page")) return;

    smoothScrollLoading = true;
    var generation = ++smoothScrollGeneration;

    import("lenis").then(function (lenisModule) {
      if (generation === smoothScrollGeneration) smoothScrollLoading = false;
      if (generation !== smoothScrollGeneration || reduced() || document.body.classList.contains("ll-deck-page")) return;

      var Lenis = lenisModule.default;
      var instance = new Lenis({
        autoRaf: false,
        allowNestedScroll: true,
        anchors: false,
        // Reduce the easing tail so wheel input feels direct without snapping.
        lerp: 0.2,
        smoothWheel: true,
        wheelMultiplier: 1
      });
      smoothScroll = instance;

      instance.on("scroll", function () {
        if (window.ScrollTrigger) window.ScrollTrigger.update();
      });

      var rafId = 0;
      var gsapTicker = null;
      var changedGsapLagSmoothing = false;
      if (window.gsap && window.gsap.ticker) {
        gsapTicker = function (time) {
          instance.raf(time * 1000);
        };
        window.gsap.ticker.add(gsapTicker);
        if (typeof window.gsap.ticker.lagSmoothing === "function") {
          window.gsap.ticker.lagSmoothing(0);
          changedGsapLagSmoothing = true;
        }
      } else {
        var raf = function (time) {
          instance.raf(time);
          rafId = window.requestAnimationFrame(raf);
        };
        rafId = window.requestAnimationFrame(raf);
      }

      function syncScrollLock() {
        var body = document.body;
        var html = document.documentElement;
        var locked = body.classList.contains("ll-menu-open") ||
          body.classList.contains("ll-showreel-open") ||
          body.classList.contains("ll-pitch-overlay-open") ||
          html.classList.contains("ll-page-leaving") ||
          body.style.overflow === "hidden" ||
          html.style.overflow === "hidden";
        if (locked || reduced() || document.hidden) instance.stop();
        else instance.start();
      }

      var lockObserver = new MutationObserver(syncScrollLock);
      lockObserver.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
      lockObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
      syncScrollLock();

      function handlePageShow(event) {
        if (event.persisted) {
          instance.resize();
          instance.scrollTo(window.scrollY, { immediate: true, force: true });
        }
        syncScrollLock();
      }

      function cleanup() {
        lockObserver.disconnect();
        window.removeEventListener("pageshow", handlePageShow);
        window.removeEventListener("pagehide", handlePageHide);
        document.removeEventListener("visibilitychange", syncScrollLock);
        if (gsapTicker && window.gsap && window.gsap.ticker) window.gsap.ticker.remove(gsapTicker);
        if (changedGsapLagSmoothing && window.gsap && window.gsap.ticker) {
          window.gsap.ticker.lagSmoothing(500, 33);
        }
        if (rafId) window.cancelAnimationFrame(rafId);
        instance.destroy();
        if (smoothScroll === instance) smoothScroll = null;
        if (smoothScrollCleanup === cleanup) smoothScrollCleanup = null;
      }

      function handlePageHide(event) {
        instance.stop();
        if (!event.persisted) cleanup();
      }

      window.addEventListener("pageshow", handlePageShow);
      window.addEventListener("pagehide", handlePageHide);
      document.addEventListener("visibilitychange", syncScrollLock);
      smoothScrollCleanup = cleanup;
    }).catch(function () {
      if (generation === smoothScrollGeneration) smoothScrollLoading = false;
      // Native scrolling remains available when Lenis is not bundled.
    });
  }

  function syncMotionPreference() {
    if (reduced()) {
      smoothScrollGeneration += 1;
      smoothScrollLoading = false;
      if (smoothScrollCleanup) smoothScrollCleanup();
      return;
    }
    if (!reduced()) initSmoothScroll();
  }

  if (typeof motionPreference.addEventListener === "function") {
    motionPreference.addEventListener("change", syncMotionPreference);
  } else if (typeof motionPreference.addListener === "function") {
    motionPreference.addListener(syncMotionPreference);
  }

  function observe(elements, onEnter, options) {
    var nodes = Array.prototype.slice.call(elements || []).filter(Boolean);
    if (!nodes.length) return null;

    if (reduced() || !("IntersectionObserver" in window)) {
      nodes.forEach(onEnter);
      return null;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        onEnter(entry.target, entry);
        observer.unobserve(entry.target);
      });
    }, options || { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });

    nodes.forEach(function (node) { observer.observe(node); });
    return observer;
  }

  function initAnchorMotion() {
    if (document.body && document.body.classList.contains("ll-deck-page")) return;

    document.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;

      var hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      var target;
      try { target = document.querySelector(hash); } catch (error) { return; }
      if (!target) return;

      event.preventDefault();
      window.LawaniMotion.scrollTo(target);
      if (window.history && window.history.pushState) window.history.pushState(null, "", hash);
    });
  }

  function initPageTransitions() {
    if (!document.body || document.body.classList.contains("redirect-page")) return;

    var overlay = document.querySelector(".ll-page-transition");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "ll-page-transition";
      overlay.setAttribute("aria-hidden", "true");
      document.body.appendChild(overlay);
    }

    function reset() {
      document.documentElement.classList.remove("ll-page-leaving");
      overlay.classList.remove("is-covering", "is-revealing");
    }

    window.addEventListener("pageshow", function (event) {
      if (event.persisted) reset();
    });

    var entering = false;
    try {
      entering = window.sessionStorage.getItem("ll-page-transition") === "1";
      window.sessionStorage.removeItem("ll-page-transition");
    } catch (error) {}

    if (entering && !reduced()) {
      overlay.classList.add("is-covering");
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { overlay.classList.add("is-revealing"); });
      });
    }

    navigateToPage = function (destination) {
      var target;
      try {
        target = new URL(destination, window.location.href);
      } catch (error) {
        console.error("Unable to navigate to the requested page.", error);
        return;
      }

      if (target.origin !== window.location.origin || reduced() ||
        document.documentElement.classList.contains("ll-page-leaving")) {
        window.location.assign(target.href);
        return;
      }

      document.documentElement.classList.add("ll-page-leaving");
      try { window.sessionStorage.setItem("ll-page-transition", "1"); } catch (error) {}

      var completed = false;
      function navigate() {
        if (completed) return;
        completed = true;
        window.location.assign(target.href);
      }

      function onCoverEnd(transitionEvent) {
        if (transitionEvent.target !== overlay || transitionEvent.propertyName !== "transform" || transitionEvent.pseudoElement) return;
        overlay.removeEventListener("transitionend", onCoverEnd);
        navigate();
      }

      overlay.addEventListener("transitionend", onCoverEnd);
      var transitionDuration = window.getComputedStyle(overlay).transitionDuration
        .split(",")
        .map(function (value) { return parseFloat(value) * (value.indexOf("ms") === -1 ? 1000 : 1); })
        .filter(Number.isFinite)
        .reduce(function (longest, value) { return Math.max(longest, value); }, 0);
      window.setTimeout(function () {
        overlay.removeEventListener("transitionend", onCoverEnd);
        navigate();
      }, transitionDuration + 120);
    };

    document.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var link = event.target.closest("a[href]");
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;

      var raw = link.getAttribute("href");
      if (!raw || raw.charAt(0) === "#" || /^(?:mailto|tel|javascript):/i.test(raw)) return;

      var target;
      try { target = new URL(link.href, window.location.href); } catch (error) { return; }
      if (target.origin !== window.location.origin) return;
      if (target.pathname === window.location.pathname && target.search === window.location.search) return;
      if (reduced()) return;

      event.preventDefault();
      navigateToPage(target.href);
    });
  }

  window.LawaniMotion = {
    animate: animate,
    frame: frame,
    observe: observe,
    reduced: reduced,
    scrollTo: function (target, options) {
      options = options || {};
      if (smoothScroll) {
        smoothScroll.scrollTo(target, options);
        return;
      }

      var offset = Number(options.offset) || 0;
      var top = typeof target === "number" ? target : null;
      if (typeof target === "string") {
        if (["top", "start", "#"].indexOf(target) !== -1) top = 0;
        else if (["bottom", "end"].indexOf(target) !== -1) {
          top = document.documentElement.scrollHeight - window.innerHeight;
        } else {
          try { target = document.querySelector(target); } catch (error) { target = null; }
        }
      }
      if (top === null && target && typeof target.getBoundingClientRect === "function") {
        top = target.getBoundingClientRect().top + window.scrollY;
      }
      if (top === null || !Number.isFinite(top)) return;

      window.scrollTo({
        top: Math.max(0, top + offset),
        behavior: reduced() || options.immediate ? "auto" : (options.behavior || "smooth")
      });
    },
    navigateToPage: function (destination) {
      if (navigateToPage) navigateToPage(destination);
      else window.location.assign(destination);
    },
    scheduleFrame: function (key, callback) {
      frame(key, callback);
    }
  };

  function ready() {
    initSmoothScroll();
    initAnchorMotion();
    initPageTransitions();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, { once: true });
  else ready();
})();
