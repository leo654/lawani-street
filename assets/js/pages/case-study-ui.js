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
    var storyCopy = document.querySelector(".cs-story__copy");
    if (storyCopy) storyCopy.classList.remove("ll-reveal");
    var targets = Array.prototype.slice.call(
      document.querySelectorAll(".case-study .ll-reveal:not(.cs-story__media)")
    ).filter(function (target) {
      return !target.closest(".cs-related, .cs-footer") && target !== storyCopy;
    });
    if (!targets.length) return;

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    if (!reduceMotion && gsap && ScrollTrigger) {
      document.body.classList.add("cs-reveals-ready", "cs-reveals-gsap");

      var context = gsap.context(function () {
        targets.forEach(function (target) {
          var timeline = gsap.timeline({
            scrollTrigger: {
              trigger: target,
              start: "top 90%",
              once: true
            },
            onComplete: function () {
              target.classList.add("is-visible");
            }
          });

          timeline.fromTo(target, {
            autoAlpha: 0,
            y: 14
          }, {
            autoAlpha: 1,
            y: 0,
            duration: 0.68,
            delay: (parseFloat(window.getComputedStyle(target).getPropertyValue("--ll-reveal-delay")) || 0) / 1000,
            ease: "expo.out",
            overwrite: "auto"
          }, 0);

        });
      }, document.body);

      ScrollTrigger.refresh();
      window.addEventListener("pagehide", function (event) {
        if (!event.persisted) context.revert();
      }, { once: true });
      return;
    }

    var observer = null;

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

  /* Tiles fade and sharpen in as each image arrives, instead of popping in. */
  function initMediaLoad() {
    Array.prototype.slice.call(document.querySelectorAll(".cs-split__media img")).forEach(function (image) {
      if (image.complete && image.naturalWidth > 0) return;
      image.classList.add("cs-media", "cs-media-pending");
      function done() {
        window.requestAnimationFrame(function () { image.classList.remove("cs-media-pending"); });
      }
      image.addEventListener("load", done, { once: true });
      image.addEventListener("error", done, { once: true });
    });
  }

  /* Tiles wipe in as they scroll into view: a cover in the page colour drops off each picture, top edge first
     (styles in case-study-polish.css). Tiles already on screen wait for the page intro
     (after the preloader or the page curtain) so they play in view, and nothing stays covered if that signal never
     comes. Without IntersectionObserver, or with reduced motion, tiles are simply shown. */
  function initTileReveals() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    var tiles = Array.prototype.slice.call(document.querySelectorAll(".cs-gallery figure, .cs-next-panel__media"));
    if (!tiles.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries
        .filter(function (entry) { return entry.isIntersecting; })
        .sort(function (a, b) {
          return (a.boundingClientRect.top - b.boundingClientRect.top) || (a.boundingClientRect.left - b.boundingClientRect.left);
        })
        .forEach(function (entry, index) {
          observer.unobserve(entry.target);
          entry.target.style.setProperty("--cs-tile-delay", Math.min(index, 4) * 90 + "ms");
          entry.target.classList.add("is-in");
        });
    }, { rootMargin: "0px 0px -4% 0px" });

    tiles.forEach(function (tile) { tile.classList.add("cs-tile"); });
    document.body.classList.add("cs-tiles-ready");

    var started = false;
    function start() {
      if (started) return;
      started = true;
      tiles.forEach(function (tile) { observer.observe(tile); });
    }

    if (document.documentElement.classList.contains("mk-intro-pending")) {
      window.addEventListener("mk:intro", start, { once: true });
      window.setTimeout(start, 6000);
    } else {
      start();
    }
  }

  /* While the end card is on screen, the panel's own next-project row steps back (body.cs-next-near) so the same
     link never shows twice side by side. */
  function initNextNear() {
    var panel = document.querySelector(".cs-next-panel");
    if (!panel || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        document.body.classList.toggle("cs-next-near", entry.isIntersecting);
      });
    }, { rootMargin: "0px 0px -15% 0px" }).observe(panel);
  }

  /* The next project is fetched ahead once its end card comes within a screen or so, so the page curtain only
     covers the move, not the download. */
  function initNextPrefetch() {
    var link = document.querySelector(".cs-next-panel__link[href]");
    if (!link || !("IntersectionObserver" in window)) return;
    var connection = window.navigator.connection;
    if (connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ""))) return;

    var observer = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      observer.disconnect();
      var hint = document.createElement("link");
      hint.rel = "prefetch";
      hint.as = "document";
      hint.href = link.href;
      document.head.appendChild(hint);
    }, { rootMargin: "0px 0px 100% 0px" });
    observer.observe(link);
  }

  function ready() {
    document.body.classList.add("cs-motion-ready", "cs-intro-complete");
    initCaseStudyEffects();
    initMediaLoad();
    initGalleryLayout();
    initVideoPlayback();
    initCaseReveals();
    initTileReveals();
    initNextNear();
    initNextPrefetch();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready, { once: true });
  } else {
    ready();
  }
})();
