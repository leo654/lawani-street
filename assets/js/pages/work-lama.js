(function () {
  "use strict";

  if (!document.body) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initHeroMotion() {
    var hero = document.querySelector(".lwa-hero");
    if (!hero) return;
    hero.classList.add("is-visible");
    if (reduceMotion) return;

    var ticking = false;
    function render() {
      var bounds = hero.getBoundingClientRect();
      var progress = Math.max(0, Math.min(1, -bounds.top / Math.max(1, bounds.height * 0.72)));
      hero.style.setProperty("--lwa-hero-scroll", progress.toFixed(3));
      ticking = false;
    }
    function requestRender() {
      if (window.LawaniMotion) {
        window.LawaniMotion.frame("work-hero", render);
        return;
      }
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(render);
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
      if (event.pointerType === "mouse" && event.button !== 0) return;
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
    gallery.addEventListener("wheel", function (event) {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      gallery.scrollLeft += event.deltaY;
      event.preventDefault();
    }, { passive: false });
  }

  function initProjects() {
    var projects = Array.prototype.slice.call(document.querySelectorAll("[data-work-item]"));
    if (!projects.length) return;

    function setExpanded(project, expanded, moveIntoView) {
      var toggle = project.querySelector("[data-work-toggle]");
      var detail = project.querySelector("[data-work-detail]");
      var state = project.querySelector("[data-work-state]");
      if (!toggle || !detail) return;

      if (expanded) {
        projects.forEach(function (other) {
          if (other !== project && other.classList.contains("is-expanded")) setExpanded(other, false, false);
        });
      }

      project.classList.toggle("is-expanded", expanded);
      toggle.setAttribute("aria-expanded", String(expanded));
      detail.setAttribute("aria-hidden", String(!expanded));
      if (state) state.textContent = expanded ? "( - )" : "( + )";

      if (expanded && moveIntoView) {
        window.setTimeout(function () {
          var offset = window.innerWidth <= 820 ? 72 : 92;
          var top = project.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? "auto" : "smooth" });
        }, reduceMotion ? 0 : 160);
      }
    }

    projects.forEach(function (project, index) {
      var toggle = project.querySelector("[data-work-toggle]");
      var rail = project.querySelector(".lwa-project__rail");
      var railMoved = false;
      var railStartX = 0;

      project.style.setProperty("--lwa-index", index);

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
      if (gallery) enableGalleryDrag(gallery);
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
          if (detail) detail.setAttribute("aria-hidden", "true");
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
