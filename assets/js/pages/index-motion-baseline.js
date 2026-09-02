/* Baseline home motion system (start-over foundation).
   - Single init path for home page motion
   - Lazy-load Three via runtime.shared.js (MotionLibs.ensureThreeJs)
   - Respects prefers-reduced-motion
   - Pauses WebGL rAF when offscreen / tab hidden
*/
(function () {
  'use strict';

  if (!document.body || !document.body.classList.contains('home-index')) return;

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  function onceReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function ensureThree() {
    if (reduceMotion) return Promise.resolve(null);
    if (window.THREE) return Promise.resolve(window.THREE);
    if (window.MotionLibs && typeof window.MotionLibs.ensureThreeJs === 'function') {
      return window.MotionLibs.ensureThreeJs().then(function () {
        return window.THREE || null;
      });
    }
    return Promise.resolve(null);
  }

  /* ── Social hover (no Three required) ─────────────────────── */
  function initSocialHover() {
    var buttons = document.querySelectorAll('.social-row button');
    if (!buttons.length) return;
    buttons.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = (e.clientX - rect.left - rect.width / 2) * 0.2;
        var y = (e.clientY - rect.top - rect.height / 2) * 0.2;
        btn.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
      }, { passive: true });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform = 'translate(0,0)';
      }, { passive: true });
    });
  }

  /* ── WebGL background (optional) ──────────────────────────── */
  function initWebglSocialBackground(THREE) {
    if (reduceMotion) return;
    var canvas = document.getElementById('webgl');
    if (!canvas || !THREE) return;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      return;
    }

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    var material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        mouse: { value: new THREE.Vector2(0.5, 0.5) }
      },
      fragmentShader: [
        'uniform float time;',
        'uniform vec2 mouse;',
        'void main(){',
        '  vec2 uv = gl_FragCoord.xy / vec2(2000.0);',
        '  float d = distance(uv, mouse);',
        '  float wave = sin(d * 12.0 - time * 1.5) * 0.04;',
        '  gl_FragColor = vec4(.85, .75, 1.0, 0.06 + wave);',
        '}'
      ].join('\n')
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    function resizeRenderer() {
      var w = window.innerWidth || 1;
      var h = window.innerHeight || 1;
      renderer.setSize(w, h, false);
    }

    var inView = true;
    var running = false;
    var raf = 0;

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    }

    function tick(t) {
      if (!running) return;
      if (!inView || (typeof document.hidden === 'boolean' && document.hidden)) {
        stop();
        return;
      }
      material.uniforms.time.value = (t || 0) * 0.001;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', function (e) {
      var w = window.innerWidth || 1;
      var h = window.innerHeight || 1;
      material.uniforms.mouse.value.x = e.clientX / w;
      material.uniforms.mouse.value.y = 1 - e.clientY / h;
    }, { passive: true });

    window.addEventListener('resize', resizeRenderer, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (typeof document.hidden === 'boolean' && document.hidden) stop();
      else if (inView) start();
    }, { passive: true });

    try {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.target !== canvas) return;
          inView = !!entry.isIntersecting;
          if (inView) start();
          else stop();
        });
      }, { threshold: 0.05 });
      io.observe(canvas);
    } catch (e) {}

    resizeRenderer();
    start();
  }

  /* ── Hero equalizer (optional) ────────────────────────────── */
  function initHeroEq3D(THREE) {
    if (reduceMotion) return;
    var canvas = document.querySelector('[data-hero-eq]');
    if (!canvas || !THREE) return;

    var wrap = document.querySelector('.home-hero__nowplaying');
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.set(0, 0, 5);

    var viewHeight = 1.2;
    var stripWidth = 0;
    var lineSegments = 56;
    var dotSegments = 14;

    var lineGeo = new THREE.BufferGeometry();
    var linePositions = new Float32Array((lineSegments + 1) * 3);
    var lineColors = new Float32Array((lineSegments + 1) * 3);
    for (var lc = 0; lc <= lineSegments; lc++) {
      var lu = lc / lineSegments;
      var lf = 0.18 + 0.82 * Math.sin(Math.PI * lu);
      var li = lc * 3;
      lineColors[li] = lf;
      lineColors[li + 1] = lf;
      lineColors[li + 2] = lf;
    }
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    var lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.7 });
    var line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);

    var pointsGeo = new THREE.BufferGeometry();
    var pointsPos = new Float32Array((dotSegments + 1) * 3);
    var dotColors = new Float32Array((dotSegments + 1) * 3);
    for (var dc = 0; dc <= dotSegments; dc++) {
      var du = dc / dotSegments;
      var df = 0.22 + 0.78 * Math.sin(Math.PI * du);
      var di = dc * 3;
      dotColors[di] = df;
      dotColors[di + 1] = df;
      dotColors[di + 2] = df;
    }
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(pointsPos, 3));
    pointsGeo.setAttribute('color', new THREE.BufferAttribute(dotColors, 3));
    var pointsMat = new THREE.PointsMaterial({ vertexColors: true, size: 2.8, sizeAttenuation: false, transparent: true, opacity: 0.9 });
    var dots = new THREE.Points(pointsGeo, pointsMat);
    scene.add(dots);

    var headGeo = new THREE.BufferGeometry();
    var headPos = new Float32Array(3);
    headGeo.setAttribute('position', new THREE.BufferAttribute(headPos, 3));
    var headMat = new THREE.PointsMaterial({ color: 0xff3c00, size: 5.2, sizeAttenuation: false, transparent: true, opacity: 0.5 });
    var headDot = new THREE.Points(headGeo, headMat);
    scene.add(headDot);

    var ampNow = 0.18;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var width = Math.max(1, rect.width);
      var height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      var aspect = width / height;
      camera.left = -viewHeight * aspect;
      camera.right = viewHeight * aspect;
      camera.top = viewHeight;
      camera.bottom = -viewHeight;
      camera.updateProjectionMatrix();
      stripWidth = (viewHeight * aspect) * 2 * 0.9;
    }

    var inView = true;
    var running = false;
    var raf = 0;

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(animate);
    }

    function animate(time) {
      if (!running) return;
      if (!inView || (typeof document.hidden === 'boolean' && document.hidden)) {
        stop();
        return;
      }

      var t = (time || 0) * 0.001;
      var isPlaying = wrap && wrap.dataset.playing === 'true';
      var targetAmp = isPlaying ? 1 : 0.18;
      ampNow += (targetAmp - ampNow) * 0.08;
      var amp = ampNow;

      var targetLineOpacity = isPlaying ? 0.85 : 0.4;
      var targetDotOpacity = isPlaying ? 0.95 : 0.55;
      lineMat.opacity += (targetLineOpacity - lineMat.opacity) * 0.08;
      pointsMat.opacity += (targetDotOpacity - pointsMat.opacity) * 0.08;
      var targetHeadOpacity = isPlaying ? 0.88 : 0.22;
      headMat.opacity += (targetHeadOpacity - headMat.opacity) * 0.08;
      headMat.size = 4.6 + (isPlaying ? (0.25 + 0.18 * Math.sin(t * 3.1)) : 0);

      var linePos = lineGeo.attributes.position.array;
      var dotPos = pointsGeo.attributes.position.array;
      for (var j = 0; j <= lineSegments; j++) {
        var px = -stripWidth / 2 + (stripWidth * j) / lineSegments;
        var wobble = Math.sin(t * 1.6 + px * 1.05) + Math.sin(t * 0.7 + px * 2.15) * 0.55;
        var y = wobble * 0.32 * amp;
        var idx = j * 3;
        linePos[idx] = px;
        linePos[idx + 1] = y;
        linePos[idx + 2] = 0;
      }

      for (var k = 0; k <= dotSegments; k++) {
        var dpx = -stripWidth / 2 + (stripWidth * k) / dotSegments;
        var dwobble = Math.sin(t * 1.6 + dpx * 1.05) + Math.sin(t * 0.7 + dpx * 2.15) * 0.55;
        var dy = dwobble * 0.32 * amp;
        var didx = k * 3;
        dotPos[didx] = dpx;
        dotPos[didx + 1] = dy;
        dotPos[didx + 2] = 0;
      }

      var progress = 0;
      if (typeof window.__homeHeroAudioProgress === 'number') {
        progress = window.__homeHeroAudioProgress;
      } else if (wrap && wrap.dataset && wrap.dataset.progress) {
        progress = parseFloat(wrap.dataset.progress) || 0;
      }
      progress = Math.max(0, Math.min(1, progress || 0));
      var hx = -stripWidth / 2 + stripWidth * progress;
      var hwobble = Math.sin(t * 1.6 + hx * 1.05) + Math.sin(t * 0.7 + hx * 2.15) * 0.55;
      var hy = hwobble * 0.32 * amp;
      headPos[0] = hx;
      headPos[1] = hy;
      headPos[2] = 0;

      lineGeo.attributes.position.needsUpdate = true;
      pointsGeo.attributes.position.needsUpdate = true;
      headGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (typeof document.hidden === 'boolean' && document.hidden) stop();
      else if (inView) start();
    }, { passive: true });

    try {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.target !== canvas) return;
          inView = !!entry.isIntersecting;
          if (inView) start();
          else stop();
        });
      }, { threshold: 0.05 });
      io.observe(canvas);
    } catch (e) {}

    resize();
    start();
  }

  onceReady(function () {
    initSocialHover();
    ensureThree().then(function (THREE) {
      initWebglSocialBackground(THREE);
      initHeroEq3D(THREE);
    }).catch(function () {});
  });
})();

