(function() {
  'use strict';

  if (!document.body.classList.contains('work-archive')) return;

  var hero = document.querySelector('[data-work-hero]');
  var stage = document.querySelector('[data-workgl-stage]');
  if (!hero || !stage) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsapApi = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  var activeIndex = 0;

  function whenThreeReady() {
    if (window.THREE) return Promise.resolve(window.THREE);
    return new Promise(function(resolve) {
      var done = false;
      function finish() {
        if (done || !window.THREE) return;
        done = true;
        resolve(window.THREE);
      }
      window.addEventListener('three:ready', finish, { once: true });
      window.setTimeout(finish, 1400);
    });
  }

  function setupReveal() {
    var items = Array.prototype.slice.call(hero.querySelectorAll('[data-work-reveal]'));
    if (!items.length) return;

    if (gsapApi && !reduceMotion) {
      gsapApi.timeline({ defaults: { ease: 'power3.out' } })
        .from(items, {
          autoAlpha: 0,
          y: 28,
          filter: 'blur(10px)',
          duration: 1.05,
          stagger: 0.11,
          clearProps: 'opacity,visibility,transform,filter'
        }, 0.12);
      return;
    }

    items.forEach(function(el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.filter = 'none';
    });
  }

  function setupInteractions() {
    var cards = Array.prototype.slice.call(hero.querySelectorAll('[data-work-card]'));
    var scrollButton = hero.querySelector('[data-work-scroll]');
    var target = document.getElementById('work-list-projects');

    cards.forEach(function(card) {
      card.addEventListener('mouseenter', function() {
        setActiveCard(cards, card);
      });
      card.addEventListener('focus', function() {
        setActiveCard(cards, card);
      });
    });

    if (scrollButton && target) {
      scrollButton.addEventListener('click', function() {
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    }

    hero.addEventListener('pointermove', function(event) {
      var rect = hero.getBoundingClientRect();
      pointer.tx = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      pointer.ty = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1;
    }, { passive: true });
  }

  function setActiveCard(cards, card) {
    cards.forEach(function(item) {
      item.classList.toggle('is-active', item === card);
    });
    activeIndex = Number(card.getAttribute('data-texture-index')) || 0;
  }

  function setupGsapScroll() {
    if (!gsapApi || !ScrollTrigger || reduceMotion) return;
    gsapApi.registerPlugin(ScrollTrigger);

    gsapApi.to(hero.querySelector('.work-hero-next__title'), {
      yPercent: -10,
      opacity: 0.46,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    gsapApi.to(stage, {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }

  function coverTexture(texture) {
    if (!texture || !texture.image) return;
    texture.colorSpace = window.THREE && window.THREE.SRGBColorSpace ? window.THREE.SRGBColorSpace : texture.colorSpace;
    texture.needsUpdate = true;
  }

  function setupThree(THREE) {
    if (!THREE || reduceMotion) {
      stage.classList.add('is-static');
      return;
    }

    var renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    stage.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 7.4);

    var startTime = performance.now();
    var root = new THREE.Group();
    var cardGroup = new THREE.Group();
    scene.add(root);
    root.add(cardGroup);

    var uniforms = {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uResolution: { value: new THREE.Vector2(1, 1) }
    };

    var bgMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      vertexShader: [
        'varying vec2 vUv;',
        'void main(){',
        '  vUv = uv;',
        '  gl_Position = vec4(position.xy, 0.0, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision highp float;',
        'varying vec2 vUv;',
        'uniform float uTime;',
        'uniform vec2 uPointer;',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }',
        'float noise(vec2 p){',
        '  vec2 i = floor(p);',
        '  vec2 f = fract(p);',
        '  vec2 u = f * f * (3.0 - 2.0 * f);',
        '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);',
        '}',
        'void main(){',
        '  vec2 uv = vUv;',
        '  vec2 p = uv - 0.5;',
        '  float d = length(p - uPointer * 0.08);',
        '  float grain = noise(uv * 170.0 + uTime * 0.12) * 0.035;',
        '  float wave = sin((p.x * 7.0 + p.y * 4.0) + uTime * 0.55) * 0.045;',
        '  vec3 ink = vec3(0.035, 0.039, 0.032);',
        '  vec3 paper = vec3(0.956, 0.937, 0.902);',
        '  vec3 ember = vec3(1.0, 0.355, 0.18);',
        '  vec3 color = ink;',
        '  color += paper * smoothstep(0.92, 0.08, d) * 0.12;',
        '  color += ember * smoothstep(0.62, 0.05, length(p + vec2(0.32, -0.18))) * 0.13;',
        '  color += vec3(wave + grain);',
        '  gl_FragColor = vec4(color, 1.0);',
        '}'
      ].join('\n')
    });

    var bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial);
    bg.frustumCulled = false;
    bg.renderOrder = -10;
    scene.add(bg);

    var loader = new THREE.TextureLoader();
    var textureUrls = (stage.getAttribute('data-textures') || '')
      .split(',')
      .map(function(item) { return item.trim(); })
      .filter(Boolean);
    var textures = textureUrls.map(function(url) {
      var texture = loader.load(url, coverTexture);
      texture.userData = { url: url };
      return texture;
    });

    var cardMeshes = textures.map(function(texture, index) {
      var material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: index === 0 ? 0.92 : 0.34,
        toneMapped: false
      });
      var mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 32, 32), material);
      mesh.position.z = -0.12 * index;
      mesh.renderOrder = 10 + index;
      mesh.rotation.z = (index - 1.2) * 0.035;
      mesh.userData = {
        index: index,
        baseY: 0,
        targetOpacity: index === 0 ? 0.92 : 0.34
      };
      cardGroup.add(mesh);
      return mesh;
    });

    var lineMaterial = new THREE.LineBasicMaterial({
      color: 0xf4efe6,
      transparent: true,
      opacity: 0.16
    });
    var lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1, -1, 0),
      new THREE.Vector3(1, -1, 0),
      new THREE.Vector3(1, 1, 0),
      new THREE.Vector3(-1, 1, 0),
      new THREE.Vector3(-1, -1, 0)
    ]);
    var frame = new THREE.Line(lineGeo, lineMaterial);
    frame.renderOrder = 30;
    cardGroup.add(frame);

    var layout = {
      isMobile: false,
      cardW: 4.25,
      cardH: 2.9,
      gapX: 0.3,
      gapY: 0.19
    };

    function resize() {
      var width = stage.clientWidth || window.innerWidth;
      var height = stage.clientHeight || window.innerHeight;
      var aspect = width / Math.max(height, 1);
      renderer.setSize(width, height, false);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      uniforms.uResolution.value.set(width, height);

      layout.isMobile = width < 760;
      layout.cardW = layout.isMobile ? 3.45 : 4.25;
      layout.cardH = layout.isMobile ? 2.35 : 2.9;
      layout.gapX = layout.isMobile ? 0.22 : 0.3;
      layout.gapY = layout.isMobile ? 0.16 : 0.19;

      var x = layout.isMobile ? 0.38 : 1.75;
      var yBase = layout.isMobile ? -0.35 : 0.02;

      cardGroup.position.set(x, yBase, 0);
      cardMeshes.forEach(function(mesh, index) {
        var offset = index - activeIndex;
        mesh.scale.set(layout.cardW, layout.cardH, 1);
        mesh.position.x = offset * layout.gapX;
        mesh.position.y = -offset * layout.gapY;
      });
      frame.scale.set(layout.cardW * 1.035, layout.cardH * 1.055, 1);
      frame.position.z = 0.06;
    }

    function render() {
      var elapsed = (performance.now() - startTime) * 0.001;
      pointer.x += (pointer.tx - pointer.x) * 0.045;
      pointer.y += (pointer.ty - pointer.y) * 0.045;
      uniforms.uTime.value = elapsed;
      uniforms.uPointer.value.set(pointer.x, -pointer.y);

      root.rotation.y += (pointer.x * 0.095 - root.rotation.y) * 0.045;
      root.rotation.x += (-pointer.y * 0.055 - root.rotation.x) * 0.045;
      cardGroup.position.y += (Math.sin(elapsed * 0.62) * 0.035 - cardGroup.position.y * 0.02) * 0.035;

      cardMeshes.forEach(function(mesh, index) {
        var offset = index - activeIndex;
        var targetOpacity = index === activeIndex ? 0.95 : Math.max(0.22, 0.45 - Math.abs(offset) * 0.08);
        mesh.material.opacity += (targetOpacity - mesh.material.opacity) * 0.07;
        mesh.position.x += ((offset * layout.gapX) - mesh.position.x) * 0.08;
        mesh.position.y += ((-offset * layout.gapY) - mesh.position.y) * 0.08;
        mesh.position.z += (((index === activeIndex ? 0.38 : -Math.abs(offset) * 0.18)) - mesh.position.z) * 0.07;
        mesh.rotation.z += (((offset * -0.04) + Math.sin(elapsed * 0.45 + index) * 0.01) - mesh.rotation.z) * 0.06;
      });

      renderer.render(scene, camera);
      window.requestAnimationFrame(render);
    }

    resize();
    window.addEventListener('resize', resize);
    render();

    if (gsapApi && ScrollTrigger) {
      gsapApi.to(cardGroup.position, {
        y: '-=0.72',
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    }
  }

  setupReveal();
  setupInteractions();
  setupGsapScroll();
  whenThreeReady().then(setupThree);
})();
