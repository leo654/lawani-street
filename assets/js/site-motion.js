(function () {
  "use strict";

  var body = document.body;
  if (!body || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!body.matches(".ll-error-page, .cookie-privacy-page")) return;

  var gsap = window.gsap;
  if (!gsap) {
    console.warn("GSAP page motion is unavailable; content remains visible without animation.");
    return;
  }

  var container = body.matches(".ll-error-page")
    ? body.querySelector(".ll-error-page__content")
    : body.querySelector(".cookie-privacy-page__content");
  var targets = container ? Array.prototype.slice.call(container.children) : [];
  if (!targets.length) return;

  gsap.from(targets, {
    autoAlpha: 0,
    y: 16,
    duration: 0.76,
    stagger: 0.07,
    ease: "power3.out",
    clearProps: "opacity,visibility,transform"
  });
})();
