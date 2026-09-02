(function () {
  "use strict";

  if (!document.body || !document.body.matches(".home-index, .case-study, .work-index, .ll-contact-page")) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function initClock() {
    var clocks = document.querySelectorAll("[data-ll-clock]");
    if (!clocks.length) return;

    var timer = 0;

    function tick() {
      var now = new Date();
      var value = pad(now.getHours()) + " : " + pad(now.getMinutes()) + " : " + pad(now.getSeconds());

      clocks.forEach(function (clock) {
        clock.textContent = value;
        clock.setAttribute("datetime", now.toISOString());
      });
    }

    function start() {
      if (timer || document.hidden) return;
      tick();
      timer = window.setInterval(tick, 1000);
    }

    function stop() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = 0;
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    start();
  }

  function initViewportState() {
    var header = document.querySelector("[data-ll-header]");
    var note = document.querySelector("[data-ll-nav-note]");
    var sections = Array.prototype.slice.call(document.querySelectorAll("[data-ll-section-note]"));
    if (!header && (!note || !sections.length)) return;

    var ticking = false;

    function updateNote() {
      if (!note || !sections.length) return;

      var active = sections[0];
      var threshold = window.innerHeight * 0.46;

      sections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= threshold) active = section;
      });

      var nextNote = active.getAttribute("data-ll-section-note");
      if (!nextNote || note.textContent === nextNote) return;

      note.textContent = nextNote;
      if (!reduceMotion && typeof note.animate === "function") {
        note.animate(
          [
            { opacity: 0, transform: "translate3d(0, 5px, 0)" },
            { opacity: 1, transform: "translate3d(0, 0, 0)" }
          ],
          { duration: 280, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
        );
      }
    }

    function update() {
      if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
      updateNote();
      ticking = false;
    }

    function requestUpdate() {
      if (window.LawaniMotion) {
        window.LawaniMotion.frame("viewport-state", update);
        return;
      }
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
  }

  function initMenu() {
    var toggle = document.querySelector("[data-ll-menu-toggle]");
    var menu = document.querySelector("[data-ll-mobile-menu]");
    var label = document.querySelector("[data-ll-menu-label]");
    var submenuToggle = document.querySelector("[data-ll-submenu-toggle]");
    var submenu = document.querySelector("[data-ll-submenu]");
    var menuReel = document.querySelector("[data-ll-menu-reel]");
    var menuReelVideo = document.querySelector("[data-ll-menu-reel-video]");
    var note = document.querySelector("[data-ll-nav-note]");
    var main = document.querySelector("main");
    var contactDock = document.querySelector(".ll-contact-dock");
    var lastFocused = null;
    var previousNote = "";
    if (!toggle || !menu) return;

    function setSubmenu(open) {
      if (!submenuToggle || !submenu) return;
      submenuToggle.setAttribute("aria-expanded", String(open));
      submenu.classList.toggle("is-open", open);
      submenu.setAttribute("aria-hidden", String(!open));
      submenu.inert = !open;
    }

    function setOpen(open, restoreFocus) {
      if (open) lastFocused = document.activeElement;
      document.body.classList.toggle("ll-menu-open", open);
      menu.classList.toggle("is-open", open);
      menu.setAttribute("aria-hidden", String(!open));
      menu.inert = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      if (label) label.textContent = open ? "Close" : "Menu";
      if (note) {
        if (open) {
          previousNote = note.textContent;
          note.textContent = "Cases with teeth";
        } else if (previousNote) {
          note.textContent = previousNote;
        }
      }
      if (main) main.inert = open;
      if (contactDock) contactDock.inert = open;
      if (!open) setSubmenu(false);

      if (menuReelVideo) {
        if (open && window.matchMedia("(min-width: 821px)").matches) {
          menuReelVideo.play().catch(function () {});
        } else {
          menuReelVideo.pause();
        }
      }

      if (!open && restoreFocus && lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true", false);
    });

    if (submenuToggle && submenu) {
      submenuToggle.addEventListener("click", function (event) {
        event.preventDefault();
        setSubmenu(submenuToggle.getAttribute("aria-expanded") !== "true");
      });
    }

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false, false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        event.preventDefault();
        setOpen(false, true);
        return;
      }

      if (event.key !== "Tab" || toggle.getAttribute("aria-expanded") !== "true") return;
      var focusable = Array.prototype.slice.call(
        menu.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      );
      if (menuReel && window.getComputedStyle(menuReel).display !== "none") focusable.push(menuReel);
      focusable = focusable.filter(function (item) {
        return !item.closest("[aria-hidden='true']");
      });
      if (!focusable.length) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener(
      "resize",
      function () {
        if (window.innerWidth > 820 && toggle.getAttribute("aria-expanded") === "true") {
          setOpen(false, false);
        }
      },
      { passive: true }
    );

    menu.inert = true;
    setSubmenu(false);
  }

  function initTheme() {
    var root = document.documentElement;
    var toggles = Array.prototype.slice.call(document.querySelectorAll("[data-ll-theme-toggle]"));
    var themeColor = document.querySelector('meta[name="theme-color"]');
    var preference = window.matchMedia("(prefers-color-scheme: dark)");
    var modes = ["light", "system", "dark"];

    toggles.forEach(function (toggle) {
      toggle.classList.remove("ll-button", "ll-button--compact");
      toggle.innerHTML =
        '<span class="ll-theme-toggle__choice ll-theme-toggle__choice--light" aria-hidden="true">LT</span>' +
        '<span class="ll-theme-toggle__choice ll-theme-toggle__choice--system" aria-hidden="true">SY</span>' +
        '<span class="ll-theme-toggle__choice ll-theme-toggle__choice--dark" aria-hidden="true">DK</span>' +
        '<span class="ll-theme-toggle__indicator" aria-hidden="true"></span>' +
        '<span class="ll-visually-hidden" data-ll-theme-label>Light</span>';
    });

    var labels = Array.prototype.slice.call(document.querySelectorAll("[data-ll-theme-label]"));

    function resolveTheme(mode) {
      return mode === "system" ? (preference.matches ? "dark" : "light") : mode;
    }

    function applyThemeMode(mode, persist) {
      if (modes.indexOf(mode) === -1) mode = "light";
      var resolvedTheme = resolveTheme(mode);
      var modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
      var nextMode = modes[(modes.indexOf(mode) + 1) % modes.length];
      var nextLabel = nextMode.charAt(0).toUpperCase() + nextMode.slice(1);

      root.setAttribute("data-theme-mode", mode);
      root.setAttribute("data-theme", resolvedTheme);
      toggles.forEach(function (toggle) {
        toggle.setAttribute("data-theme-mode", mode);
        toggle.removeAttribute("aria-pressed");
        toggle.setAttribute(
          "aria-label",
          "Theme: " + modeLabel + (mode === "system" ? " (" + resolvedTheme + ")" : "") + ". Switch to " + nextLabel + "."
        );
      });
      labels.forEach(function (label) {
        label.textContent = modeLabel + (mode === "system" ? " theme, currently " + resolvedTheme : " theme");
      });
      if (themeColor) themeColor.setAttribute("content", resolvedTheme === "light" ? "#e8e7e1" : "#181a19");

      if (!persist) return;
      try {
        localStorage.setItem("ll-theme-mode", mode);
      } catch (error) {}
    }

    var initialMode = root.getAttribute("data-theme-mode") || "light";
    applyThemeMode(initialMode, false);

    toggles.forEach(function (toggle) {
      toggle.addEventListener("click", function () {
        var currentMode = root.getAttribute("data-theme-mode") || "light";
        var nextMode = modes[(modes.indexOf(currentMode) + 1) % modes.length];

        root.classList.add("ll-theme-changing");
        applyThemeMode(nextMode, true);

        window.setTimeout(function () {
          root.classList.remove("ll-theme-changing");
        }, reduceMotion ? 0 : 420);
      });
    });

    if (typeof preference.addEventListener === "function") {
      preference.addEventListener("change", function () {
        if (root.getAttribute("data-theme-mode") !== "system") return;
        root.classList.add("ll-theme-changing");
        applyThemeMode("system", false);
        window.setTimeout(function () {
          root.classList.remove("ll-theme-changing");
        }, reduceMotion ? 0 : 420);
      });
    }

    window.addEventListener("storage", function (event) {
      if (event.key !== "ll-theme-mode") return;
      applyThemeMode(modes.indexOf(event.newValue) === -1 ? "light" : event.newValue, false);
    });
  }

  function initMotionReady() {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        document.body.classList.add("ll-ui-ready");
      });
    });
  }

  function initDockPreviews() {
    var docks = Array.prototype.slice.call(document.querySelectorAll(".ll-contact-dock"));
    if (!docks.length) return;

    function getPreview(toggle) {
      var id = toggle && toggle.getAttribute("aria-controls");
      return id ? document.getElementById(id) : null;
    }

    function setToggleOpen(dock, toggle, open) {
      var preview = getPreview(toggle);
      var state = toggle && toggle.querySelector("[data-ll-dock-state]");
      if (!toggle || !preview) return;

      if (open) {
        dock.querySelectorAll("[data-ll-dock-toggle]").forEach(function (otherToggle) {
          if (otherToggle !== toggle && otherToggle.getAttribute("aria-expanded") === "true") {
            setToggleOpen(dock, otherToggle, false);
          }
        });
      }

      toggle.setAttribute("aria-expanded", String(open));
      preview.setAttribute("aria-hidden", String(!open));
      preview.tabIndex = open ? 0 : -1;
      if (state) state.textContent = open ? "( − )" : "( + )";
      var group = toggle.closest("[data-ll-dock-group], .ll-contact-dock__studio");
      if (group) group.classList.toggle("is-preview-open", open);
      dock.classList.toggle("is-preview-open", !!dock.querySelector('[data-ll-dock-toggle][aria-expanded="true"]'));
    }

    function closeDock(dock) {
      dock.querySelectorAll("[data-ll-dock-toggle]").forEach(function (toggle) {
        setToggleOpen(dock, toggle, false);
      });
    }

    docks.forEach(function (dock) {
      dock.querySelectorAll("[data-ll-dock-toggle]").forEach(function (toggle) {
        toggle.addEventListener("click", function () {
          var open = toggle.getAttribute("aria-expanded") !== "true";
          setToggleOpen(dock, toggle, open);
        });
      });
    });

    document.addEventListener("pointerdown", function (event) {
      docks.forEach(function (dock) {
        if (!dock.classList.contains("is-preview-open") || dock.contains(event.target)) return;
        closeDock(dock);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      docks.forEach(function (dock) {
        if (!dock.classList.contains("is-preview-open")) return;
        var toggle = dock.querySelector('[data-ll-dock-toggle][aria-expanded="true"]');
        closeDock(dock);
        if (toggle) toggle.focus();
      });
    });
  }

  function initControlFeedback() {
    var selector = [
      ".ll-service-links a",
      ".ll-action-link",
      ".ll-footer__actions a",
      ".ll-services-contact-card",
      ".ll-theme-toggle",
      ".cs-back",
      ".cs-jump",
      ".cs-footer__actions a",
      ".cs-footer__contact-card",
      ".lwa-footer__contact .ll-button"
    ].join(",");
    var controls = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (!controls.length) return;

    controls.forEach(function (control) {
      control.classList.add("ll-tactile-control");

      function release() {
        control.classList.remove("is-pressed");
      }

      control.addEventListener("pointerdown", function () {
        control.classList.add("is-pressed");
      });
      control.addEventListener("pointerup", release);
      control.addEventListener("pointercancel", release);
      control.addEventListener("pointerleave", release);
    });

  }

  function initButtonScramble() {
    if (reduceMotion) return;

    var glyphs = "*?><[]&@#)(.%$-_:/;?!";
    var active = new WeakMap();

    function getTextTarget(control) {
      if (!control || control.classList.contains("ll-theme-toggle")) return null;

      var target = Array.prototype.slice.call(control.querySelectorAll("span")).find(function (span) {
        return (
          span.childElementCount === 0 &&
          span.textContent.trim() &&
          span.getAttribute("aria-hidden") !== "true" &&
          !span.classList.contains("ll-visually-hidden") &&
          !span.classList.contains("ll-contact-dock__state")
        );
      });

      if (!target && control.childElementCount === 0 && control.textContent.trim()) target = control;
      return target || null;
    }

    function restore(control) {
      var state = active.get(control);
      if (!state) return;
      window.cancelAnimationFrame(state.frame);
      state.target.textContent = state.text;
      state.target.removeAttribute("data-ll-scrambling");
      if (!state.hadLabel) control.removeAttribute("aria-label");
      active.delete(control);
    }

    function scramble(control) {
      var target = getTextTarget(control);
      if (!target) return;
      if (active.has(control)) restore(control);

      var text = target.textContent;
      var duration = 720;
      var started = 0;
      var state = {
        frame: 0,
        lastDraw: 0,
        hadLabel: control.hasAttribute("aria-label"),
        target: target,
        text: text
      };

      if (!state.hadLabel) control.setAttribute("aria-label", text.trim());
      target.setAttribute("data-ll-scrambling", "true");
      active.set(control, state);

      function draw(now) {
        if (!started) started = now;
        var progress = Math.min((now - started) / duration, 1);

        if (!state.lastDraw || now - state.lastDraw >= 34 || progress === 1) {
          state.lastDraw = now;
          var intensity = Math.sin(progress * Math.PI) * 0.38;
          state.target.textContent = text.split("").map(function (character) {
            if (/\s/.test(character) || progress === 1 || Math.random() > intensity) return character;
            return glyphs.charAt(Math.floor(Math.random() * glyphs.length));
          }).join("");
        }

        if (progress < 1) {
          state.frame = window.requestAnimationFrame(draw);
        } else {
          restore(control);
        }
      }

      state.frame = window.requestAnimationFrame(draw);
    }

    function getControl(event) {
      var control = event.target.closest(".ll-button, .ll-menu-row, .ll-footer__bottom nav a");
      return control && document.documentElement.contains(control) ? control : null;
    }

    document.addEventListener("pointerover", function (event) {
      var control = getControl(event);
      if (!control || (event.relatedTarget && control.contains(event.relatedTarget))) return;
      scramble(control);
    });

    document.addEventListener("focusin", function (event) {
      var control = getControl(event);
      if (control) scramble(control);
    });
  }

  function initReveals() {
    var revealGroups = [
      ".ll-services-columns",
      ".cs-related__head",
      ".cs-related-list",
      ".cs-footer__main",
      ".cs-footer__bottom"
    ];

    revealGroups.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (group) {
        Array.prototype.slice.call(group.children).forEach(function (node, index) {
          node.classList.add("ll-reveal");
          node.style.setProperty("--ll-reveal-delay", Math.min(index * 70, 280) + "ms");
        });
      });
    });

    document.querySelectorAll(".home-index .ll-footer .ll-reveal").forEach(function (node) {
      node.classList.add("is-visible");
    });

    var nodes = document.querySelectorAll(".ll-reveal");
    if (!nodes.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach(function (node) {
        node.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    );

    nodes.forEach(function (node) {
      observer.observe(node);
    });
  }

  function initHeroAtmosphere() {
    var hero = document.querySelector("[data-ll-home-hero]");
    if (!hero || reduceMotion) return;

    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      hero.addEventListener("pointermove", function (event) {
        var bounds = hero.getBoundingClientRect();
        var x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
        var y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));

        hero.style.setProperty("--ll-hero-x", ((x - 0.5) * -14).toFixed(2) + "px");
        hero.style.setProperty("--ll-hero-y", ((y - 0.5) * -9).toFixed(2) + "px");
        hero.style.setProperty("--ll-hero-glow-x", (x * 100).toFixed(1) + "%");
        hero.style.setProperty("--ll-hero-glow-y", (y * 100).toFixed(1) + "%");
      });

      hero.addEventListener("pointerleave", function () {
        hero.style.setProperty("--ll-hero-x", "0px");
        hero.style.setProperty("--ll-hero-y", "0px");
        hero.style.setProperty("--ll-hero-glow-x", "50%");
        hero.style.setProperty("--ll-hero-glow-y", "40%");
      });
    }

    var heroScrollTicking = false;

    function updateHeroScrollMotion() {
      var bounds = hero.getBoundingClientRect();
      var height = Math.max(1, bounds.height);
      var progress = Math.max(0, Math.min(1, -bounds.top / height));
      hero.style.setProperty("--ll-hero-scroll-y", (progress * -26).toFixed(2) + "px");
      hero.style.setProperty("--ll-hero-dot-scale", (1 + progress * 0.035).toFixed(4));
      heroScrollTicking = false;
    }

    function requestHeroScrollMotion() {
      if (window.LawaniMotion) {
        window.LawaniMotion.frame("hero-atmosphere", updateHeroScrollMotion);
        return;
      }
      if (heroScrollTicking) return;
      heroScrollTicking = true;
      window.requestAnimationFrame(updateHeroScrollMotion);
    }

    updateHeroScrollMotion();
    window.addEventListener("scroll", requestHeroScrollMotion, { passive: true });
    window.addEventListener("resize", requestHeroScrollMotion, { passive: true });
  }

  function initHeroShowreel() {
    var opener = document.querySelector("[data-ll-hero-open]");
    var modal = document.querySelector("[data-ll-hero-showreel]");
    var video = document.querySelector("[data-ll-hero-showreel-video]");
    if (!opener || !modal || !video) return;

    var closeButton = modal.querySelector("[data-ll-hero-close]");
    var playButton = modal.querySelector("[data-ll-hero-play]");
    var muteButton = modal.querySelector("[data-ll-hero-mute]");
    var seek = modal.querySelector("[data-ll-hero-seek]");
    var progress = modal.querySelector("[data-ll-hero-progress]");
    var current = modal.querySelector("[data-ll-hero-current]");
    var duration = modal.querySelector("[data-ll-hero-duration]");
    var backgroundVideo = opener.querySelector("[data-ll-hero-video]");
    var lastFocused = null;

    function formatTime(value) {
      if (!Number.isFinite(value)) return "0:00";
      var minutes = Math.floor(value / 60);
      var seconds = Math.floor(value % 60);
      return minutes + ":" + String(seconds).padStart(2, "0");
    }

    function sync() {
      var ratio = video.duration ? video.currentTime / video.duration : 0;
      if (seek) seek.value = String(Math.round(ratio * 1000));
      if (progress) progress.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
      if (current) current.textContent = formatTime(video.currentTime);
      if (duration) duration.textContent = formatTime(video.duration);
      if (playButton) playButton.textContent = video.paused ? "Play" : "Pause";
      if (muteButton) muteButton.textContent = video.muted ? "Unmute" : "Mute";
    }

    function open() {
      lastFocused = document.activeElement;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      modal.inert = false;
      document.body.classList.add("ll-showreel-open");
      if (backgroundVideo) backgroundVideo.pause();
      video.currentTime = 0;
      video.muted = false;
      video.play().catch(function () {
        video.muted = true;
        video.play().catch(function () {});
      });
      if (closeButton) closeButton.focus({ preventScroll: true });
      sync();
    }

    function close() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      modal.inert = true;
      document.body.classList.remove("ll-showreel-open");
      video.pause();
      if (backgroundVideo) backgroundVideo.play().catch(function () {});
      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus({ preventScroll: true });
    }

    opener.addEventListener("click", open);
    if (closeButton) closeButton.addEventListener("click", close);
    if (playButton) playButton.addEventListener("click", function () {
      if (video.paused) video.play().catch(function () {});
      else video.pause();
      sync();
    });
    if (muteButton) muteButton.addEventListener("click", function () {
      video.muted = !video.muted;
      sync();
    });
    video.addEventListener("click", function () {
      if (video.paused) video.play().catch(function () {});
      else video.pause();
      sync();
    });
    if (seek) seek.addEventListener("input", function () {
      if (video.duration) video.currentTime = (Number(seek.value) / 1000) * video.duration;
      sync();
    });
    video.addEventListener("timeupdate", sync);
    video.addEventListener("loadedmetadata", sync);
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    video.addEventListener("ended", sync);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal.classList.contains("is-open")) close();
      if (event.code === "Space" && modal.classList.contains("is-open") && document.activeElement !== seek) {
        event.preventDefault();
        if (video.paused) video.play().catch(function () {});
        else video.pause();
      }
    });
  }

  function ready() {
    initMotionReady();
    initTheme();
    initClock();
    initViewportState();
    initMenu();
    initDockPreviews();
    initControlFeedback();
    initButtonScramble();
    initReveals();
    initHeroAtmosphere();
    initHeroShowreel();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready, { once: true });
  } else {
    ready();
  }
})();
