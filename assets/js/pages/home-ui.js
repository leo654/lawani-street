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

  function initHomeHero() {
    var hero = document.querySelector("[data-ll-home-hero]");
    if (!hero) return;

    var video = hero.querySelector("[data-ll-hero-video]");
    var videoToggle = hero.querySelector("[data-ll-hero-video-toggle]");
    var heroVisible = true;
    var heroObserver = null;
    function markHeroVideoReady() {
      if (video && video.readyState >= 2) hero.classList.add("is-video-ready");
    }

    if (video) {
      video.addEventListener("loadeddata", markHeroVideoReady);
      video.addEventListener("playing", markHeroVideoReady);
      markHeroVideoReady();
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
      video.play().catch(function (error) {
        if (error.name === "AbortError") return;
        console.warn("The hero film could not be played.", error);

        // Fallback: show poster image if video fails
        var poster = video.getAttribute("poster");
        if (poster && !video.dataset.fallbackShown) {
          video.dataset.fallbackShown = "true";
          video.style.display = "none";
          var fallbackImg = document.createElement("img");
          fallbackImg.src = poster;
          fallbackImg.alt = "Hero image";
          fallbackImg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;";
          video.parentNode.insertBefore(fallbackImg, video);
        }
      });
    }

    function updateHeroState() {
      document.body.classList.toggle("is-past-home-hero", window.scrollY > hero.offsetHeight * (CONSTANTS.SCROLL?.HERO_PAST_THRESHOLD || 0.55));
      var progress = 0;

      if (!reduceMotion && window.innerWidth > (CONSTANTS.BREAKPOINT?.HERO_EFFECT || 820)) {
        progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, hero.offsetHeight)));
        hero.style.setProperty("--ll-hero-scroll", progress.toFixed(4));
      } else {
        hero.style.setProperty("--ll-hero-scroll", "0");
      }

      hero.style.setProperty("--ll-hero-line-scale", Math.max(CONSTANTS.SCROLL?.HERO_LINE_SCALE_MIN || 0.18, 1 - progress * (CONSTANTS.SCROLL?.HERO_LINE_SCALE_MAX || 0.82)).toFixed(4));
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

  function initFooterParallax() {
    var footer = document.querySelector(".ll-footer");
    var marquee = footer && footer.querySelector(".ll-footer__marquee");
    if (!footer || !marquee || reduceMotion) return;

    var footerCopy = Array.prototype.slice.call(footer.querySelectorAll(
      ".ll-footer__studio, .ll-footer__project-cta, .ll-footer__year"
    ));

    Promise.resolve(Boolean(window.gsap && window.ScrollTrigger)).then(function (loaded) {
      if (!loaded || !window.gsap || !window.ScrollTrigger) {
        console.warn("GSAP footer animation is unavailable; the footer remains static.");
        return;
      }

      window.gsap.registerPlugin(window.ScrollTrigger);
      var timeline = window.gsap.timeline({
        scrollTrigger: {
          trigger: footer,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            window.__lawaniFooterScrollProgress = self.progress;
          }
        }
      });

      function getParallaxTravel() {
        return Math.min(Math.round(marquee.clientHeight * 0.18), 170);
      }

      timeline.fromTo(marquee, {
        "--ll-footer-parallax-y": function () { return getParallaxTravel() + "px"; }
      }, {
        "--ll-footer-parallax-y": function () { return -getParallaxTravel() + "px"; },
        ease: "none",
        duration: 1
      }, 0);

      if (footerCopy.length) {
        window.gsap.set(footerCopy, { autoAlpha: 0, y: 28 });
        timeline.to(footerCopy, {
          autoAlpha: 1,
          y: 0,
          duration: 0.22,
          stagger: 0.07,
          ease: "power2.out",
        }, 0.06);
      }
    });
  }

  function ready() {
    initServiceLinkState();
    initSkillRowSelection();
    initHomeHero();
    initFooterParallax();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready, { once: true });
  } else {
    ready();
  }
})();
