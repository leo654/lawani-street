/* One shared WebGL canvas renders localized pointer ripples over site media. */
(function () {
  "use strict";

  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches || !document.body) return;

  var media = Array.prototype.slice.call(document.querySelectorAll(
    ".case-study .cs-story__media img, .case-study .cs-story__media video, " +
    ".case-study .cs-gallery img, .case-study .cs-gallery video, " +
    "body.home-index .ll-home-hero__media video[data-ll-hero-video], " +
    "body.home-index .ll-manifesto__gallery img, " +
    "body.home-index .ll-manifesto__portrait img, " +
    "body.home-index .ll-manifesto__portrait video"
  ));
  if (!media.length) return;

  var targets = [];
  media.forEach(function (source) {
    var target = source.closest(".lwa-project__toggle, .ll-home-hero__media") ||
      source.closest("figure") || source;
    var group = targets.find(function (item) { return item.target === target; });
    if (!group) {
      group = { target: target, sources: [] };
      targets.push(group);
    }
    group.sources.push(source);
  });

  var canvas = document.createElement("canvas");
  canvas.className = "ll-media-ripple-canvas";
  canvas.setAttribute("aria-hidden", "true");
  canvas.setAttribute("role", "presentation");
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "1";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  document.body.appendChild(canvas);

  var gl = null;
  var program = null;
  var texture = null;
  var uniforms = null;
  var activeMedia = null;
  var activeTarget = null;
  var pointer = { x: 0.5, y: 0.5 };
  var strength = 0;
  var targetStrength = 0;
  var frame = 0;
  var startTime = 0;
  var disposed = false;

  function clearActiveRipple() {
    targetStrength = 0;
    requestRender();
  }

  document.querySelectorAll("[data-work-gallery]").forEach(function (gallery) {
    gallery.addEventListener("scroll", function () {
      if (activeTarget && gallery.contains(activeTarget)) clearActiveRipple();
    }, { passive: true });
  });

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

  function initRenderer() {
    if (gl) return true;
    gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: "low-power"
    });
    if (!gl) return false;

    var vertexShader = compileShader(gl.VERTEX_SHADER,
      "attribute vec2 aPosition; varying vec2 vUv; " +
      "void main(){ vUv=(aPosition+1.0)*0.5; gl_Position=vec4(aPosition,0.0,1.0); }");
    var fragmentShader = compileShader(gl.FRAGMENT_SHADER,
      "precision mediump float; varying vec2 vUv; uniform sampler2D uTexture; " +
      "uniform vec2 uPointer; uniform vec2 uSize; uniform vec2 uUvScale; " +
      "uniform vec2 uUvOffset; uniform vec2 uDrawScale; uniform vec2 uDrawOffset; " +
      "uniform float uTime; uniform float uStrength; " +
      "void main(){ " +
      "vec2 canvasUv=(vUv-uDrawOffset)/max(uDrawScale,vec2(0.0001)); " +
      "if(any(lessThan(vUv,uDrawOffset))||any(greaterThan(vUv,uDrawOffset+uDrawScale))){ gl_FragColor=vec4(0.0); return; } " +
      "vec2 delta=canvasUv-uPointer; float aspect=(uSize.x/max(uSize.y,1.0))*(uUvScale.x/max(uUvScale.y,0.0001)); " +
      "vec2 radial=vec2(delta.x*aspect,delta.y); float d=length(radial); " +
      "float falloff=1.0-smoothstep(0.0,0.34,d); " +
      "float wave=sin(d*58.0-uTime*7.2)*exp(-d*7.5)*falloff*uStrength; " +
      "vec2 direction=radial/max(d,0.0001); " +
      "vec2 displacement=(direction*wave*0.018)/vec2(aspect,1.0); " +
      "vec2 uv=canvasUv+displacement; " +
      "uv=uUvOffset+uv*uUvScale; " +
      "vec4 color=texture2D(uTexture,clamp(uv,0.001,0.999)); " +
      // Keep source transparency so the ripple does not turn transparent image pixels opaque.
      "gl_FragColor=color; }");
    if (!vertexShader || !fragmentShader) return false;

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;

    var vertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);
    gl.useProgram(program);
    var position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    uniforms = {
      pointer: gl.getUniformLocation(program, "uPointer"),
      size: gl.getUniformLocation(program, "uSize"),
      uvScale: gl.getUniformLocation(program, "uUvScale"),
      uvOffset: gl.getUniformLocation(program, "uUvOffset"),
      drawScale: gl.getUniformLocation(program, "uDrawScale"),
      drawOffset: gl.getUniformLocation(program, "uDrawOffset"),
      time: gl.getUniformLocation(program, "uTime"),
      strength: gl.getUniformLocation(program, "uStrength"),
      sampler: gl.getUniformLocation(program, "uTexture")
    };
    gl.uniform1i(uniforms.sampler, 0);
    return true;
  }

  function getSourceSize(source) {
    if (source instanceof HTMLVideoElement) {
      return { width: source.videoWidth, height: source.videoHeight };
    }
    return { width: source.naturalWidth, height: source.naturalHeight };
  }

  function sourceReady(source) {
    if (source instanceof HTMLVideoElement) return source.readyState >= 2;
    return source.complete && source.naturalWidth > 0;
  }

  function positionFraction(value, axis) {
    var token = (value || "").toLowerCase();
    if (token.indexOf("left") !== -1 || token.indexOf("top") !== -1) return 0;
    if (token.indexOf("right") !== -1 || token.indexOf("bottom") !== -1) return 1;
    if (token.indexOf("center") !== -1) return 0.5;
    var percent = token.match(/(-?\d+(?:\.\d+)?)%/);
    if (percent) return Math.max(0, Math.min(1, Number(percent[1]) / 100));
    return 0.5;
  }

  function getFitGeometry(source, rect, sourceSize) {
    var style = getComputedStyle(source);
    var fit = style.objectFit || "fill";
    var sourceAspect = sourceSize.width / Math.max(sourceSize.height, 1);
    var boxAspect = rect.width / Math.max(rect.height, 1);
    var uvScale = { x: 1, y: 1 };
    var uvOffset = { x: 0, y: 0 };
    var drawScale = { x: 1, y: 1 };
    var drawOffset = { x: 0, y: 0 };
    var position = (style.objectPosition || "50% 50%").split(/\s+/);
    var xPosition = positionFraction(position[0], "x");
    var yPosition = positionFraction(position[1] || position[0], "y");
    var yPositionFromBottom = 1 - yPosition;

    if (fit === "cover") {
      if (sourceAspect > boxAspect) {
        uvScale.x = boxAspect / sourceAspect;
        uvOffset.x = (1 - uvScale.x) * xPosition;
      } else {
        uvScale.y = sourceAspect / boxAspect;
        uvOffset.y = (1 - uvScale.y) * yPositionFromBottom;
      }
    } else if (fit === "contain") {
      if (sourceAspect > boxAspect) {
        drawScale.y = boxAspect / sourceAspect;
        drawOffset.y = (1 - drawScale.y) * yPositionFromBottom;
      } else {
        drawScale.x = sourceAspect / boxAspect;
        drawOffset.x = (1 - drawScale.x) * xPosition;
      }
    }
    return { uvScale: uvScale, uvOffset: uvOffset, drawScale: drawScale, drawOffset: drawOffset };
  }

  function render(now) {
    frame = 0;
    if (disposed || !gl || gl.isContextLost()) return;

    strength += (targetStrength - strength) * 0.16;
    if (activeMedia && sourceReady(activeMedia)) {
      var rect = activeMedia.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        // The canvas redraws the media, so mirror its existing CSS filter exactly.
        // Otherwise filtered source media appears to change color while rippling.
        var mediaStyle = getComputedStyle(activeMedia);
        canvas.style.filter = mediaStyle.filter;
        canvas.style.opacity = mediaStyle.opacity;
        var scale = Math.min(1.5, window.devicePixelRatio || 1);
        var pixelWidth = Math.max(1, Math.round(rect.width * scale));
        var pixelHeight = Math.max(1, Math.round(rect.height * scale));
        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
          canvas.width = pixelWidth;
          canvas.height = pixelHeight;
        }
        if (activeTarget.matches(".ll-home-hero__media")) {
          canvas.style.left = "";
          canvas.style.top = "";
          canvas.style.inset = "0";
        } else {
          canvas.style.inset = "";
          canvas.style.left = Math.round(rect.left) + "px";
          canvas.style.top = Math.round(rect.top) + "px";
          canvas.style.width = rect.width + "px";
          canvas.style.height = rect.height + "px";
        }
        canvas.classList.add("is-active");

        gl.viewport(0, 0, pixelWidth, pixelHeight);
        gl.useProgram(program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, activeMedia);
        } catch (_) {
          activeMedia = null;
          activeTarget = null;
          targetStrength = 0;
          strength = 0;
          canvas.classList.remove("is-active");
          canvas.style.filter = "";
          canvas.style.opacity = "";
          canvas.width = 1;
          canvas.height = 1;
          return;
        }
        var sourceSize = getSourceSize(activeMedia || document.createElement("img"));
        var fit = getFitGeometry(activeMedia, rect, sourceSize);
        var localPointerX = (pointer.x - fit.drawOffset.x) / fit.drawScale.x;
        var localPointerY = (pointer.y - fit.drawOffset.y) / fit.drawScale.y;
        gl.uniform2f(uniforms.pointer, localPointerX, localPointerY);
        gl.uniform2f(uniforms.size, sourceSize.width || rect.width, sourceSize.height || rect.height);
        gl.uniform2f(uniforms.uvScale, fit.uvScale.x, fit.uvScale.y);
        gl.uniform2f(uniforms.uvOffset, fit.uvOffset.x, fit.uvOffset.y);
        gl.uniform2f(uniforms.drawScale, fit.drawScale.x, fit.drawScale.y);
        gl.uniform2f(uniforms.drawOffset, fit.drawOffset.x, fit.drawOffset.y);
        gl.uniform1f(uniforms.time, (now - startTime) / 1000);
        gl.uniform1f(uniforms.strength, strength);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }

    if (targetStrength > 0.008 || strength > 0.008) {
      frame = window.requestAnimationFrame(render);
    } else {
      activeMedia = null;
      activeTarget = null;
      canvas.classList.remove("is-active");
      canvas.style.filter = "";
      canvas.style.opacity = "";
      canvas.width = 1;
      canvas.height = 1;
    }
  }

  function requestRender() {
    if (!frame) frame = window.requestAnimationFrame(render);
  }

  function updatePointer(event, source) {
    var rect = source.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    pointer.y = 1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    requestRender();
  }

  function mediaAtPointer(target, event) {
    var group = targets.find(function (item) { return item.target === target; });
    if (!group) return null;
    var selected = null;
    var highestOpacity = 0;
    group.sources.forEach(function (source) {
      var rect = source.getBoundingClientRect();
      if (!rect.width || !rect.height || event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom || !source.getClientRects().length) return;
      var opacity = Number(getComputedStyle(source).opacity) || 0;
      if (opacity <= highestOpacity) return;
      selected = source;
      highestOpacity = opacity;
    });
    return selected;
  }

  function activateAt(target, event) {
    if (document.body.classList.contains("ll-showreel-open")) {
      clearActiveRipple();
      return;
    }
    var source = mediaAtPointer(target, event);
    if (!source) {
      if (target === activeTarget) {
        clearActiveRipple();
      }
      return;
    }
    if (!initRenderer()) return;
    if (source !== activeMedia) startTime = performance.now();
    activeMedia = source;
    activeTarget = target;
    if (target.matches(".ll-home-hero__media")) {
      canvas.style.position = "absolute";
      canvas.style.inset = "0";
      canvas.style.zIndex = "1";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      target.appendChild(canvas);
    } else {
      canvas.style.position = "fixed";
      canvas.style.inset = "";
      canvas.style.zIndex = "12";
      document.body.appendChild(canvas);
    }
    targetStrength = 1;
    updatePointer(event, source);
    requestRender();
  }

  function enter(event) {
    activateAt(event.currentTarget, event);
  }

  function move(event) {
    activateAt(event.currentTarget, event);
  }

  function leave(event) {
    if (event.currentTarget !== activeTarget) return;
    clearActiveRipple();
  }

  function touchStart(event) {
    if (event.pointerType !== "touch") return;
    activateAt(event.currentTarget, event);
  }

  function touchEnd(event) {
    if (event.pointerType !== "touch" || event.currentTarget !== activeTarget) return;
    clearActiveRipple();
  }

  function handleClick() {
    // Desktop clicks dismiss the ripple before a media card opens. On touch,
    // let the short ripple finish; scrolling still clears it immediately.
    if (finePointer.matches) stopRippleWhileScrolling();
  }

  targets.forEach(function (group) {
    group.target.addEventListener("pointerenter", enter, { passive: true });
    group.target.addEventListener("pointermove", move, { passive: true });
    group.target.addEventListener("pointerdown", touchStart, { passive: true });
    group.target.addEventListener("pointerup", touchEnd, { passive: true });
    group.target.addEventListener("pointercancel", touchEnd, { passive: true });
    group.target.addEventListener("pointerleave", leave, { passive: true });
    group.target.addEventListener("click", handleClick, { passive: true });
  });

  function stopRippleWhileScrolling() {
    if (!activeMedia && strength === 0) return;
    activeMedia = null;
    activeTarget = null;
    targetStrength = 0;
    strength = 0;
    canvas.classList.remove("is-active");
    canvas.style.filter = "";
    canvas.style.opacity = "";
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    canvas.width = 1;
    canvas.height = 1;
  }

  window.addEventListener("scroll", stopRippleWhileScrolling, { passive: true });

  function onContextLost() {
    if (gl) gl = null;
    program = null;
    texture = null;
    uniforms = null;
    activeMedia = null;
    activeTarget = null;
    targetStrength = 0;
    strength = 0;
    canvas.classList.remove("is-active");
    canvas.style.filter = "";
    canvas.style.opacity = "";
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  }
  canvas.addEventListener("webglcontextlost", onContextLost, false);

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      activeMedia = null;
      activeTarget = null;
      targetStrength = 0;
      strength = 0;
      canvas.classList.remove("is-active");
      canvas.style.filter = "";
      canvas.style.opacity = "";
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      canvas.width = 1;
      canvas.height = 1;
      return;
    }
    requestRender();
  });

  window.addEventListener("pagehide", function () {
    disposed = true;
    if (frame) window.cancelAnimationFrame(frame);
  }, { once: true });
})();
