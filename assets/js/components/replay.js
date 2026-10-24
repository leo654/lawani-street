(function () {
  "use strict";

  if (!document.body || !document.body.classList.contains("case-study--tyol")) return;

  var stage = document.querySelector(".tyol-logo-stage");
  if (!stage) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches) {
    stage.disabled = true;
    stage.setAttribute("aria-label", "TYOL logo animation disabled by reduced motion preference");
    return;
  }

  var played = false;
  var restartTimer = 0;

  function play() {
    window.clearTimeout(restartTimer);
    stage.classList.remove("is-playing");
    stage.classList.add("is-armed");
    void stage.offsetWidth;
    stage.classList.add("is-playing");
  }

  var logo = stage.querySelector(".logo");
  if (logo) {
    logo.addEventListener("animationend", function (event) {
      if (event.animationName !== "tyol-paint") return;
      restartTimer = window.setTimeout(play, 1200);
    });
  }

  stage.addEventListener("click", play);

  if (!("IntersectionObserver" in window)) {
    play();
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    if (!entries[0].isIntersecting || played) return;
    played = true;
    play();
    observer.disconnect();
  }, { threshold: 0.5 });
  observer.observe(stage);
})();
