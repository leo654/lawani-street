(function () {
  "use strict";

  var footer = document.querySelector(".home-index .ll-footer");
  var marquee = footer && footer.querySelector(".ll-footer__marquee");
  if (!marquee || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) return;
  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ""))) return;

  var canvas = document.createElement("canvas");
  canvas.className = "ll-footer__webgl";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;z-index:0;width:100%;height:100%;pointer-events:none";

  var renderer;
  var frame = 0;
  var active = false;
  var destroyed = false;
  var threeLoading = false;
  var lastFrame = 0;
  var uniforms;
  var scene;
  var camera;
  var material;
  var geometry;

  function removeCanvas() {
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  function loadThree() {
    return import("../libs/three.module.js").then(function (THREE) {
      return {
        WebGLRenderer: THREE.WebGLRenderer,
        Scene: THREE.Scene,
        OrthographicCamera: THREE.OrthographicCamera,
        Vector2: THREE.Vector2,
        ShaderMaterial: THREE.ShaderMaterial,
        PlaneGeometry: THREE.PlaneGeometry,
        Mesh: THREE.Mesh
      };
    });
  }

  function start() {
    if (active || destroyed || document.hidden) return;
    active = true;
    lastFrame = 0;
    frame = window.requestAnimationFrame(render);
  }

  function stop() {
    active = false;
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  }

  function resize() {
    if (!renderer || !uniforms) return;
    var width = Math.max(1, marquee.clientWidth);
    var height = Math.max(1, marquee.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(width, height, false);
    uniforms.uResolution.value.set(
      renderer.domElement.width,
      renderer.domElement.height
    );
  }

  function render(timestamp) {
    frame = 0;
    if (!active || destroyed || document.hidden) return;

    if (timestamp - lastFrame >= 32) {
      lastFrame = timestamp;
      uniforms.uTime.value = timestamp * 0.001;
      uniforms.uScroll.value = window.__lawaniFooterScrollProgress || 0;
      renderer.render(scene, camera);
    }

    frame = window.requestAnimationFrame(render);
  }

  function dispose() {
    if (destroyed) return;
    destroyed = true;
    stop();
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", dispose);
    if (geometry) geometry.dispose();
    if (material) material.dispose();
    if (renderer) renderer.dispose();
    removeCanvas();
  }

  function onVisibilityChange() {
    if (document.hidden) stop();
    else if (!("IntersectionObserver" in window)) start();
  }

  function initialize(THREE) {
    if (destroyed || !THREE || !THREE.WebGLRenderer) return;

    marquee.insertBefore(canvas, marquee.firstChild);

    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: false,
        powerPreference: "low-power"
      });
    } catch (error) {
      console.warn("Footer WebGL is unavailable; keeping the static footer background.", error);
      removeCanvas();
      return;
    }

    renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    uniforms = {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uScroll: { value: 0 }
    };
    material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: [
        "void main() {",
        "  gl_Position = vec4(position.xy, 0.0, 1.0);",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform vec2 uResolution;",
        "uniform float uTime;",
        "uniform float uScroll;",
        "void main() {",
        "  vec2 uv = gl_FragCoord.xy / uResolution;",
        "  float pulse = 0.5 + 0.5 * sin(uTime * 0.65 + uScroll * 6.28318);",
        "  float ribbon = sin((uv.y * 7.0 + uv.x * 2.2 + uScroll * 1.4) * 6.28318 - uTime * 0.5);",
        "  float bands = smoothstep(0.78, 1.0, ribbon) * exp(-abs(uv.y - (0.48 + 0.12 * sin(uv.x * 4.0 + uTime * 0.18))) * 12.0);",
        "  float alpha = clamp(bands * (0.035 + pulse * 0.015), 0.0, 0.05);",
        "  vec3 orange = vec3(1.0, 0.22, 0.055);",
        "  gl_FragColor = vec4(orange, alpha);",
        "}"
      ].join("\n")
    });
    geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));

    resize();
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", dispose, { once: true });
    canvas.addEventListener("webglcontextlost", function (event) {
      event.preventDefault();
      stop();
      console.warn("Footer WebGL context was lost; the static footer background remains available.");
    });

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.target !== marquee) return;
          if (entry.isIntersecting) start();
          else stop();
        });
      }, { rootMargin: "240px 0px", threshold: 0 });
      observer.observe(marquee);
      window.addEventListener("pagehide", function () { observer.disconnect(); }, { once: true });
    } else {
      start();
    }
  }

  function loadThreeWhenNearFooter() {
    if (threeLoading || destroyed) return;
    threeLoading = true;
    loadThree().then(initialize).catch(function (error) {
      console.warn("Three.js could not be loaded; keeping the static footer background.", error);
    });
  }

  var loadObserver;
  function checkNearFooter() {
    var rect = marquee.getBoundingClientRect();
    if (rect.top > window.innerHeight + 360 || rect.bottom < -360) return;
    window.removeEventListener("scroll", checkNearFooter);
    if (loadObserver) loadObserver.disconnect();
    loadThreeWhenNearFooter();
  }

  if ("IntersectionObserver" in window) {
    loadObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        loadObserver.disconnect();
        window.removeEventListener("scroll", checkNearFooter);
        loadThreeWhenNearFooter();
      });
    }, { rootMargin: "360px 0px", threshold: 0 });
    loadObserver.observe(marquee);
  }

  window.addEventListener("scroll", checkNearFooter, { passive: true });
  window.addEventListener("pagehide", function () {
    if (loadObserver) loadObserver.disconnect();
    window.removeEventListener("scroll", checkNearFooter);
  }, { once: true });
  window.setTimeout(checkNearFooter, 120);
})();
