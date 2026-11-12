(function () {
  "use strict";

  if (!document.body || !document.body.classList.contains("home-index")) return;

  var reduceMotion = (window.LawaniFeatures && window.LawaniFeatures.get("reducedMotion")) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CONSTANTS = window.LawaniConstants || {};

  function scheduleMotionFrame(key, callback) {
    if (window.LawaniMotion && typeof window.LawaniMotion.scheduleFrame === "function") {
      window.LawaniMotion.scheduleFrame(key, callback);
      return;
    }
    window.requestAnimationFrame(callback);
  }

  function initServiceLinkState() {
    var nav = document.querySelector(".ll-service-links");
    if (!nav) return;

    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#service-"]'));
    var sections = links
      .map(function (link) {
        return document.querySelector(link.getAttribute("href"));
      })
      .filter(Boolean);
    if (!links.length || !sections.length) return;

    function activate(id) {
      links.forEach(function (link) {
        var active = link.getAttribute("href") === "#" + id;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    }

    links.forEach(function (link) {
      link.addEventListener("click", function () {
        activate(link.getAttribute("href").slice(1));
      });
    });

    if (!(window.LawaniFeatures && window.LawaniFeatures.supported("intersectionObserver")) &&
        !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        var visible = entries
          .filter(function (entry) {
            return entry.isIntersecting;
          })
          .sort(function (a, b) {
            return b.intersectionRatio - a.intersectionRatio;
          });
        if (visible.length) activate(visible[0].target.id);
      },
      { threshold: CONSTANTS.SCROLL?.SERVICE_LINK_THRESHOLD || [0.25, 0.5, 0.75], rootMargin: CONSTANTS.SCROLL?.SERVICE_LINK_ROOT_MARGIN || "-18% 0px -52% 0px" }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });

    window.addEventListener("beforeunload", function () {
      observer.disconnect();
    }, { once: true });
  }

  function initSkillRowSelection() {
    var rows = Array.prototype.slice.call(document.querySelectorAll("[data-skill-row]"));
    if (!rows.length) return;

    rows.forEach(function (row) {
      row.addEventListener("click", function () {
        var wasSelected = row.getAttribute("aria-pressed") === "true";

        rows.forEach(function (item) {
          item.setAttribute("aria-pressed", "false");
        });

        if (!wasSelected) row.setAttribute("aria-pressed", "true");
      });
    });
  }

  // Runs `retry` once, on the first real user gesture. Used when autoplay is refused.
  function retryOnFirstGesture(retry) {
    var events = ["pointerdown", "keydown", "touchend"];
    function fire() {
      events.forEach(function (name) { document.removeEventListener(name, fire, true); });
      retry();
    }
    events.forEach(function (name) { document.addEventListener(name, fire, { capture: true, passive: true }); });
  }

  // Looping background videos in the About section. They load only when they are about to
  // scroll into view: starting them with the page competed with the scripts for the browser's
  // connection slots (Safari on an HTTP/1.1 server held the page's scripts back for ~14 s).
  function initAboutVideos() {
    var videos = Array.prototype.slice.call(document.querySelectorAll("video[data-lazy-autoplay]"));
    if (!videos.length) return;
    var gestureArmed = false;

    function start(video) {
      video.muted = true;
      if (video.preload !== "auto") video.preload = "auto";
      var attempt = video.play();
      if (!attempt || typeof attempt.catch !== "function") return;
      attempt.catch(function (error) {
        if (!error || error.name !== "NotAllowedError" || gestureArmed) return;
        // Autoplay refused (Firefox "Block Audio and Video", iOS Low Power Mode): the poster
        // stays on screen and the films start on the first click, key press or touch.
        gestureArmed = true;
        retryOnFirstGesture(function () {
          gestureArmed = false;
          videos.forEach(function (item) {
            if (item.dataset.inView === "true") start(item);
          });
        });
      });
    }

    if (!("IntersectionObserver" in window)) {
      window.addEventListener("load", function () {
        videos.forEach(function (video) { video.dataset.inView = "true"; start(video); });
      }, { once: true });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        video.dataset.inView = entry.isIntersecting ? "true" : "false";
        if (entry.isIntersecting) start(video);
        else video.pause();
      });
    }, { rootMargin: "400px 0px" });
    videos.forEach(function (video) { observer.observe(video); });
  }

  function initHomeHero() {
    var hero = document.querySelector("[data-ll-home-hero]");
    if (!hero) return;

    var video = hero.querySelector("[data-ll-hero-video]");
    var videoToggle = hero.querySelector("[data-ll-hero-video-toggle]");
    var heroVisible = true;
    var heroObserver = null;
    function markHeroVideoReady() {
      hero.classList.add("is-video-ready");
    }

    if (video) {
      video.addEventListener("loadeddata", markHeroVideoReady);
      video.addEventListener("playing", markHeroVideoReady);
      if (video.readyState >= 2) {
        markHeroVideoReady();
      } else {
        // The poster is already a valid hero image: let the page text switch to its
        // on-image colours as soon as that image is available, not only once the film is.
        var posterUrl = video.getAttribute("poster");
        if (posterUrl) {
          var posterProbe = new Image();
          posterProbe.onload = markHeroVideoReady;
          posterProbe.onerror = function () {};
          posterProbe.src = posterUrl;
        } else {
          markHeroVideoReady();
        }
      }
    }

    var heroVideoSuppressed = function (userInitiated) {
      return document.body.classList.contains("ll-pitch-overlay-open") ||
        document.body.classList.contains("ll-showreel-open") ||
        (reduceMotion && !userInitiated) ||
        document.hidden ||
        !heroVisible ||
        (video && video.dataset.userPaused === "true");
    };

    function playHeroVideo(userInitiated) {
      if (!video || heroVideoSuppressed(userInitiated)) return;
      var attempt = video.play();
      if (!attempt || typeof attempt.catch !== "function") return;
      attempt.catch(function (error) {
        if (error && error.name === "AbortError") return;
        // Some browsers (Firefox with "Block Audio and Video" autoplay, for one) refuse
        // even muted autoplay until the visitor interacts. The poster stays on screen
        // meanwhile; start the film on the first click, key press or touch.
        if (error && error.name === "NotAllowedError") {
          retryOnFirstGesture(function () { playHeroVideo(); });
          return;
        }
        console.warn("The hero film could not be played.", error);
      });
    }

    function updateHeroState() {
      document.body.classList.toggle("is-past-home-hero", window.scrollY > hero.offsetHeight * (CONSTANTS.SCROLL?.HERO_PAST_THRESHOLD || 0.55));
      hero.style.setProperty("--ll-hero-scroll", "0");
      hero.style.setProperty("--ll-hero-line-scale", "1");
    }

    function requestHeroUpdate() {
      scheduleMotionFrame("home-hero", updateHeroState);
    }

    function syncVideoToggle() {
      if (!videoToggle || !video) return;
      var paused = video.paused;
      videoToggle.textContent = paused ? "Play film" : "Pause film";
      videoToggle.setAttribute("aria-label", paused ? "Play hero film" : "Pause hero film");
    }

    if (video && videoToggle) {
      videoToggle.addEventListener("click", function () {
        if (video.paused) {
          video.dataset.userPaused = "false";
          playHeroVideo(true);
        } else {
          video.dataset.userPaused = "true";
          video.pause();
        }
      });
      video.addEventListener("play", syncVideoToggle);
      video.addEventListener("pause", syncVideoToggle);
      syncVideoToggle();
    }

    updateHeroState();
    window.addEventListener("scroll", requestHeroUpdate, { passive: true });
    window.addEventListener("resize", requestHeroUpdate, { passive: true });

    if (!video) return;

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) video.pause();
      else playHeroVideo();
    });

    if ("IntersectionObserver" in window) {
      heroObserver = new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        if (heroVisible) playHeroVideo();
        else video.pause();
      });
      heroObserver.observe(hero);
    } else {
      playHeroVideo();
    }

    window.addEventListener("beforeunload", function () {
      if (heroObserver) heroObserver.disconnect();
    }, { once: true });
  }

  function ready() {
    initServiceLinkState();
    initSkillRowSelection();
    initHomeHero();
    initAboutVideos();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready, { once: true });
  } else {
    ready();
  }
})();
