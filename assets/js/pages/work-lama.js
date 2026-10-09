(function () {
  "use strict";

  if (!document.body) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function scheduleMotionFrame(key, callback) {
    if (window.LawaniMotion && typeof window.LawaniMotion.frame === "function") {
      window.LawaniMotion.frame(key, callback);
      return;
    }
    window.requestAnimationFrame(callback);
  }

  function initHeroMotion() {
    var hero = document.querySelector(".lwa-hero");
    if (!hero) return;
    hero.classList.add("is-visible");
    if (reduceMotion) return;

    function render() {
      var bounds = hero.getBoundingClientRect();
      var progress = Math.max(0, Math.min(1, -bounds.top / Math.max(1, bounds.height * 0.72)));
      hero.style.setProperty("--lwa-hero-scroll", progress.toFixed(3));
    }
    function requestRender() {
      scheduleMotionFrame("work-hero", render);
    }

    render();
    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", requestRender, { passive: true });
  }

  function enableGalleryDrag(gallery) {
    var active = false;
    var moved = false;
    var startX = 0;
    var startScroll = 0;

    gallery.querySelectorAll("img").forEach(function (image) {
      image.draggable = false;
    });

    gallery.addEventListener("pointerdown", function (event) {
      // Touch and trackpad scrolling stay native; drag-to-scroll is for a mouse.
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      active = true;
      moved = false;
      startX = event.clientX;
      startScroll = gallery.scrollLeft;
      gallery.classList.add("is-dragging");
      if (event.pointerId != null && gallery.setPointerCapture) {
        try { gallery.setPointerCapture(event.pointerId); } catch (error) {}
      }
    });

    gallery.addEventListener("pointermove", function (event) {
      if (!active) return;
      var delta = event.clientX - startX;
      if (Math.abs(delta) > 4) moved = true;
      gallery.scrollLeft = startScroll - delta * 1.15;
      if (moved && event.cancelable) event.preventDefault();
    });

    function stop(event) {
      if (!active) return;
      active = false;
      gallery.classList.remove("is-dragging");
      if (event.pointerId != null && gallery.hasPointerCapture && gallery.hasPointerCapture(event.pointerId)) {
        gallery.releasePointerCapture(event.pointerId);
      }
    }

    gallery.addEventListener("pointerup", stop);
    gallery.addEventListener("pointercancel", stop);
    gallery.addEventListener("dragstart", function (event) { event.preventDefault(); });
  }

  function initGalleryProgress(gallery) {
    var slides = Array.prototype.slice.call(gallery.querySelectorAll("figure"));
    if (slides.length < 2) return;

    var progress = document.createElement("div");
    progress.className = "lwa-gallery-progress";
    progress.innerHTML =
      '<span class="lwa-gallery-progress__count" aria-hidden="true">' +
        '<span data-gallery-current>01</span><span class="lwa-gallery-progress__separator"> / </span>' +
        String(slides.length).padStart(2, "0") +
      '</span>' +
      '<span class="lwa-gallery-progress__track" role="progressbar" aria-label="Gallery position" aria-valuemin="1" aria-valuemax="' + slides.length + '" aria-valuenow="1" aria-valuetext="Image 1 of ' + slides.length + '">' +
        '<span data-gallery-fill></span>' +
      '</span>';
    gallery.insertAdjacentElement("afterend", progress);

    var current = progress.querySelector("[data-gallery-current]");
    var track = progress.querySelector(".lwa-gallery-progress__track");
    var fill = progress.querySelector("[data-gallery-fill]");
    var frame = 0;

    function showImage(index) {
      var imageNumber = index + 1;
      current.textContent = String(imageNumber).padStart(2, "0");
      track.setAttribute("aria-valuenow", String(imageNumber));
      track.setAttribute("aria-valuetext", "Image " + imageNumber + " of " + slides.length);
      fill.style.transform = "scaleX(" + (imageNumber / slides.length).toFixed(4) + ")";
    }

    function update() {
      frame = 0;
      if (gallery.scrollWidth > gallery.clientWidth + 2 &&
          gallery.scrollLeft + gallery.clientWidth >= gallery.scrollWidth - 2) {
        showImage(slides.length - 1);
        return;
      }

      var galleryLeft = gallery.getBoundingClientRect().left + gallery.clientLeft;
      var activeIndex = 0;
      var nearestDistance = Infinity;

      slides.forEach(function (slide, index) {
        var distance = Math.abs(slide.getBoundingClientRect().left - galleryLeft);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          activeIndex = index;
        }
      });

      showImage(activeIndex);
    }

    gallery.addEventListener("scroll", function () {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  function initProjects() {
    var projects = Array.prototype.slice.call(document.querySelectorAll("[data-work-item]"));
    if (!projects.length) return;
    var firstFeaturedProject = document.querySelector(".ll-work [data-work-item]");
    var scrollTimer = 0;
    if (firstFeaturedProject) firstFeaturedProject.classList.add("is-visible");

    function setExpanded(project, expanded, moveIntoView) {
      var toggle = project.querySelector("[data-work-toggle]");
      var detail = project.querySelector("[data-work-detail]");
      var state = project.querySelector("[data-work-state]");
      if (!toggle || !detail) return;

      if (scrollTimer) {
        window.clearTimeout(scrollTimer);
        scrollTimer = 0;
      }

      if (expanded) {
        projects.forEach(function (other) {
          if (other !== project && other.classList.contains("is-expanded")) setExpanded(other, false, false);
        });
      }

      project.classList.toggle("is-expanded", expanded);
      toggle.setAttribute("aria-expanded", String(expanded));
      detail.setAttribute("aria-hidden", String(!expanded));
      detail.inert = !expanded;
      if (state) state.textContent = expanded ? "( - )" : "( + )";

      if (expanded && moveIntoView) {
        scrollTimer = window.setTimeout(function () {
          scrollTimer = 0;
          if (!project.classList.contains("is-expanded")) return;
          var offset = window.innerWidth <= 820 ? 72 : 92;
          var top = project.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? "auto" : "smooth" });
        }, reduceMotion ? 0 : 160);
      }
    }

    projects.forEach(function (project, index) {
      var toggle = project.querySelector("[data-work-toggle]");
      var detail = project.querySelector("[data-work-detail]");
      var rail = project.querySelector(".lwa-project__rail");
      var railMoved = false;
      var railStartX = 0;

      project.style.setProperty("--lwa-index", index);
      if (detail) detail.inert = !project.classList.contains("is-expanded");

      if (rail) {
        rail.addEventListener("pointerdown", function (event) {
          railMoved = false;
          railStartX = event.clientX;
        });
        rail.addEventListener("pointermove", function (event) {
          if (Math.abs(event.clientX - railStartX) > 6) railMoved = true;
        });
      }

      if (toggle) {
        toggle.addEventListener("click", function (event) {
          if (railMoved) {
            event.preventDefault();
            railMoved = false;
            return;
          }
          setExpanded(project, !project.classList.contains("is-expanded"), true);
        });
      }

      var gallery = project.querySelector("[data-work-gallery]");
      if (gallery) {
        enableGalleryDrag(gallery);
        initGalleryProgress(gallery);
      }
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      projects.forEach(function (project) { project.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.06 });

    projects.forEach(function (project) { observer.observe(project); });
  }

  function initFilters() {
    var filter = document.querySelector("[data-work-filter]");
    var projects = Array.prototype.slice.call(document.querySelectorAll("[data-work-item]"));
    if (!filter || !projects.length) return;

    var buttons = Array.prototype.slice.call(filter.querySelectorAll("[data-filter]"));
    var count = filter.querySelector(".lwa-filter__count");

    function applyFilter(value) {
      var visible = 0;
      buttons.forEach(function (button) {
        var selected = button.getAttribute("data-filter") === value;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });

      projects.forEach(function (project) {
        var categories = (project.getAttribute("data-categories") || "").split(/\s+/);
        var matches = value === "all" || categories.indexOf(value) !== -1;
        project.hidden = !matches;
        if (!matches) {
          project.classList.remove("is-expanded");
          var toggle = project.querySelector("[data-work-toggle]");
          var detail = project.querySelector("[data-work-detail]");
          var state = project.querySelector("[data-work-state]");
          if (toggle) toggle.setAttribute("aria-expanded", "false");
          if (detail) {
            detail.setAttribute("aria-hidden", "true");
            detail.inert = true;
          }
          if (state) state.textContent = "( + )";
          return;
        }

        visible += 1;
        project.classList.add("is-visible");
        if (!reduceMotion && typeof project.animate === "function") {
          project.animate([
            { opacity: 0, transform: "translate3d(0, 18px, 0)" },
            { opacity: 1, transform: "translate3d(0, 0, 0)" }
          ], { duration: 520, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
        }
      });

      if (count) count.textContent = "[ " + String(visible).padStart(2, "0") + " ]";
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () { applyFilter(button.getAttribute("data-filter") || "all"); });
    });

    applyFilter("all");
  }

  function ready() {
    initHeroMotion();
    initProjects();
    initFilters();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, { once: true });
  else ready();
})();
