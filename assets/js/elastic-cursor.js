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
        window.matchMedia("(max-width: 560px)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }
      if (document.querySelector(".elastic-cursor")) {
        return;
      }

      var cursor = document.createElement("div");
      var dot = document.createElement("div");
      var icon = document.createElement("span");
      cursor.className = "elastic-cursor";
      dot.className = "elastic-cursor-dot";
      icon.className = "elastic-cursor-icon";
      icon.setAttribute("aria-hidden", "true");
      cursor.setAttribute("aria-hidden", "true");
      dot.setAttribute("aria-hidden", "true");

      body.appendChild(cursor);
      body.appendChild(dot);
      body.appendChild(icon);
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
        hover: false,
        activeTarget: null
      };

      var gsapMotion = null;
      var webglCursor = null;
      var lastPointerX = state.tx;
      var lastPointerY = state.ty;
      var lastPointerTime = performance.now();
      var pointerSpeed = 0;

      var cursorIcons = {
        click: '<circle cx="12" cy="12" r="6"/>',
        dot: '<circle cx="12" cy="12" r="2"/>',
        play: '<path d="M8 5.5v13L19 12 8 5.5z"/>',
        pause: '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>',
        next: '<path d="M4 10h10.2L9.5 5.3 12.3 2.5 22 12l-9.7 9.5-2.8-2.8 4.7-4.7H4z"/>',
        previous: '<path d="M20 10H9.8l4.7-4.7-2.8-2.8L2 12l9.7 9.5 2.8-2.8-4.7-4.7H20z"/>',
        "sound-on": '<path d="M4 10v4h4l5 4V6l-5 4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
        "sound-off": '<path d="M4 10v4h4l5 4V6l-5 4H4z"/><path d="m17 9 5 6m0-6-5 6"/>',
        sun: '<circle cx="12" cy="12" r="5"/><path d="M11 1h2v4h-2zM11 19h2v4h-2zM1 11h4v2H1zM19 11h4v2h-4zM3.5 4.9 4.9 3.5l2.8 2.8-1.4 1.4zM16.3 17.7l1.4-1.4 2.8 2.8-1.4 1.4zM16.3 6.3l2.8-2.8 1.4 1.4-2.8 2.8zM3.5 19.1l2.8-2.8 1.4 1.4-2.8 2.8z"/>',
        moon: '<path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2z"/>'
      };

      function updateGsapShape() {
        if (!gsapMotion) return;
        var hoverBoost = state.hover ? 0.08 : 0;
        var stretch = Math.min(pointerSpeed * 0.035, config.maxStretch);
        gsapMotion.scaleX(1 + hoverBoost + stretch * config.stretchScale);
        gsapMotion.scaleY(Math.max(config.minScaleY, 1 + hoverBoost - stretch * config.squeezeScale));
      }

      function updateGsapPosition(x, y, now) {
        if (!gsapMotion) return;
        var elapsed = Math.max(12, now - lastPointerTime);
        var dx = x - lastPointerX;
        var dy = y - lastPointerY;
        pointerSpeed = Math.min(Math.hypot(dx, dy) / elapsed, 12);
        var targetAngle = pointerSpeed > 0.08 ? (Math.atan2(dy, dx) * 180) / Math.PI : state.angle;
        var angleDelta = ((targetAngle - state.angle + 540) % 360) - 180;
        state.angle += angleDelta * 0.42;

        gsapMotion.cursorX(x);
        gsapMotion.cursorY(y);
        gsapMotion.iconX(x);
        gsapMotion.iconY(y);
        gsapMotion.dotX(x);
        gsapMotion.dotY(y);
        gsapMotion.rotation(state.angle);
        updateGsapShape();

        lastPointerX = x;
        lastPointerY = y;
        lastPointerTime = now;
      }

      function initializeGsapCursor(gsap) {
        if (gsapMotion || !gsap || typeof gsap.quickTo !== "function") return;
        gsap.set(cursor, { x: state.x, y: state.y, rotation: state.angle, scaleX: 1, scaleY: 1, force3D: true });
        gsap.set(dot, { x: state.dotX, y: state.dotY, force3D: true });
        gsap.set(icon, { x: state.x, y: state.y, force3D: true });

        gsapMotion = {
          cursorX: gsap.quickTo(cursor, "x", { duration: 0.42, ease: "power3.out" }),
          cursorY: gsap.quickTo(cursor, "y", { duration: 0.42, ease: "power3.out" }),
          iconX: gsap.quickTo(icon, "x", { duration: 0.42, ease: "power3.out" }),
          iconY: gsap.quickTo(icon, "y", { duration: 0.42, ease: "power3.out" }),
          dotX: gsap.quickTo(dot, "x", { duration: 0.16, ease: "power2.out" }),
          dotY: gsap.quickTo(dot, "y", { duration: 0.16, ease: "power2.out" }),
          rotation: gsap.quickTo(cursor, "rotation", { duration: 0.28, ease: "power2.out" }),
          scaleX: gsap.quickTo(cursor, "scaleX", { duration: 0.2, ease: "power2.out" }),
          scaleY: gsap.quickTo(cursor, "scaleY", { duration: 0.2, ease: "power2.out" })
        };

        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        isAnimating = false;
        updateGsapPosition(state.tx, state.ty, performance.now());
      }

      function loadGsapCursor() {
        if (window.gsap) {
          initializeGsapCursor(window.gsap);
          return;
        }

        var script = document.querySelector("script[data-elastic-cursor-gsap]");
        if (!script) {
          script = document.createElement("script");
          script.src = "assets/js/libs/gsap.min.js?v=20261001-cursor-webgl-1";
          script.async = true;
          script.setAttribute("data-elastic-cursor-gsap", "true");
          document.head.appendChild(script);
        }
        script.addEventListener("load", function () {
          initializeGsapCursor(window.gsap);
        }, { once: true });
      }

      function createWebglCursor() {
        var canvas = document.createElement("canvas");
        canvas.className = "elastic-cursor-webgl";
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.cssText = "position:fixed;inset:0;z-index:2147483645;width:100vw;height:100vh;pointer-events:none";

        var gl;
        try {
          gl = canvas.getContext("webgl", { alpha: true, antialias: false, powerPreference: "low-power" });
        } catch (error) {
          return null;
        }
        if (!gl) return null;

        function compileShader(type, source) {
          var shader = gl.createShader(type);
          gl.shaderSource(shader, source);
          gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            gl.deleteShader(shader);
            return null;
          }
          return shader;
        }

        var vertexShader = compileShader(
          gl.VERTEX_SHADER,
          "attribute vec2 a_position; void main(){ gl_Position=vec4(a_position,0.0,1.0); }"
        );
        var fragmentShader = compileShader(
          gl.FRAGMENT_SHADER,
          "precision mediump float; uniform vec2 u_pointer; uniform float u_hover; uniform float u_pulse; uniform float u_pixel_ratio; void main(){ float d=distance(gl_FragCoord.xy,u_pointer); float base=(27.0+5.0*u_hover)*u_pixel_ratio; float hoverRing=1.0-smoothstep(1.2*u_pixel_ratio,3.5*u_pixel_ratio,abs(d-base)); float pulseRadius=base+(1.0-u_pulse)*48.0*u_pixel_ratio; float pulseRing=1.0-smoothstep(1.2*u_pixel_ratio,4.0*u_pixel_ratio,abs(d-pulseRadius)); float alpha=hoverRing*u_hover*0.14+pulseRing*u_pulse*0.22; gl_FragColor=vec4(1.0,0.31,0.07,alpha); }"
        );
        if (!vertexShader || !fragmentShader) {
          canvas.remove();
          return null;
        }

        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          gl.deleteProgram(program);
          canvas.remove();
          return null;
        }

        body.appendChild(canvas);
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        gl.useProgram(program);
        var position = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        var uniforms = {
          pointer: gl.getUniformLocation(program, "u_pointer"),
          hover: gl.getUniformLocation(program, "u_hover"),
          pulse: gl.getUniformLocation(program, "u_pulse"),
          pixelRatio: gl.getUniformLocation(program, "u_pixel_ratio")
        };
        var target = { x: state.x, y: state.y, visible: false, hover: false, pulseAt: 0 };
        var pixelRatio = 1;
        var width = 0;
        var height = 0;
        var renderFrame = 0;

        function resize() {
          pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
          width = Math.max(1, Math.round(window.innerWidth * pixelRatio));
          height = Math.max(1, Math.round(window.innerHeight * pixelRatio));
          if (canvas.width === width && canvas.height === height) return;
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }

        function draw(now) {
          renderFrame = 0;
          if (document.hidden) return;
          resize();
          gl.disable(gl.SCISSOR_TEST);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);

          var pulse = target.pulseAt ? Math.max(0, 1 - (now - target.pulseAt) / 520) : 0;
          if (target.visible && (target.hover || pulse > 0)) {
            var px = target.x * pixelRatio;
            var py = (window.innerHeight - target.y) * pixelRatio;
            var radius = (target.hover ? 42 : 30) * pixelRatio + pulse * 54 * pixelRatio;
            var left = Math.max(0, Math.floor(px - radius));
            var bottom = Math.max(0, Math.floor(py - radius));
            var right = Math.min(width, Math.ceil(px + radius));
            var top = Math.min(height, Math.ceil(py + radius));
            gl.enable(gl.SCISSOR_TEST);
            gl.scissor(left, bottom, Math.max(1, right - left), Math.max(1, top - bottom));
            gl.uniform2f(uniforms.pointer, px, py);
            gl.uniform1f(uniforms.hover, target.hover ? 1 : 0);
            gl.uniform1f(uniforms.pulse, pulse);
            gl.uniform1f(uniforms.pixelRatio, pixelRatio);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            gl.disable(gl.SCISSOR_TEST);
          }

          if (pulse > 0) renderFrame = requestAnimationFrame(draw);
          else target.pulseAt = 0;
        }

        function render() {
          if (!renderFrame) renderFrame = requestAnimationFrame(draw);
        }

        window.addEventListener("resize", render, { passive: true });
        document.addEventListener("visibilitychange", function () {
          if (document.hidden) {
            if (renderFrame) cancelAnimationFrame(renderFrame);
            renderFrame = 0;
          } else {
            render();
          }
        });
        canvas.addEventListener("webglcontextlost", function (event) {
          event.preventDefault();
          if (renderFrame) cancelAnimationFrame(renderFrame);
          renderFrame = 0;
        });

        return {
          canvas: canvas,
          move: function (x, y) {
            target.x = x;
            target.y = y;
            target.visible = true;
            render();
          },
          setHover: function (hover) {
            target.hover = hover;
            render();
          },
          pulse: function () {
            target.pulseAt = performance.now();
            render();
          },
          hide: function () {
            target.visible = false;
            target.hover = false;
            target.pulseAt = 0;
            render();
          }
        };
      }

      function setCursorIcon(name) {
        var markup = cursorIcons[name] || cursorIcons.dot;
        icon.innerHTML = '<svg viewBox="0 0 24 24" focusable="false">' + markup + '</svg>';
        icon.setAttribute("data-state", name);
      }

      function getCursorIcon(target) {
        if (!target) return "dot";
        var explicit = target.getAttribute("data-cursor");
        if (explicit && cursorIcons[explicit]) return explicit;
        if (target.matches("[data-ll-sound-toggle]")) {
          return target.getAttribute("aria-pressed") === "true" ? "sound-off" : "sound-on";
        }
        if (target.matches("[data-ll-hero-open]")) return "play";
        if (target.matches("[data-ll-hero-play], video")) {
          var video = target.matches("video") ? target : target.closest(".ll-hero-showreel")?.querySelector("video");
          return video && !video.paused ? "pause" : "play";
        }
        var label = (target.getAttribute("aria-label") || target.textContent || "").toLowerCase();
        if (/\b(previous|prev|back)\b/.test(label) || target.matches("[data-service-previous]")) return "previous";
        if (/\b(next|forward|continue)\b/.test(label) || target.matches("[data-service-next]")) return "next";
        if (target.matches("a[href]")) return "next";
        return "click";
      }

      setCursorIcon("dot");

      cursor.style.transform =
        "translate3d(" + state.x + "px," + state.y + "px,0)";
      dot.style.transform =
        "translate3d(" + state.dotX + "px," + state.dotY + "px,0)";
      icon.style.transform =
        "translate3d(" + state.x + "px," + state.y + "px,0)";
      webglCursor = createWebglCursor();

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
        "[data-cursor]"
      ].join(",");

      function getInteractiveTarget(node) {
        if (!node || typeof node.closest !== "function") return null;
        return node.closest(interactiveSelector);
      }

      function setHoverState(isHover) {
        state.hover = isHover;
        body.classList.toggle("cursor-hover", isHover);
        if (webglCursor) webglCursor.setHover(isHover);
        updateGsapShape();
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
        state.activeTarget = null;
        setCursorIcon("dot");
      }

      function onOut(e) {
        if (isMenuTransitioning()) return;
        var fromInteractive = getInteractiveTarget(e.target);
        if (!fromInteractive) return;

        var toInteractive = getInteractiveTarget(e.relatedTarget);
        if (toInteractive === fromInteractive || toInteractive) {
          state.activeTarget = toInteractive || fromInteractive;
          setHoverState(true);
          setTightState(isTightTarget(toInteractive || fromInteractive));
          setCursorIcon(getCursorIcon(state.activeTarget));
          return;
        }

        state.activeTarget = null;
        setHoverState(false);
        setTightState(false);
        setCursorIcon("dot");
      }

      function onLeaveWindow() {
        body.classList.remove("cursor-visible", "cursor-hover", "cursor-click");
        cursor.style.opacity = "0";
        dot.style.opacity = "0";
        if (webglCursor) webglCursor.hide();
        setHoverState(false);
        setTightState(false);
        state.activeTarget = null;
        setCursorIcon("dot");
      }

      var frame = 0;
      var isAnimating = false;
      var lastMoveTime = 0;
      var suspended = false;

      function animate() {
        if (gsapMotion) {
          isAnimating = false;
          frame = 0;
          return;
        }
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
        icon.style.transform = "translate3d(" + state.x + "px," + state.y + "px,0)";

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
        if (gsapMotion) {
          updateGsapPosition(state.tx, state.ty, performance.now());
          return;
        }
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
        if (webglCursor) webglCursor.move(e.clientX, e.clientY);
        if (gsapMotion) updateGsapPosition(e.clientX, e.clientY, performance.now());
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
        state.activeTarget = interactive;
        setHoverState(true);
        setTightState(isTightTarget(interactive));
        setCursorIcon(getCursorIcon(interactive));
        startAnimation();
      }

      function onPointerDown() {
        if (!state.activeTarget) return;
        body.classList.add("cursor-click");
        setCursorIcon("click");
        if (webglCursor) webglCursor.pulse();
        if (gsapMotion && window.gsap) {
          window.gsap.to(dot, {
            scale: 1.8,
            duration: 0.12,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
            overwrite: "auto"
          });
        }
      }

      function onPointerUp() {
        body.classList.remove("cursor-click");
        setCursorIcon(getCursorIcon(state.activeTarget));
      }

      function onClick() {
        setCursorIcon(getCursorIcon(state.activeTarget));
      }

      document.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerover", onOver, true);
      document.addEventListener("pointerout", onOut, true);
      document.addEventListener("pointerdown", onPointerDown, true);
      document.addEventListener("pointerup", onPointerUp, true);
      document.addEventListener("click", onClick);
      window.addEventListener("blur", onLeaveWindow);
      document.addEventListener("lawani:pitchdeck-open", function () {
        // Only suspend if we're not already on the pitchdeck page
        if (!body.classList.contains("ll-deck-page")) {
          suspended = true;
          if (frame) cancelAnimationFrame(frame);
          frame = 0;
          isAnimating = false;
          onLeaveWindow();
        }
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

      loadGsapCursor();
      window.__elasticCursor = {
        cursor: cursor,
        dot: dot,
        icon: icon,
        webglCanvas: webglCursor && webglCursor.canvas,
        state: state,
        usesGsap: function () { return !!gsapMotion; }
      };
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
