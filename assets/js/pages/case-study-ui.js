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
    var videos = Array.prototype.slice.call(
      document.querySelectorAll(".cs-story__media video, video[data-lazy-video]")
    );
    if (!videos.length) return;

    var observer = null;

    function loadVideo(video) {
      if (video.dataset.lazyLoaded) return;
      video.dataset.lazyLoaded = "true";
      video.load();
    }

    function playWhenVisible(video) {
      if (document.hidden || document.body.classList.contains("ll-pitch-overlay-open")) return;
      loadVideo(video);
      video.play().catch(function (error) {
        if (error.name === "AbortError") return;
        console.warn("Case study video could not be played:", error);

        var poster = video.getAttribute("poster");
        if (poster && !video.dataset.fallbackShown) {
          video.dataset.fallbackShown = "true";
          video.style.display = "none";
          var fallbackImg = document.createElement("img");
          fallbackImg.src = poster;
          fallbackImg.alt = "Case study image";
          fallbackImg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;";
          video.parentNode.insertBefore(fallbackImg, video);
        }
      });
    }

    function updatePlayback() {
      videos.forEach(function (video) {
        if (document.hidden) {
          video.pause();
          return;
        }
        var bounds = video.getBoundingClientRect();
        if (bounds.bottom > 0 && bounds.top < window.innerHeight) playWhenVisible(video);
      });
    }

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            var video = entry.target;
            if (entry.isIntersecting) playWhenVisible(video);
            else video.pause();
          });
        },
        { threshold: 0.08, rootMargin: "600px 0px" }
      );
      videos.forEach(function (video) {
        observer.observe(video);
      });
    } else {
      updatePlayback();
      window.addEventListener("scroll", updatePlayback, { passive: true });
      window.addEventListener("resize", updatePlayback, { passive: true });
    }

    document.addEventListener("visibilitychange", updatePlayback);

    window.addEventListener("beforeunload", function () {
      if (observer) observer.disconnect();
      window.removeEventListener("scroll", updatePlayback);
      window.removeEventListener("resize", updatePlayback);
      document.removeEventListener("visibilitychange", updatePlayback);
    }, { once: true });
  }

  function initCaseReveals() {
    var targets = Array.prototype.slice.call(
      document.querySelectorAll(".case-study .ll-reveal:not(.cs-story__media)")
    );
    var storyCopy = document.querySelector(".cs-story__copy");
    var observer = null;
    if (storyCopy) storyCopy.style.setProperty("--ll-reveal-delay", "40ms");
    if (!targets.length) return;

    function reveal(target) {
      if (target.classList.contains("ll-reveal")) target.classList.add("is-visible");
    }

    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach(reveal);
      return;
    }

    observer = new IntersectionObserver(
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

    window.addEventListener("beforeunload", function () {
      if (observer) observer.disconnect();
    }, { once: true });
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
