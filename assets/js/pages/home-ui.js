(function () {
  "use strict";

  if (!document.body || !document.body.classList.contains("home-index")) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    if (!("IntersectionObserver" in window)) return;

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
      { threshold: [0.25, 0.5, 0.75], rootMargin: "-18% 0px -52% 0px" }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function initHomeHero() {
    var hero = document.querySelector("[data-ll-home-hero]");
    if (!hero) return;

    var video = hero.querySelector("[data-ll-hero-video]");
    var scrollTicking = false;

    function updateHeroState() {
      document.body.classList.toggle("is-past-home-hero", window.scrollY > hero.offsetHeight * 0.55);
      var progress = 0;

      if (!reduceMotion && window.innerWidth > 820) {
        progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, hero.offsetHeight)));
        hero.style.setProperty("--ll-hero-scroll", progress.toFixed(4));
      } else {
        hero.style.setProperty("--ll-hero-scroll", "0");
      }

      hero.style.setProperty("--ll-hero-line-scale", Math.max(0.18, 1 - progress * 0.82).toFixed(4));
      scrollTicking = false;
    }

    function requestHeroUpdate() {
      if (window.LawaniMotion) {
        window.LawaniMotion.frame("home-hero", updateHeroState);
        return;
      }
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(updateHeroState);
    }

    updateHeroState();
    window.addEventListener("scroll", requestHeroUpdate, { passive: true });
    window.addEventListener("resize", requestHeroUpdate, { passive: true });


    if (!video) return;

    if ("IntersectionObserver" in window) {
      var videoObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && !document.hidden && !document.body.classList.contains("ll-pitch-overlay-open")) video.play().catch(function () {});
            else video.pause();
          });
        },
        { threshold: 0.05 }
      );
      videoObserver.observe(hero);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) video.pause();
      else if (hero.getBoundingClientRect().bottom > 0 && !document.body.classList.contains("ll-pitch-overlay-open")) video.play().catch(function () {});
    });
  }

  function ready() {
    initServiceLinkState();
    initHomeHero();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready, { once: true });
  } else {
    ready();
  }
})();
