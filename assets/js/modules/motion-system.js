(function () {
  "use strict";

  if (window.LawaniMotion) return;

  var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  var scheduled = new Map();
  var frameId = 0;

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
      target.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
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

    document.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var link = event.target.closest("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      var raw = link.getAttribute("href");
      if (!raw || raw.charAt(0) === "#" || /^(?:mailto|tel|javascript):/i.test(raw)) return;
      if (/pitchdeck\.html(?:[?#].*)?$/i.test(raw)) return;

      var target;
      try { target = new URL(link.href, window.location.href); } catch (error) { return; }
      if (target.origin !== window.location.origin) return;
      if (target.pathname === window.location.pathname && target.search === window.location.search) return;
      if (reduced()) return;

      event.preventDefault();
      if (document.documentElement.classList.contains("ll-page-leaving")) return;
      document.documentElement.classList.add("ll-page-leaving");
      try { window.sessionStorage.setItem("ll-page-transition", "1"); } catch (error) {}

      var completed = false;
      function navigate() {
        if (completed) return;
        completed = true;
        window.location.assign(target.href);
      }

      overlay.addEventListener("transitionend", navigate, { once: true });
      window.setTimeout(navigate, 720);
    });
  }

  window.LawaniMotion = {
    animate: animate,
    frame: frame,
    observe: observe,
    reduced: reduced
  };

  function ready() {
    initAnchorMotion();
    initPageTransitions();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, { once: true });
  else ready();
})();
