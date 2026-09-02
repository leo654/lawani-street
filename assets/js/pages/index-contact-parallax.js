/* Index contact video parallax */
(function () {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function toNumber(value, fallback) {
    var parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function init() {
    if (!document.body.classList.contains("home-index")) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var videos = Array.prototype.slice.call(
      document.querySelectorAll(".contact-video-parallax, .home-contact-fullscreen__video")
    );
    if (!videos.length) return;

    var targets = videos.map(function (video) {
      var container = video.closest("[data-parallax-strength]") || video.closest(".video-container") || video.parentElement;
      if (!container) return null;
      return {
        video: video,
        container: container,
        strength: toNumber(container.getAttribute("data-parallax-strength"), 64),
        scale: toNumber(video.getAttribute("data-parallax-scale"), 1.12)
      };
    }).filter(Boolean);

    if (!targets.length) return;

    var ticking = false;

    function update() {
      ticking = false;
      var vh = window.innerHeight || document.documentElement.clientHeight || 0;
      if (!vh) return;

      targets.forEach(function (item) {
        var rect = item.container.getBoundingClientRect();
        var center = rect.top + (rect.height * 0.5);
        var ratio = clamp((center - (vh * 0.5)) / vh, -1, 1);
        var offset = (-ratio * item.strength).toFixed(2);
        item.video.style.transform = "translate3d(0," + offset + "px,0) scale(" + item.scale.toFixed(3) + ")";
      });
    }

    function requestTick() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", requestTick);
    window.addEventListener("orientationchange", requestTick);
    window.addEventListener("load", requestTick);

    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
