// Footer parallax shared by every page that carries the Home footer.
(function () {
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
          ease: "quint.out",
        }, 0.06);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFooterParallax, { once: true });
  } else {
    initFooterParallax();
  }
})();
