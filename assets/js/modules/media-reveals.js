(function () {
  "use strict";

  var body = document.body;
  if (!body) return;

  var selector = [
    ".cs-gallery figure",
    ".cs-story__media",
    ".lwa-project__gallery figure",
    ".ll-manifesto__gallery figure",
    ".ll-manifesto__portrait"
  ].join(",");
  var targets = Array.prototype.slice.call(document.querySelectorAll(selector)).filter(function (target) {
    return target.querySelector("img, video");
  });

  if (!targets.length) return;

  targets.forEach(function (target) {
    target.classList.add("ll-media-reveal");
  });

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    targets.forEach(function (target) {
      target.classList.add("is-visible");
    });
    return;
  }

  body.classList.add("ll-media-reveals-ready");

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: "0px 0px 6% 0px",
    threshold: 0.01
  });

  targets.forEach(function (target) {
    observer.observe(target);
  });

  window.addEventListener("pagehide", function () {
    observer.disconnect();
  }, { once: true });
})();
