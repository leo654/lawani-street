(function () {
  "use strict";

  var loader = document.querySelector("[data-home-loader]");
  if (!loader) return;
  if (!document.documentElement.classList.contains("home-preloader-active")) {
    loader.remove();
    return;
  }

  var counter = loader.querySelector(".home-page-loader__counter");
  var count = loader.querySelector(".home-page-loader__count");
  var startedAt = performance.now();
  var minimumDuration = 650;
  var logoHoldDuration = 520;
  var exitDuration = 560;
  var finished = false;
  var pageLoaded = document.readyState === "complete";

  function reveal() {
    document.documentElement.classList.remove("home-preloader-active");
    loader.remove();
  }

  function finish() {
    if (finished) return;
    finished = true;
    var heroVideo = document.querySelector("[data-ll-hero-video]");
    if (heroVideo) {
      heroVideo.preload = "auto";
      heroVideo.play().catch(function (error) {
        if (error.name !== "AbortError") console.warn("The hero film could not be played.", error);
      });
    }
    if (counter) counter.textContent = "100%";
    if (count) count.textContent = "100 / 100";
    loader.style.setProperty("--home-loader-progress", "1");
    loader.classList.add("is-mark-visible");

    window.setTimeout(function () {
      loader.classList.add("is-exiting");
    }, logoHoldDuration);
    window.setTimeout(reveal, logoHoldDuration + exitDuration + 40);
  }

  function update(now) {
    if (finished) return;
    var elapsed = now - startedAt;
    var progress = Math.min(0.92, 1 - Math.exp(-elapsed / 420));
    var value = Math.min(92, Math.floor(progress * 100));

    if (counter) counter.textContent = String(value).padStart(2, "0") + "%";
    if (count) count.textContent = String(value).padStart(2, "0") + " / 100";
    loader.style.setProperty("--home-loader-progress", String(progress));

    if (pageLoaded && elapsed >= minimumDuration) {
      finish();
      return;
    }
    window.setTimeout(function () {
      update(performance.now());
    }, 50);
  }

  window.addEventListener("load", function () {
    pageLoaded = true;
  }, { once: true });
  window.setTimeout(function () {
    pageLoaded = true;
  }, 1400);
  window.setTimeout(function () {
    update(performance.now());
  }, 0);
})();
