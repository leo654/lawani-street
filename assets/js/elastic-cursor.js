(function () {
  "use strict";

  function log() {}

  function initCursor() {
    try {
      var body = document.body;
      if (!body) {
        return;
      }
      if (
        !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }
      if (document.querySelector(".elastic-cursor")) {
        return;
      }

      var cursor = document.createElement("div");
      var dot = document.createElement("div");
      cursor.className = "elastic-cursor";
      dot.className = "elastic-cursor-dot";
      cursor.setAttribute("aria-hidden", "true");
      dot.setAttribute("aria-hidden", "true");

      body.appendChild(cursor);
      body.appendChild(dot);
      body.classList.add("has-elastic-cursor");

      var config = {
        spring: 0.24,
        drag: 0.64,
        follow: 0.22,
        dotFollow: 0.52,
        stretchRate: 0.03,
        maxStretch: 0.48,
        hoverScaleBoost: 0.18,
        angleEase: 0.14,
        stretchScale: 0.64,
        squeezeScale: 0.34,
        minScaleY: 0.68
      };

      var state = {
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.5,
        tx: window.innerWidth * 0.5,
        ty: window.innerHeight * 0.5,
        dotX: window.innerWidth * 0.5,
        dotY: window.innerHeight * 0.5,
        vx: 0,
        vy: 0,
        angle: 0,
        hover: false
      };

      cursor.style.transform =
        "translate3d(" + state.x + "px," + state.y + "px,0)";
      dot.style.transform =
        "translate3d(" + state.dotX + "px," + state.dotY + "px,0)";

      var interactiveSelector = [
        "a[href]",
        "button",
        ".btn",
        ".menu-toggle",
        ".navigation__link",
        "input:not([type='hidden'])",
        "textarea",
        "select",
        "summary",
        "[role='button']",
        "[data-cursor='interactive']"
      ].join(",");

      function getInteractiveTarget(node) {
        if (!node || typeof node.closest !== "function") return null;
        return node.closest(interactiveSelector);
      }

      function setHoverState(isHover) {
        state.hover = isHover;
        body.classList.toggle("cursor-hover", isHover);
      }

      function setTightState(isTight) {
        body.classList.toggle("cursor-tight", isTight);
      }

      function isTightTarget(target) {
        if (!target || typeof target.getAttribute !== "function") return false;
        return target.getAttribute("data-cursor") === "tight";
      }

      function isMenuTransitioning() {
        var root = document.documentElement;
        return (
          body.classList.contains("estrela-menu-animating") ||
          (root && root.classList.contains("estrela-menu-animating"))
        );
      }

      function resetCursorInteractionState() {
        body.classList.remove("cursor-hover", "cursor-tight");
        state.hover = false;
      }

      function onOut(e) {
        if (isMenuTransitioning()) return;
        var fromInteractive = getInteractiveTarget(e.target);
        if (!fromInteractive) return;

        var toInteractive = getInteractiveTarget(e.relatedTarget);
        if (toInteractive === fromInteractive || toInteractive) {
          setHoverState(true);
          setTightState(isTightTarget(toInteractive || fromInteractive));
          return;
        }

        setHoverState(false);
        setTightState(false);
      }

      function onLeaveWindow() {
        body.classList.remove("cursor-visible", "cursor-hover");
        cursor.style.opacity = "0";
        dot.style.opacity = "0";
        setHoverState(false);
        setTightState(false);
      }

      var frame = 0;
      var isAnimating = false;
      var lastMoveTime = 0;
      var suspended = false;

      function animate() {
        if (isMenuTransitioning()) {
          resetCursorInteractionState();
        }

        var tight = body.classList.contains("cursor-tight");
        var tightFactor = tight ? 0.18 : 1;
        var dx = state.tx - state.x;
        var dy = state.ty - state.y;

        state.vx = state.vx * config.drag + dx * config.spring;
        state.vy = state.vy * config.drag + dy * config.spring;

        state.x += dx * config.follow;
        state.y += dy * config.follow;

        state.dotX += (state.tx - state.dotX) * config.dotFollow;
        state.dotY += (state.ty - state.dotY) * config.dotFollow;

        var speed = Math.hypot(state.vx, state.vy);
        var stretch = Math.min(speed * config.stretchRate * tightFactor, config.maxStretch * tightFactor);
        var hoverBoost = state.hover ? config.hoverScaleBoost * (tight ? 0.35 : 1) : 0;
        var targetAngle = speed > 0.12 ? (Math.atan2(state.vy, state.vx) * 180) / Math.PI : state.angle;
        var angleDelta = ((targetAngle - state.angle + 540) % 360) - 180;
        state.angle += angleDelta * config.angleEase;
        var scaleBase = 1 + hoverBoost;
        var scaleX = scaleBase + stretch * config.stretchScale;
        var scaleY = Math.max(config.minScaleY, scaleBase - stretch * config.squeezeScale);

        cursor.style.transform =
          "translate3d(" + state.x + "px," + state.y + "px,0) rotate(" + state.angle.toFixed(2) + "deg) scale(" + scaleX.toFixed(3) + "," + scaleY.toFixed(3) + ")";
        dot.style.transform = "translate3d(" + state.dotX + "px," + state.dotY + "px,0)";

        // Stop loop if idle and not hovering
        var now = performance.now();
        if (now - lastMoveTime > 100 && !state.hover && speed < 0.01) {
          isAnimating = false;
          return;
        }

        frame = requestAnimationFrame(animate);
      }

      function startAnimation() {
        if (document.hidden || suspended) return;
        if (!isAnimating) {
          isAnimating = true;
          lastMoveTime = performance.now();
          frame = requestAnimationFrame(animate);
        } else {
          lastMoveTime = performance.now();
        }
      }

      function onMove(e) {
        if (suspended) return;
        state.tx = e.clientX;
        state.ty = e.clientY;
        body.classList.add("cursor-visible");
        cursor.style.opacity = "1";
        dot.style.opacity = "1";
        startAnimation();
      }

      function onOver(e) {
        if (suspended) return;
        if (isMenuTransitioning()) return;
        var interactive = getInteractiveTarget(e.target);
        if (!interactive) return;
        setHoverState(true);
        setTightState(isTightTarget(interactive));
        startAnimation();
      }

      document.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerover", onOver, true);
      document.addEventListener("pointerout", onOut, true);
      window.addEventListener("blur", onLeaveWindow);
      document.addEventListener("lawani:pitchdeck-open", function () {
        suspended = true;
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        isAnimating = false;
        onLeaveWindow();
      });
      document.addEventListener("lawani:pitchdeck-closed", function () {
        suspended = false;
      });
      document.addEventListener("visibilitychange", function () {
        if (!document.hidden) return;
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        isAnimating = false;
        onLeaveWindow();
      });

      window.addEventListener("beforeunload", function () {
        if (frame) cancelAnimationFrame(frame);
      });

      window.__elasticCursor = { cursor: cursor, dot: dot, state: state };
    } catch (err) {
      log("FATAL ERROR: " + (err && err.message ? err.message : String(err)));
    }
  }

  /* Run immediately if body exists, otherwise wait for DOM */
  if (document.body) {
    initCursor();
  } else {
    if (document.addEventListener) {
      document.addEventListener("DOMContentLoaded", initCursor, { once: true });
    } else {
      window.attachEvent && window.attachEvent("onload", initCursor);
    }
  }
})();
