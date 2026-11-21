(function () {
  "use strict";

  if (!document.body) return;

  function reduceMotion() {
    return (window.LawaniMotion && window.LawaniMotion.reduced()) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function scheduleMotionFrame(key, callback) {
    if (window.LawaniMotion && typeof window.LawaniMotion.scheduleFrame === "function") {
      window.LawaniMotion.scheduleFrame(key, callback);
      return;
    }
    window.requestAnimationFrame(callback);
  }

  function initHeroMotion() {
    var hero = document.querySelector(".lwa-hero");
    if (!hero) return;
    hero.classList.add("is-visible");
    // The motion kit drives the hero title on scroll; skip the old per-frame read.
    if (reduceMotion() || (window.MotionKit && window.MotionKit.active)) return;

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

    // The motion kit owns mouse dragging (eased follow + inertia). Two handlers writing
    // scrollLeft on the same gallery fought each other, so this one is only a fallback.
    if (gallery.classList.contains("mk-draggable")) return;

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
    var observer = null;
    if (firstFeaturedProject) firstFeaturedProject.classList.add("is-visible");

    var gsap = window.gsap;
    var ScrollTrigger = window.ScrollTrigger;
    var gsapReveals = false;
    if (!document.body.classList.contains("home-index") && !reduceMotion() && gsap && ScrollTrigger) {
      document.body.classList.add("lwa-projects-gsap-ready");
      projects.forEach(function (project) {
        if (project === firstFeaturedProject || project.hidden) return;
        gsap.fromTo(project, {
          autoAlpha: 0,
          y: 14
        }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.75,
          ease: "expo.out",
          overwrite: "auto",
          onComplete: function () { project.classList.add("is-visible"); },
          scrollTrigger: {
            trigger: project,
            start: "top 88%",
            once: true
          }
        });
      });
      ScrollTrigger.refresh();
      // Keep going: the row toggles, galleries and filters below must still be wired up.
      gsapReveals = true;
    }

    function scrollOffset() {
      var dock = document.querySelector(".ll-floating-header .ll-nav-dock, .ll-floating-header .ll-contact-dock");
      var dockBottom = dock ? dock.getBoundingClientRect().bottom : 0;
      return Math.max(24, Math.ceil(dockBottom + 16));
    }

    function scrollProjectIntoView(project) {
      var offset = scrollOffset();
      if (project.getBoundingClientRect().top >= offset) return;
      if (window.LawaniMotion && typeof window.LawaniMotion.scrollTo === "function") {
        window.LawaniMotion.scrollTo(project, { offset: -offset });
        return;
      }
      var top = project.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion() ? "auto" : "smooth" });
    }

    function transitionWait() {
      var detail = document.querySelector(".lwa-project__detail");
      if (!detail) return 0;

      return getComputedStyle(detail).transitionDuration.split(",").reduce(function (longest, value) {
        var duration = parseFloat(value);
        if (!Number.isFinite(duration)) return longest;
        return Math.max(longest, value.trim().endsWith("ms") ? duration : duration * 1000);
      }, 0);
    }

    function setExpanded(project, expanded, moveIntoView) {
      var toggle = project.querySelector("[data-work-toggle]");
      var detail = project.querySelector("[data-work-detail]");
      var state = project.querySelector("[data-work-state]");
      if (!toggle || !detail) return;

      if (scrollTimer) {
        window.clearTimeout(scrollTimer);
        scrollTimer = 0;
      }

      var projectIndex = projects.indexOf(project);
      var hasExpandedProjectAbove = expanded && projects.some(function (other, index) {
        return index < projectIndex && other.classList.contains("is-expanded");
      });

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

      // Rows below move when a row opens or closes, so their scroll-reveal start points need a refresh.
      if (gsapReveals) window.setTimeout(function () { ScrollTrigger.refresh(); }, transitionWait() + 80);

      if (expanded && moveIntoView) {
        var delay = hasExpandedProjectAbove && !reduceMotion() ? transitionWait() : 0;
        scrollTimer = window.setTimeout(function () {
          scrollTimer = 0;
          if (!project.classList.contains("is-expanded")) return;
          window.requestAnimationFrame(function () {
            if (project.classList.contains("is-expanded")) scrollProjectIntoView(project);
          });
        }, delay);
      }
    }

    projects.forEach(function (project, index) {
      var toggle = project.querySelector("[data-work-toggle]");
      var detail = project.querySelector("[data-work-detail]");
      var rail = project.querySelector(".lwa-project__rail");
      var railMoved = false;
      var railStartX = 0;

      project.style.setProperty("--lwa-index", index);
      if (toggle && !toggle.hasAttribute("data-cursor")) toggle.setAttribute("data-cursor", "next");
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

    // GSAP already reveals the rows on this page; the observer below is for the home page and reduced motion.
    if (gsapReveals) return;

    if (reduceMotion() || !("IntersectionObserver" in window)) {
      projects.forEach(function (project) { project.classList.add("is-visible"); });
      return;
    }

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.06 });

    projects.forEach(function (project) { observer.observe(project); });

    window.addEventListener("beforeunload", function () {
      if (observer) observer.disconnect();
    }, { once: true });
  }

  function initListHoverMotion() {
    var root = document.querySelector(".lwa-archive");
    if (!root || !window.matchMedia("(hover: hover) and (pointer: fine)").matches || reduceMotion()) return;

    var preview = document.createElement("div");
    preview.className = "lwa-hover-preview";
    preview.setAttribute("aria-hidden", "true");
    preview.innerHTML = '<img alt=""><span>View project</span>';
    document.body.appendChild(preview);
    var previewImage = preview.querySelector("img");
    var activeProject = null;
    var pendingX = 0;
    var pendingY = 0;
    var currentX = 0;
    var currentY = 0;
    var placed = false;
    var lastTime = 0;
    var frame = 0;
    var width = 280;
    var height = 190;

    function measurePreview() {
      width = preview.offsetWidth || 280;
      height = preview.offsetHeight || 190;
    }
    window.addEventListener("resize", measurePreview, { passive: true });

    function clearActivePreview() {
      if (activeProject) activeProject.classList.remove("is-hovered");
      activeProject = null;
      placed = false; // the next row starts at the pointer instead of flying in from the last spot
      preview.classList.remove("is-active");
    }

    // The preview eases toward the pointer (time-based, ~70ms) instead of being glued to it;
    // size is measured once, not every frame, so nothing forces layout while it moves.
    function movePreview(now) {
      frame = 0;
      var dt = Math.min(Math.max(now - lastTime, 0), 50) / 1000;
      lastTime = now;
      var targetX = Math.max(18, Math.min(window.innerWidth - width - 18, pendingX + 30));
      var targetY = Math.max(18, Math.min(window.innerHeight - height - 18, pendingY - height * 0.5));
      if (!placed) {
        currentX = targetX;
        currentY = targetY;
        placed = true;
      } else {
        var ease = 1 - Math.exp(-dt * 14);
        currentX += (targetX - currentX) * ease;
        currentY += (targetY - currentY) * ease;
      }
      preview.style.transform = "translate3d(" + currentX.toFixed(2) + "px," + currentY.toFixed(2) + "px,0)";
      if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
        frame = window.requestAnimationFrame(movePreview);
      }
    }

    function positionPreview(event) {
      pendingX = event.clientX;
      pendingY = event.clientY;
      if (!frame) {
        lastTime = performance.now();
        frame = window.requestAnimationFrame(movePreview);
      }
    }

    root.addEventListener("pointerover", function (event) {
      var project = event.target.closest("[data-work-item]");
      if (!project || !root.contains(project)) return;
      if (project.classList.contains("is-expanded")) {
        clearActivePreview();
        return;
      }
      if (activeProject !== project) {
        var image = project.querySelector(".lwa-project__rail img");
        if (!image) return;
        activeProject = project;
        previewImage.src = image.currentSrc || image.src;
        measurePreview();
        preview.classList.add("is-active");
        project.classList.add("is-hovered");
      }
      if (event.clientX != null) positionPreview(event);
    });

    root.addEventListener("pointermove", function (event) {
      if (activeProject) positionPreview(event);
    }, { passive: true });

    root.addEventListener("pointerout", function (event) {
      if (!activeProject || activeProject.contains(event.relatedTarget)) return;
      clearActivePreview();
    });

    root.addEventListener("click", function (event) {
      var project = event.target.closest("[data-work-item]");
      if (project && project.classList.contains("is-expanded")) clearActivePreview();
    });

    // Scrolling moves rows under a still pointer without firing pointer events, so re-check what is
    // under the pointer: hide the preview once it is off the list, or swap it to the row now underneath.
    var scrollCheck = 0;
    function recheckUnderPointer() {
      scrollCheck = 0;
      if (!activeProject) return;
      var under = document.elementFromPoint(pendingX, pendingY);
      var project = under && under.closest ? under.closest("[data-work-item]") : null;
      if (!project || !root.contains(project) || project.classList.contains("is-expanded")) {
        clearActivePreview();
        return;
      }
      if (project !== activeProject) {
        var image = project.querySelector(".lwa-project__rail img");
        if (!image) {
          clearActivePreview();
          return;
        }
        activeProject.classList.remove("is-hovered");
        activeProject = project;
        previewImage.src = image.currentSrc || image.src;
        project.classList.add("is-hovered");
      }
    }
    window.addEventListener("scroll", function () {
      if (activeProject && !scrollCheck) scrollCheck = window.requestAnimationFrame(recheckUnderPointer);
    }, { passive: true });
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
        var wasHidden = project.hidden;
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
        if (wasHidden && !reduceMotion() && typeof project.animate === "function") {
          var timing = window.LawaniConstants || {};
          var duration = (timing.DURATION && timing.DURATION.COMPONENT) || 420;
          var easing = (timing.EASING && timing.EASING.OUT) || "cubic-bezier(0.16, 1, 0.3, 1)";
          project.animate([
            { opacity: 0, transform: "translate3d(0, 14px, 0)" },
            { opacity: 1, transform: "translate3d(0, 0, 0)" }
          ], { duration: duration, easing: easing });
        }
      });

      if (count) count.textContent = "[ " + String(visible).padStart(2, "0") + " ]";
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () { applyFilter(button.getAttribute("data-filter") || "all"); });
    });

    applyFilter("all");

    // The filter pill is fixed to the bottom of the screen. Fade it out as the footer arrives so it
    // never sits on top of the footer's social and legal links at the very end of the page.
    var footer = document.querySelector("footer.cs-footer, .lwa-footer");
    if (footer && "IntersectionObserver" in window) {
      var dockObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { filter.classList.toggle("is-docked", entry.isIntersecting); });
      }, { rootMargin: "0px 0px -72px 0px", threshold: 0 });
      dockObserver.observe(footer);
    }
  }

  function ready() {
    initHeroMotion();
    initProjects();
    initListHoverMotion();
    initFilters();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, { once: true });
  else ready();
})();
