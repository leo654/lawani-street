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
        // Follow the wheel with a frame-rate-independent damp (Lenis's default 0.1). A fixed-duration ease
        // (Hayler's 1.2s expo) was tried and felt glitchy: every trackpad event restarts the ease.
        lerp: 0.1,
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

  /*
   * Page transition (Hayler-style): four vertical bands sweep up over the content, hold
   * while the next page loads, then pull away on arrival. Order [2, 0, 3, 1].
   *
   * Why it stays smooth:
   *  - the bands are Web Animations on `transform` only, so they run on the compositor and keep
   *    their pace while the page underneath is busy (the next page booting, a long task, a slow phone).
   *    Driven from JavaScript, one long task freezes the curtain mid-sweep;
   *  - the click itself does almost nothing: the colour is read before the root class flips and the
   *    cup stops drawing;
   *  - one colour for the whole transition: the leaving page's colour is carried over (sessionStorage +
   *    --ll-arrive-colour) so the curtain never changes shade at the hand-off;
   *  - the next page is prefetched on hover/touch/focus and again when the cover starts;
   *  - the reveal starts the moment the new page is ready (motion kit booted, fonts, the images in the
   *    first screen decoded) instead of after a fixed idle wait, and the page intro starts partway
   *    through the reveal (LawaniMotion.arriving / the ll:page-reveal event) so it plays in view.
   */
  var BAND_ORDER = [2, 0, 3, 1];
  var COVER = { duration: 640, easing: "cubic-bezier(0.45, 0, 0.15, 1)", stagger: 50, leaveAt: 0.82 };
  var REVEAL = { duration: 880, easing: "cubic-bezier(0.55, 0, 0.1, 1)", stagger: 50 };
  var REVEAL_MAX_WAIT = 1400;
  var IMAGE_MAX_WAIT = 600;
  var COLOUR_KEY = "ll-page-transition-colour";
  var prefetched = {};

  function prefetchPage(href) {
    try {
      var url = new URL(href, window.location.href);
      var key = url.pathname + url.search;
      if (url.origin !== window.location.origin || prefetched[key] || url.pathname === window.location.pathname) return;
      if (!/(\.html?|\/)$/.test(url.pathname)) return;
      if (/\/pitchdeck\.html$/.test(url.pathname)) return; // the overlay preloads its own deck
      var connection = window.navigator.connection;
      if (connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ""))) return;
      prefetched[key] = true;
      var link = document.createElement("link");
      if (link.relList && link.relList.supports && link.relList.supports("prefetch")) {
        link.rel = "prefetch";
        link.as = "document";
        link.href = url.href;
        document.head.appendChild(link);
      } else if (window.fetch) {
        window.fetch(url.href, { credentials: "same-origin" }).catch(function () {});
      }
    } catch (error) {}
  }

  // Images in the first screen that are still loading: reveal onto pictures, not onto holes. Lazy images
  // below the top of the screen are not waited for (the browser may not even have started them), and the
  // whole wait is capped so a slow or stuck picture can never hold the curtain.
  function firstScreenImages() {
    var pending = [];
    var limit = window.innerHeight * 0.75;
    Array.prototype.forEach.call(document.images, function (image) {
      if (image.complete) return;
      var rect = image.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2 || rect.bottom < 0 || rect.top > limit) return;
      pending.push(image.decode
        ? image.decode().catch(function () {})
        : new Promise(function (resolve) {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          }));
    });
    if (!pending.length) return Promise.resolve();
    return Promise.race([
      Promise.all(pending),
      new Promise(function (resolve) { window.setTimeout(resolve, IMAGE_MAX_WAIT); })
    ]);
  }

  // Calls back once the new page is ready to be looked at: motion kit booted (so its set-up work is
  // finished and cannot stutter the reveal), fonts ready, first-screen images decoded. Never later
  // than REVEAL_MAX_WAIT.
  function whenSettled(callback) {
    var done = false;
    var cap = 0;
    function go() {
      if (done) return;
      done = true;
      window.clearTimeout(cap);
      window.requestAnimationFrame(callback);
    }
    cap = window.setTimeout(go, REVEAL_MAX_WAIT);
    var kit = new Promise(function (resolve) {
      if (window.MotionKit && window.MotionKit.booted) resolve();
      else window.addEventListener("mk:booted", resolve, { once: true });
    });
    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.all([kit, fonts]).then(firstScreenImages).then(go, go);
  }

  function pageColour() {
    var colour = window.getComputedStyle(document.body).backgroundColor;
    if (!colour || colour === "transparent" || /rgba\(.*,\s*0\)$/.test(colour)) {
      colour = window.getComputedStyle(document.documentElement).backgroundColor;
    }
    return colour && colour !== "transparent" ? colour : "#efeee8";
  }

  function canAnimateBands() {
    return !reduced() && typeof Element !== "undefined" && typeof Element.prototype.animate === "function";
  }

  function initPageTransitions() {
    if (!document.body || document.body.classList.contains("redirect-page")) return;

    var root = document.documentElement;
    var overlay = document.querySelector(".ll-page-transition");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "ll-page-transition";
      overlay.setAttribute("aria-hidden", "true");
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = "";
    var bands = [];
    for (var bandIndex = 0; bandIndex < 4; bandIndex += 1) {
      var band = document.createElement("span");
      band.className = "ll-page-band";
      overlay.appendChild(band);
      bands.push(band);
    }
    var ordered = BAND_ORDER.map(function (index) { return bands[index]; });
    var running = [];

    function paint(colour) {
      overlay.style.setProperty("--ll-band-colour", colour || pageColour());
    }

    function stopBands() {
      running.forEach(function (animation) { try { animation.cancel(); } catch (error) {} });
      running = [];
    }

    // Sweeps the bands over (from the bottom) or off (towards the top). Returns the last animation.
    function sweep(cover, timing) {
      stopBands();
      var frames = cover
        ? [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }]
        : [{ transform: "scaleY(1)" }, { transform: "scaleY(0)" }];
      ordered.forEach(function (target, order) {
        target.style.transformOrigin = cover ? "50% 100%" : "50% 0%";
        running.push(target.animate(frames, {
          duration: timing.duration,
          delay: order * timing.stagger,
          easing: timing.easing,
          fill: "both"
        }));
      });
      return running[running.length - 1];
    }

    // While the curtain moves, the page behind it holds perfectly still: GSAP's ticker sleeps (marquees, scrubbed
    // scroll effects, the cursor, follower images), videos pause and CSS animations pause (motion-system.css). Nothing
    // is resumed on the way out, because the page is leaving; it is only thawed if the navigation never happens.
    var pausedVideos = [];
    var pausedAnimations = [];
    var tickerAsleep = false;

    // CSS transitions and animations that the click itself set off (the menu closing, a hover easing in) are paused
    // a frame after it, just as they start, so the page keeps the look it had when the visitor clicked.
    function freezeCssMotion() {
      if (!document.getAnimations || !root.classList.contains("ll-page-leaving")) return;
      try {
        document.getAnimations().forEach(function (animation) {
          var isCss = (typeof CSSTransition !== "undefined" && animation instanceof CSSTransition) ||
            (typeof CSSAnimation !== "undefined" && animation instanceof CSSAnimation);
          if (!isCss || animation.playState === "paused" || animation.playState === "finished") return;
          var target = animation.effect && animation.effect.target;
          if (target && target.closest && target.closest(".ll-page-transition")) return;
          animation.pause();
          pausedAnimations.push(animation);
        });
      } catch (error) {}
    }

    function freezePage() {
      window.requestAnimationFrame(freezeCssMotion);
      try {
        if (window.gsap && window.gsap.ticker && window.gsap.ticker.sleep) { window.gsap.ticker.sleep(); tickerAsleep = true; }
      } catch (error) {}
      try {
        pausedVideos = Array.prototype.filter.call(document.querySelectorAll("video"), function (video) { return !video.paused && !video.ended; });
        pausedVideos.forEach(function (video) { video.pause(); });
      } catch (error) {}
    }
    function thawPage() {
      if (tickerAsleep) {
        tickerAsleep = false;
        try { window.gsap.ticker.wake(); } catch (error) {}
      }
      pausedVideos.forEach(function (video) { try { var played = video.play(); if (played && played.catch) played.catch(function () {}); } catch (error) {} });
      pausedVideos = [];
      pausedAnimations.forEach(function (animation) { try { animation.play(); } catch (error) {} });
      pausedAnimations = [];
    }

    function reset() {
      stopBands();
      root.classList.remove("ll-page-leaving");
      overlay.classList.remove("is-covering", "is-leaving");
      thawPage();
    }

    window.addEventListener("pageshow", function (event) {
      if (event.persisted) reset();
    });

    var entering = false;
    var carriedColour = "";
    try {
      entering = window.sessionStorage.getItem("ll-page-transition") === "1";
      carriedColour = window.sessionStorage.getItem(COLOUR_KEY) || "";
      window.sessionStorage.removeItem("ll-page-transition");
      window.sessionStorage.removeItem(COLOUR_KEY);
    } catch (error) {}

    paint(entering ? carriedColour : "");

    // Arrival: start fully covered (in the colour we left), then the bands pull away upward.
    if (entering && canAnimateBands()) {
      window.LawaniMotion.arriving = true;
      overlay.classList.add("is-covering");
      root.classList.remove("mk-arriving");
      whenSettled(function () {
        var last = sweep(false, REVEAL);
        window.LawaniMotion.revealed = true;
        window.dispatchEvent(new CustomEvent("ll:page-reveal"));
        // The page intro (motion-kit.js) waits for this: nothing on the page moves until the last band has cleared.
        function cleared() {
          window.LawaniMotion.cleared = true;
          reset();
          window.dispatchEvent(new CustomEvent("ll:page-cleared"));
        }
        last.finished.then(cleared, cleared);
      });
    } else {
      root.classList.remove("mk-arriving");
    }

    navigateToPage = function (destination) {
      var target;
      try {
        target = new URL(destination, window.location.href);
      } catch (error) {
        console.error("Unable to navigate to the requested page.", error);
        return;
      }

      if (target.origin !== window.location.origin || !canAnimateBands() || root.classList.contains("ll-page-leaving")) {
        window.location.assign(target.href);
        return;
      }

      var colour = pageColour();                      // read before the class change, while styles are clean
      try {
        window.sessionStorage.setItem("ll-page-transition", "1");
        window.sessionStorage.setItem(COLOUR_KEY, colour);
      } catch (error) {}
      paint(colour);
      overlay.classList.add("is-leaving");
      root.classList.add("ll-page-leaving");
      window.dispatchEvent(new CustomEvent("ll:page-leave"));
      freezePage();
      prefetchPage(target.href); // the cover takes ~0.7s: enough for the next page to arrive

      var completed = false;
      function navigate() {
        if (completed) return;
        completed = true;
        window.location.assign(target.href);
        // Still here six seconds later: the next page could not be fetched (offline, server error).
        // Lift the curtain rather than strand the visitor under it; this timer dies with the page when
        // the navigation does happen.
        window.setTimeout(function () {
          try {
            window.sessionStorage.removeItem("ll-page-transition");
            window.sessionStorage.removeItem(COLOUR_KEY);
          } catch (error) {}
          sweep(false, REVEAL).finished.then(reset, reset);
        }, 6000);
      }
      window.setTimeout(navigate, 2000); // never strand the visitor

      var last = sweep(true, COVER);
      // The last band is >98% across by `leaveAt`; leave then so the hold is only the load.
      window.setTimeout(navigate, (ordered.length - 1) * COVER.stagger + COVER.duration * COVER.leaveAt);
      last.finished.then(navigate, navigate);
    };

    // Warm the next page as soon as a visitor shows intent.
    function warm(event) {
      var link = event.target && event.target.closest ? event.target.closest("a[href]") : null;
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      var raw = link.getAttribute("href");
      if (!raw || raw.charAt(0) === "#" || /^(?:mailto|tel|javascript):/i.test(raw)) return;
      prefetchPage(link.href);
    }
    document.addEventListener("pointerover", warm, { passive: true, capture: true });
    document.addEventListener("touchstart", warm, { passive: true, capture: true });
    document.addEventListener("focusin", warm, { passive: true, capture: true });

    // The URL a click on `link` would take over with the curtain, or null when the browser should just follow it.
    function curtainTarget(link, event) {
      if (!link || (event && (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey))) return null;
      if ((link.target && link.target !== "_self") || link.hasAttribute("download")) return null;

      var raw = link.getAttribute("href");
      if (!raw || raw.charAt(0) === "#" || /^(?:mailto|tel|javascript):/i.test(raw)) return null;

      var target;
      try { target = new URL(link.href, window.location.href); } catch (error) { return null; }
      if (target.origin !== window.location.origin) return null;
      if (target.pathname === window.location.pathname && target.search === window.location.search) return null;
      if (!canAnimateBands()) return null;
      // Resume links open the full-screen overlay (pitchdeck-overlay.js); the page curtain must not
      // also run and then navigate away to pitchdeck.html.
      if (/\/pitchdeck\.html$/.test(target.pathname) && !document.body.classList.contains("ll-deck-page")) return null;
      return target;
    }

    document.addEventListener("click", function (event) {
      var link = event.target.closest("a[href]");
      var target = curtainTarget(link, event);
      if (!target) return;

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
    navigateToPage: function (destination, label) {
      if (navigateToPage) navigateToPage(destination, label);
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
