(function () {
  "use strict";

  if (!document.body || !document.body.classList.contains("case-study")) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("cs-preloader-active");

  function initCasePreloader() {
    var body = document.body;

    function revealImmediately() {
      document.documentElement.classList.remove("cs-preloader-active");
      body.classList.remove("cs-preloading");
      body.classList.add("cs-motion-ready", "cs-intro-complete");
    }

    if (reduceMotion) {
      revealImmediately();
      return;
    }

    body.classList.add("cs-preloading");

    var loader = document.createElement("div");
    loader.className = "cs-page-loader";
    loader.setAttribute("aria-hidden", "true");
    loader.innerHTML =
      '<span class="cs-page-loader__counter">00%</span>' +
      '<span class="cs-page-loader__mark">L:</span>';
    body.insertBefore(loader, body.firstChild);

    var counter = loader.querySelector(".cs-page-loader__counter");
    var startedAt = performance.now();
    var counterDuration = 620;
    var finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      if (counter) counter.textContent = "100%";
      loader.classList.add("is-mark-visible");

      window.setTimeout(function () {
        body.classList.add("cs-motion-ready");
        loader.classList.add("is-exiting");
      }, 470);

      window.setTimeout(function () {
        loader.remove();
        document.documentElement.classList.remove("cs-preloader-active");
        body.classList.remove("cs-preloading");
        body.classList.add("cs-intro-complete");
      }, 1220);
    }

    function updateCounter(now) {
      if (finished) return;
      var progress = Math.min(1, Math.max(0, (now - startedAt) / counterDuration));
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.min(100, Math.floor(eased * 100));
      if (counter) counter.textContent = String(value).padStart(2, "0") + "%";

      if (progress < 1) window.requestAnimationFrame(updateCounter);
      else finish();
    }

    window.requestAnimationFrame(updateCounter);
    window.setTimeout(finish, 1800);
  }

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
    var storyCopy = document.querySelector(".cs-story__copy");
    var storyMedia = document.querySelector(".cs-story__media");
    if (storyCopy) storyCopy.style.setProperty("--ll-reveal-delay", "40ms");
    if (storyMedia) storyMedia.style.setProperty("--ll-reveal-delay", "150ms");
    if (!figures.length) return;

    document.querySelectorAll(".cs-gallery__row").forEach(function (row) {
      Array.prototype.slice.call(row.querySelectorAll("figure")).forEach(function (figure, index) {
        figure.style.setProperty("--cs-reveal-order", String(index));
      });
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      figures.forEach(function (figure) {
        figure.classList.add("is-inview");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-inview");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
    );

    figures.forEach(function (figure) {
      observer.observe(figure);
    });
  }

  function ready() {
    initCasePreloader();
    initCaseStudyEffects();
    initVideoPlayback();
    initCaseReveals();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready, { once: true });
  } else {
    ready();
  }
})();
