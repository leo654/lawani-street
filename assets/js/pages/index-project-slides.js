(function () {
  var section = document.querySelector("[data-home-project-slides]");

  if (!section) {
    return;
  }

  var slides = Array.prototype.slice.call(
    section.querySelectorAll("[data-project-slide]")
  );
  var controls = Array.prototype.slice.call(
    section.querySelectorAll("[data-project-slide-jump]")
  );
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var activeIndex = -1;
  var ticking = false;
  var scrollVideo = section.querySelector("video[data-scroll-video]");

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function setActive(index) {
    if (index === activeIndex) {
      return;
    }

    activeIndex = index;

    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle("is-active", slideIndex === index);
    });

    controls.forEach(function (control, controlIndex) {
      var isActive = controlIndex === index;
      control.classList.toggle("is-active", isActive);
      control.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function updateVideo(progress) {
    if (!scrollVideo) return;

    var duration = scrollVideo.duration || 1;
    scrollVideo.currentTime = progress * duration;

    // Smooth video transitions inspired by lamalama.com
    // Subtle scale effect based on scroll progress
    var scale = 1 + (progress * 0.05);
    var brightness = 0.95 + (progress * 0.05);

    scrollVideo.style.transform = "scale(" + scale + ")";
    scrollVideo.style.filter = "brightness(" + brightness + ")";
    scrollVideo.style.opacity = "1";
    scrollVideo.style.transition = "transform 0.3s ease-out, filter 0.3s ease-out, opacity 0.3s ease-out";
  }

  function update() {
    ticking = false;

    if (reducedMotion.matches) {
      section.style.setProperty("--project-slide-progress", "0");
      setActive(0);
      if (scrollVideo) {
        scrollVideo.currentTime = 0;
      }
      return;
    }

    var rect = section.getBoundingClientRect();
    var travel = Math.max(1, section.offsetHeight - window.innerHeight);
    var progress = clamp(-rect.top / travel, 0, 1);
    var index = Math.min(slides.length - 1, Math.floor(progress * slides.length));

    if (progress >= 0.995) {
      index = slides.length - 1;
    }

    section.style.setProperty("--project-slide-progress", progress.toFixed(4));
    setActive(index);
    updateVideo(progress);
  }

  function requestUpdate() {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(update);
  }

  function scrollToSlide(index) {
    var travel = Math.max(1, section.offsetHeight - window.innerHeight);
    var slideProgress = slides.length <= 1 ? 0 : (index + 0.12) / slides.length;
    var pageTop = section.getBoundingClientRect().top + window.scrollY;
    var target = pageTop + travel * clamp(slideProgress, 0, 1);

    window.scrollTo({
      top: target,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
  }

  controls.forEach(function (control, index) {
    control.addEventListener("click", function () {
      scrollToSlide(index);
    });
  });

  section.addEventListener(
    "pointermove",
    function (event) {
      var rect = section.getBoundingClientRect();
      var x = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
      var y = clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1);

      section.style.setProperty("--project-slide-x", x.toFixed(4));
      section.style.setProperty("--project-slide-y", y.toFixed(4));
    },
    { passive: true }
  );

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  reducedMotion.addEventListener("change", requestUpdate);

  setActive(0);
  requestUpdate();
})();
