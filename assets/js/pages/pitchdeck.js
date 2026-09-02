(function () {
  "use strict";

  function ready() {
    var deck = document.querySelector("[data-deck]");
    if (!deck) return;

    var menuButton = deck.querySelector("[data-deck-menu]");
    var menuLabel = deck.querySelector("[data-deck-menu-label]");
    var chapterNav = deck.querySelector(".ll-deck__chapters");
    var stage = deck.querySelector(".ll-deck__stage");
    var viewport = deck.querySelector(".ll-deck__slides");
    var closeButton = deck.querySelector(".ll-deck__close");
    var chapterButtons = Array.prototype.slice.call(deck.querySelectorAll("[data-deck-target]"));
    var slides = Array.prototype.slice.call(deck.querySelectorAll("[data-deck-slide]"));
    var currentLabels = Array.prototype.slice.call(deck.querySelectorAll("[data-deck-current]"));
    var totalLabels = Array.prototype.slice.call(deck.querySelectorAll("[data-deck-total]"));
    var previousButton = deck.querySelector("[data-deck-prev]");
    var nextButton = deck.querySelector("[data-deck-next]");
    var desktopRail = window.matchMedia("(min-width: 981px)");
    var horizontalDeck = window.matchMedia("(max-width: 760px)");
    var persistentMobileRail = window.matchMedia("(max-width: 760px)");
    var motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    var embedded = window.self !== window.top || new URLSearchParams(window.location.search).get("embedded") === "1";
    var overlayActive = !embedded;
    var activeIndex = 0;
    var navigationFrame = 0;
    var resizeFrame = 0;
    var wheelTotal = 0;
    var wheelTimer = 0;
    var previewTimer = 0;
    var navigationLocked = false;
    var closing = false;
    var touchStart = null;
    var contentAnimations = [];
    var clientMarquee = deck.querySelector(".ll-deck-client-marquee");
    var marqueeGroups = clientMarquee
      ? Array.prototype.slice.call(clientMarquee.querySelectorAll("ul"))
      : [];

    if (!menuButton || !menuLabel || !chapterNav || !stage || !viewport || !slides.length) return;

    function clamp(index) {
      return Math.max(0, Math.min(slides.length - 1, index));
    }

    function format(index) {
      return String(index + 1).padStart(2, "0");
    }

    function reducedMotion() {
      return motionPreference.matches;
    }

    function fillClientMarquee() {
      if (!clientMarquee || !marqueeGroups.length) return;

      var targetWidth = clientMarquee.clientWidth + 120;

      marqueeGroups.forEach(function (group) {
        Array.prototype.forEach.call(group.querySelectorAll("[data-marquee-clone]"), function (clone) {
          clone.remove();
        });

        var originals = Array.prototype.slice.call(group.children);
        var cloneIndex = 0;

        while (group.scrollWidth < targetWidth && originals.length && cloneIndex < 100) {
          var clone = originals[cloneIndex % originals.length].cloneNode(true);
          var image = clone.querySelector("img");
          clone.setAttribute("data-marquee-clone", "");
          if (image) image.alt = "";
          group.appendChild(clone);
          cloneIndex += 1;
        }
      });
    }

    function positionFor(slide) {
      return horizontalDeck.matches ? slide.offsetLeft : slide.offsetTop;
    }

    function currentPosition() {
      return horizontalDeck.matches ? viewport.scrollLeft : viewport.scrollTop;
    }

    function setPosition(position) {
      if (horizontalDeck.matches) viewport.scrollLeft = position;
      else viewport.scrollTop = position;
    }

    function setMenu(open, focusActive) {
      var shouldOpen = Boolean(open);
      var keepChaptersAvailable = persistentMobileRail.matches;
      deck.classList.toggle("is-rail-open", shouldOpen);
      menuButton.setAttribute("aria-expanded", String(shouldOpen));
      menuLabel.textContent = shouldOpen ? "Close chapters" : "Open chapters";
      chapterNav.setAttribute("aria-hidden", String(!shouldOpen && !keepChaptersAvailable));
      chapterNav.inert = !shouldOpen && !keepChaptersAvailable;

      if (shouldOpen && focusActive) {
        window.setTimeout(function () { chapterButtons[activeIndex].focus(); }, reducedMotion() ? 0 : 260);
      }
    }

    function stopContentAnimations() {
      contentAnimations.forEach(function (animation) {
        try { animation.cancel(); } catch (error) {}
      });
      contentAnimations = [];
    }

    function contentBlocks(slide) {
      return Array.prototype.slice.call(slide.querySelectorAll(".ll-deck-contact > *"));
    }

    function revealSlide(slide) {
      if (reducedMotion() || typeof slide.animate !== "function") return;
      stopContentAnimations();

      contentBlocks(slide).forEach(function (element, index) {
        var animation = element.animate([
          { opacity: 0, transform: "translate3d(0,12px,0)" },
          { opacity: 1, transform: "translate3d(0,0,0)" }
        ], {
          duration: 480,
          delay: Math.min(index * 55, 165),
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both"
        });
        animation.onfinish = function () {
          try { animation.cancel(); } catch (error) {}
        };
        contentAnimations.push(animation);
      });
    }

    function syncMedia() {
      slides.forEach(function (slide, index) {
        Array.prototype.forEach.call(slide.querySelectorAll("video"), function (video) {
          if (index === activeIndex && !closing && overlayActive && document.visibilityState !== "hidden") {
            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") playPromise.catch(function () {});
          } else {
            video.pause();
          }
        });
      });
    }

    function setActiveVisuals(index) {
      slides.forEach(function (slide, slideIndex) {
        var active = slideIndex === index;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
        slide.setAttribute("tabindex", "-1");
        slide.inert = !active;
      });

      chapterButtons.forEach(function (button, buttonIndex) {
        var active = buttonIndex === index;
        button.classList.toggle("is-active", active);
        if (active) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
      });

      if (persistentMobileRail.matches && chapterButtons[index]) {
        var activeChapter = chapterButtons[index];
        var chapterLeft = activeChapter.offsetLeft - ((chapterNav.clientWidth - activeChapter.offsetWidth) / 2);
        chapterNav.scrollTo({ left: Math.max(0, chapterLeft), behavior: reducedMotion() ? "auto" : "smooth" });
      }

      currentLabels.forEach(function (label) { label.textContent = format(index); });
      totalLabels.forEach(function (label) { label.textContent = String(slides.length).padStart(2, "0"); });
      if (previousButton) previousButton.disabled = index === 0;
      if (nextButton) nextButton.disabled = index === slides.length - 1;
      deck.classList.toggle("is-dark-chapter", slides[index].matches(".ll-deck-slide--welcome"));
    }

    function easeOutExpo(progress) {
      return progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    }

    function cancelNavigation() {
      if (navigationFrame) window.cancelAnimationFrame(navigationFrame);
      navigationFrame = 0;
      navigationLocked = false;
      deck.classList.remove("is-navigating");
    }

    function animateTo(index, focusSlide) {
      cancelNavigation();
      var start = currentPosition();
      var target = positionFor(slides[index]);
      var distance = target - start;

      if (reducedMotion() || Math.abs(distance) < 1) {
        setPosition(target);
        revealSlide(slides[index]);
        if (focusSlide) slides[index].focus({ preventScroll: true });
        return;
      }

      var startedAt = performance.now();
      var duration = horizontalDeck.matches ? 460 : 430;
      navigationLocked = true;
      deck.classList.add("is-navigating");

      function tick(now) {
        var progress = Math.min(1, (now - startedAt) / duration);
        setPosition(start + (distance * easeOutExpo(progress)));
        if (progress < 1) {
          navigationFrame = window.requestAnimationFrame(tick);
          return;
        }
        setPosition(target);
        navigationFrame = 0;
        navigationLocked = false;
        deck.classList.remove("is-navigating");
        revealSlide(slides[index]);
        if (focusSlide) slides[index].focus({ preventScroll: true });
      }

      navigationFrame = window.requestAnimationFrame(tick);
    }

    function goTo(nextIndex, options) {
      var settings = options || {};
      var index = clamp(nextIndex);
      if (index === activeIndex && !settings.force) return;

      activeIndex = index;
      setActiveVisuals(activeIndex);
      syncMedia();
      window.history.replaceState(null, "", "#" + slides[activeIndex].id);
      animateTo(activeIndex, Boolean(settings.focusSlide));
      if (settings.closeMenu && !desktopRail.matches) setMenu(false, false);
      if (activeIndex === slides.length - 1 && desktopRail.matches) setMenu(true, false);
    }

    function move(direction, focusSlide) {
      if (navigationLocked) return;
      var target = clamp(activeIndex + direction);
      if (target !== activeIndex) goTo(target, { focusSlide: Boolean(focusSlide) });
    }

    function enhanceControl(control) {
      function release() { control.classList.remove("is-pressed"); }
      control.addEventListener("pointerdown", function () { control.classList.add("is-pressed"); });
      control.addEventListener("pointerup", release);
      control.addEventListener("pointercancel", release);
      control.addEventListener("pointerleave", release);
    }

    function closeDeck(event) {
      if (event) event.preventDefault();
      if (closing) return;

      if (embedded) {
        window.parent.postMessage({ type: "lawani:pitchdeck-close" }, "*");
        return;
      }

      closing = true;
      cancelNavigation();
      stopContentAnimations();
      syncMedia();
      deck.classList.add("is-leaving");

      var destination = closeButton ? closeButton.href.split("#")[0] : "index.html";
      if (reducedMotion()) window.location.href = destination;
      else window.setTimeout(function () { window.location.href = destination; }, 620);
    }

    menuButton.addEventListener("click", function () {
      window.clearTimeout(previewTimer);
      setMenu(!deck.classList.contains("is-rail-open"), false);
    });

    menuButton.addEventListener("mouseenter", function () {
      if (!desktopRail.matches) return;
      window.clearTimeout(previewTimer);
      setMenu(true, false);
    });

    chapterNav.addEventListener("mouseleave", function () {
      if (desktopRail.matches) setMenu(false, false);
    });

    chapterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        window.clearTimeout(previewTimer);
        goTo(Number(button.getAttribute("data-deck-target")), { closeMenu: true });
      });
      enhanceControl(button);
    });

    deck.querySelectorAll(".ll-deck-contact a, .ll-deck__close, .ll-deck__mobile-controls button, .ll-deck__menu-toggle").forEach(enhanceControl);

    stage.addEventListener("pointerdown", function (event) {
      if (deck.classList.contains("is-rail-open") && !chapterNav.contains(event.target)) setMenu(false, false);
    });

    if (previousButton) previousButton.addEventListener("click", function () { move(-1); });
    if (nextButton) nextButton.addEventListener("click", function () { move(1); });
    if (closeButton) closeButton.addEventListener("click", closeDeck);

    if (embedded) {
      deck.addEventListener("click", function (event) {
        var link = event.target.closest && event.target.closest("a[href]");
        if (!link || link === closeButton || link.target === "_blank" || link.hasAttribute("download")) return;

        var raw = link.getAttribute("href");
        if (!raw || raw.charAt(0) === "#" || /^(?:mailto|tel|javascript):/i.test(raw)) return;

        var destination;
        try { destination = new URL(link.href, window.location.href); } catch (error) { return; }
        if (destination.origin !== window.location.origin) return;

        event.preventDefault();
        window.parent.postMessage({ type: "lawani:pitchdeck-navigate", href: destination.href }, "*");
      });
    }

    viewport.addEventListener("wheel", function (event) {
      if (horizontalDeck.matches || closing) return;
      event.preventDefault();
      if (navigationLocked) return;

      wheelTotal += event.deltaY;
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(function () { wheelTotal = 0; }, 180);
      if (Math.abs(wheelTotal) < 300) return;
      var direction = wheelTotal > 0 ? 1 : -1;
      wheelTotal = 0;
      move(direction);
    }, { passive: false });

    viewport.addEventListener("pointerdown", function (event) {
      if (!horizontalDeck.matches || event.pointerType === "mouse") return;
      touchStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
      viewport.setPointerCapture(event.pointerId);
    }, { passive: true });

    viewport.addEventListener("pointerup", function (event) {
      if (!touchStart || event.pointerId !== touchStart.id) return;
      var deltaX = event.clientX - touchStart.x;
      var deltaY = event.clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(deltaX) >= 40 && Math.abs(deltaX) > Math.abs(deltaY)) move(deltaX < 0 ? 1 : -1);
    }, { passive: true });

    viewport.addEventListener("pointercancel", function () { touchStart = null; });
    document.addEventListener("visibilitychange", syncMedia);

    document.addEventListener("keydown", function (event) {
      var tag = document.activeElement && document.activeElement.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        move(1, true);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        move(-1, true);
      } else if (event.key === "Home") {
        event.preventDefault();
        goTo(0, { focusSlide: true });
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(slides.length - 1, { focusSlide: true });
      } else if (event.key === "Escape") {
        if (deck.classList.contains("is-rail-open")) {
          setMenu(false, false);
          menuButton.focus();
        } else {
          closeDeck(event);
        }
      } else if (event.key.toLowerCase() === "m") {
        setMenu(!deck.classList.contains("is-rail-open"), true);
      }
    });

    window.addEventListener("resize", function () {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(function () {
        resizeFrame = 0;
        cancelNavigation();
        setMenu(false, false);
        fillClientMarquee();
        setPosition(positionFor(slides[activeIndex]));
      });
    }, { passive: true });

    window.addEventListener("hashchange", function () {
      var hashIndex = slides.findIndex(function (slide) { return window.location.hash === "#" + slide.id; });
      if (hashIndex >= 0 && hashIndex !== activeIndex) goTo(hashIndex, { focusSlide: true });
    });

    if (embedded) {
      window.addEventListener("message", function (event) {
        if (event.source !== window.parent || !event.data) return;
        if (event.origin !== window.location.origin && event.origin !== "null") return;

        if (event.data.type === "lawani:pitchdeck-activate") {
          overlayActive = true;
          closing = false;
          deck.classList.remove("is-leaving");
          syncMedia();
          revealSlide(slides[activeIndex]);
          slides[activeIndex].focus({ preventScroll: true });

          if (desktopRail.matches && !reducedMotion()) {
            window.clearTimeout(previewTimer);
            setMenu(true, false);
            previewTimer = window.setTimeout(function () { setMenu(false, false); }, 2500);
          }
        }

        if (event.data.type === "lawani:pitchdeck-deactivate") {
          overlayActive = false;
          window.clearTimeout(previewTimer);
          setMenu(false, false);
          stopContentAnimations();
          syncMedia();
        }
      });
    }

    var initialIndex = slides.findIndex(function (slide) { return window.location.hash === "#" + slide.id; });
    activeIndex = initialIndex >= 0 ? initialIndex : 0;
    setMenu(false, false);
    setActiveVisuals(activeIndex);
    fillClientMarquee();

    window.requestAnimationFrame(function () {
      setPosition(positionFor(slides[activeIndex]));
      document.body.classList.add("is-deck-ready");
      syncMedia();
      if (overlayActive) {
        revealSlide(slides[activeIndex]);
        slides[activeIndex].focus({ preventScroll: true });
      }
      if (embedded) window.parent.postMessage({ type: "lawani:pitchdeck-ready" }, "*");
      if (desktopRail.matches && !reducedMotion() && !embedded) {
        setMenu(true, false);
        previewTimer = window.setTimeout(function () { setMenu(false, false); }, 2500);
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, { once: true });
  else ready();
})();
