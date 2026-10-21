(function () {
  "use strict";

  if (window.LawaniMotion) return;

  var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  var scheduled = new Map();
  var frameId = 0;
  var smoothScroll = null;
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
    if (reduced() || !document.querySelector("main") || document.body.classList.contains("ll-deck-page")) return;

    import("lenis").then(function (lenisModule) {
      if (smoothScroll || reduced()) return;

      var Lenis = lenisModule.default;
      smoothScroll = new Lenis({
        autoRaf: false,
        allowNestedScroll: true,
        anchors: false,
        lerp: 0.085,
        smoothWheel: true,
        wheelMultiplier: 0.9
      });

      smoothScroll.on("scroll", function () {
        if (window.ScrollTrigger) window.ScrollTrigger.update();
      });

      var rafId = 0;
      var gsapTicker = null;
      if (window.gsap && window.gsap.ticker) {
        gsapTicker = function (time) {
          smoothScroll.raf(time * 1000);
        };
        window.gsap.ticker.add(gsapTicker);
        window.gsap.ticker.lagSmoothing(0);
      } else {
        var raf = function (time) {
          smoothScroll.raf(time);
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
        if (locked) smoothScroll.stop();
        else smoothScroll.start();
      }

      var lockObserver = new MutationObserver(syncScrollLock);
      lockObserver.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
      lockObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
      syncScrollLock();

      function handlePageShow(event) {
        if (event.persisted) {
          smoothScroll.resize();
          smoothScroll.scrollTo(window.scrollY, { immediate: true, force: true });
        }
        syncScrollLock();
      }

      window.addEventListener("pageshow", handlePageShow);
      window.addEventListener("pagehide", function (event) {
        smoothScroll.stop();
        if (event.persisted) return;

        lockObserver.disconnect();
        window.removeEventListener("pageshow", handlePageShow);
        if (gsapTicker) window.gsap.ticker.remove(gsapTicker);
        if (rafId) window.cancelAnimationFrame(rafId);
        smoothScroll.destroy();
      }, { once: true });
    }).catch(function () {
      // Native scrolling remains available when Lenis is not bundled.
    });
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
      if (smoothScroll && !reduced()) smoothScroll.scrollTo(target);
      else target.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
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
      if (smoothScroll) smoothScroll.scrollTo(target, options);
      else if (target && typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
      }
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
