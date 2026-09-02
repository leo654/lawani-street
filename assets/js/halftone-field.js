(function () {
  "use strict";

  var canvases = Array.prototype.slice.call(document.querySelectorAll("[data-ll-halftone]"));
  if (!canvases.length) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var states = [];
  var lastPaint = 0;
  var running = false;
  var suspended = false;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function smoothstep(edge0, edge1, value) {
    var t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function colorFor(canvas) {
    var color = window.getComputedStyle(canvas).color;
    return color && color !== "canvastext" ? color : "#151917";
  }

  function resize(state) {
    var rect = state.canvas.getBoundingClientRect();
    var width = Math.max(1, Math.round(rect.width));
    var height = Math.max(1, Math.round(rect.height));
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    if (state.width === width && state.height === height && state.dpr === dpr) return;

    state.width = width;
    state.height = height;
    state.dpr = dpr;
    state.canvas.width = Math.round(width * dpr);
    state.canvas.height = Math.round(height * dpr);
    state.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.spacing = width < 640 ? 4.2 : width < 1100 ? 4.8 : 5.4;
  }

  function updateScroll(state) {
    var rect = state.host.getBoundingClientRect();
    var travel = Math.max(1, rect.height + window.innerHeight);
    state.scrollTarget = clamp((window.innerHeight - rect.top) / travel, 0, 1);
  }

  function paint(state, now) {
    resize(state);

    var context = state.context;
    var width = state.width;
    var height = state.height;
    var spacing = state.spacing;
    var mode = state.mode;
    var time = reduceMotion.matches ? 0 : now * 0.00034;
    var rows = [[], [], [], []];
    var radii = mode === "contact" ? [0.155, 0.22, 0.285, 0.355] : [0.14, 0.21, 0.285, 0.37];
    var alphas = mode === "contact" ? [0.16, 0.29, 0.48, 0.76] : [0.12, 0.25, 0.48, 0.82];

    state.pointerX += (state.pointerTargetX - state.pointerX) * 0.075;
    state.pointerY += (state.pointerTargetY - state.pointerY) * 0.075;
    state.scroll += (state.scrollTarget - state.scroll) * 0.055;

    context.clearRect(0, 0, width, height);
    context.fillStyle = colorFor(state.canvas);

    for (var y = spacing * 0.5; y < height + spacing; y += spacing) {
      var ny = y / height;
      for (var x = spacing * 0.5; x < width + spacing; x += spacing) {
        var nx = x / width;
        var dx = nx - state.pointerX;
        var dy = ny - state.pointerY;
        var distance = Math.sqrt(dx * dx + dy * dy);
        var cursorWave = Math.exp(-distance * distance * 17) * Math.sin(distance * 34 - time * 7.5) * 0.08;
        var longWave = Math.sin(nx * 7.4 + time * 2.25) * 0.035;
        var fineWave = Math.sin(nx * 18.5 - time * 1.55 + Math.cos(nx * 4.5)) * 0.018;
        var scrollWave = Math.sin((nx + state.scroll) * 10.2 - time) * state.scroll * 0.018;
        var boundary = (mode === "contact" ? 0.05 : 0.12) + longWave + fineWave + scrollWave + cursorWave;
        var spread = mode === "contact" ? 0.85 : 0.75;
        var density = smoothstep(boundary - spread * 0.5, boundary + spread * 0.5, ny);

        if (mode === "contact") {
          var veil = 0.14 + 0.10 * Math.sin(nx * 8 + ny * 5 - time * 1.3);
          density = clamp(density * 0.84 + veil, 0, 1);
        }

        var band = Math.min(3, Math.floor(density * 4));
        if (density < 0.025) continue;
        rows[band].push(x, y);
      }
    }

    for (var bandIndex = 0; bandIndex < rows.length; bandIndex += 1) {
      var points = rows[bandIndex];
      if (!points.length) continue;
      context.beginPath();
      for (var point = 0; point < points.length; point += 2) {
        context.moveTo(points[point] + radii[bandIndex], points[point + 1]);
        context.arc(points[point], points[point + 1], radii[bandIndex], 0, Math.PI * 2);
      }
      context.globalAlpha = alphas[bandIndex];
      context.fill();
    }

    context.globalAlpha = 1;
    state.host.classList.add("ll-halftone-ready");
  }

  function tick(now) {
    if (document.hidden || suspended) {
      running = false;
      return;
    }

    if (reduceMotion.matches || now - lastPaint >= 32) {
      states.forEach(function (state) {
        if (state.visible) paint(state, now);
      });
      lastPaint = now;
    }

    if (reduceMotion.matches) {
      running = false;
      return;
    }

    window.requestAnimationFrame(tick);
  }

  function start() {
    if (running || document.hidden || suspended) return;
    running = true;
    window.requestAnimationFrame(tick);
  }

  canvases.forEach(function (canvas) {
    var host = canvas.parentElement;
    var context = canvas.getContext("2d", { alpha: true });
    if (!host || !context) return;

    var state = {
      canvas: canvas,
      context: context,
      host: host,
      mode: canvas.getAttribute("data-ll-halftone-mode") === "contact" ? "contact" : "hero",
      pointerX: 0.5,
      pointerY: 0.42,
      pointerTargetX: 0.5,
      pointerTargetY: 0.42,
      scroll: 0,
      scrollTarget: 0,
      visible: true,
      width: 0,
      height: 0,
      dpr: 0,
      spacing: 9
    };

    host.addEventListener("pointermove", function (event) {
      var rect = host.getBoundingClientRect();
      state.pointerTargetX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      state.pointerTargetY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    }, { passive: true });

    host.addEventListener("pointerleave", function () {
      state.pointerTargetX = 0.5;
      state.pointerTargetY = state.mode === "contact" ? 0.5 : 0.42;
    }, { passive: true });

    if ("ResizeObserver" in window) {
      state.resizeObserver = new ResizeObserver(function () { state.width = 0; });
      state.resizeObserver.observe(host);
    }

    if ("IntersectionObserver" in window) {
      state.intersectionObserver = new IntersectionObserver(function (entries) {
        state.visible = entries[0].isIntersecting;
        if (state.visible && reduceMotion.matches) paint(state, performance.now());
      });
      state.intersectionObserver.observe(host);
    }

    states.push(state);
    updateScroll(state);
  });

  function updateAllScroll() {
    states.forEach(updateScroll);
  }

  window.addEventListener("scroll", updateAllScroll, { passive: true });
  window.addEventListener("resize", updateAllScroll, { passive: true });
  document.addEventListener("visibilitychange", start);
  document.addEventListener("lawani:pitchdeck-open", function () {
    suspended = true;
  });
  document.addEventListener("lawani:pitchdeck-closed", function () {
    suspended = false;
    start();
  });

  var themeObserver = new MutationObserver(function () {
    states.forEach(function (state) { paint(state, performance.now()); });
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  if (typeof reduceMotion.addEventListener === "function") {
    reduceMotion.addEventListener("change", function () {
      lastPaint = 0;
      start();
    });
  }

  start();
}());
