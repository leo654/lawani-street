(function () {
  "use strict";

  if (!document.body || !document.body.classList.contains("case-study")) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initCaseStudyEffects() {
    var progress = document.querySelector("[data-cs-scroll-progress]");
    var hero = document.querySelector(".cs-hero");
    if (!progress && !hero) return;

    var ticking = false;

    function update() {
      var maximum = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var pageProgress = Math.min(1, Math.max(0, window.scrollY / maximum));

      if (progress) progress.style.transform = "scaleX(" + pageProgress.toFixed(4) + ")";

      if (hero) {
        var heroProgress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, hero.offsetHeight)));
        hero.style.setProperty("--cs-hero-progress", heroProgress.toFixed(4));
      }

      ticking = false;
    }

    function requestUpdate() {
      if (window.LawaniMotion) {
        window.LawaniMotion.frame("case-study", update);
        return;
      }
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
  }

  function initVideoPlayback() {
    var video = document.querySelector(".cs-story__media video");
    if (!video) return;

    function playWhenVisible() {
      if (document.hidden || document.body.classList.contains("ll-pitch-overlay-open")) return;
      video.play().catch(function () {});
    }

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) playWhenVisible();
            else video.pause();
          });
        },
        { threshold: 0.08, rootMargin: "80px 0px" }
      );
      observer.observe(video);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        video.pause();
      } else {
        var bounds = video.getBoundingClientRect();
        if (bounds.bottom > 0 && bounds.top < window.innerHeight) playWhenVisible();
      }
    });
  }

  function initCaseReveals() {
    var figures = Array.prototype.slice.call(document.querySelectorAll(".cs-gallery figure"));
    var revealNodes = Array.prototype.slice.call(document.querySelectorAll(".case-study .ll-reveal"));
    var targets = Array.from(new Set(figures.concat(revealNodes)));
    var storyCopy = document.querySelector(".cs-story__copy");
    var storyMedia = document.querySelector(".cs-story__media");
    if (storyCopy) storyCopy.style.setProperty("--ll-reveal-delay", "40ms");
    if (storyMedia) storyMedia.style.setProperty("--ll-reveal-delay", "150ms");
    if (!targets.length) return;

    document.querySelectorAll(".cs-gallery__row").forEach(function (row) {
      Array.prototype.slice.call(row.querySelectorAll("figure")).forEach(function (figure, index) {
        figure.style.setProperty("--cs-reveal-order", String(index));
      });
    });

    function reveal(target) {
      if (target.classList.contains("ll-reveal")) target.classList.add("is-visible");
      if (target.matches(".cs-gallery figure")) target.classList.add("is-inview");
    }

    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach(reveal);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
    );

    targets.forEach(function (target) {
      observer.observe(target);
    });
    document.body.classList.add("cs-reveals-ready");
  }

  function initGalleryLayout() {
    if (document.body.classList.contains("case-study--kicksjoint")) return;

    var widePairCount = 0;
    document.querySelectorAll(".cs-gallery__row--pair").forEach(function (row) {
      var figures = Array.prototype.slice.call(row.querySelectorAll(":scope > figure"));
      if (figures.length !== 2) return;

      var images = figures.map(function (figure) {
        return figure.querySelector("img");
      });
      if (images.some(function (image) { return !image; })) return;

      var isWidePair = images.every(function (image) {
        var width = image.naturalWidth || Number(image.getAttribute("width"));
        var height = image.naturalHeight || Number(image.getAttribute("height"));
        return width > 0 && height > 0 && width / height >= 1.35;
      });
      if (!isWidePair) return;

      if (widePairCount % 2 === 1) row.classList.add("cs-gallery__row--feature-pair");
      widePairCount += 1;
    });
  }

  function ready() {
    document.body.classList.add("cs-motion-ready", "cs-intro-complete");
    initCaseStudyEffects();
    initGalleryLayout();
    initVideoPlayback();
    initCaseReveals();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready, { once: true });
  } else {
    ready();
  }
})();
