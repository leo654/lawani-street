/**
 * Interactive Background - Premium WebGL Surface Deformation
 * Creates a responsive physical surface that subtly deforms based on pointer interaction
 */

(function () {
  "use strict";

  function log() {}

  function initInteractiveBackground() {
    try {
      // Check for WebGL support
      if (!window.WebGLRenderingContext) {
        log("WebGL not supported");
        return;
      }

      // Check for reduced motion preference
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        log("Reduced motion preferred - skipping interactive background");
        return;
      }

      // Check if already initialized
      if (document.querySelector(".interactive-background")) {
        return;
      }

      // Configuration
      const config = {
        pointerLerp: 0.055,
        interactionRadius: 0.25,
        interactionStrength: 0.08,
        ambientSpeed: 0.02,
        noiseStrength: 0.03,
        velocityMultiplier: 0.35,
        velocityDecay: 0.90,
        trailDecay: 0.93,
        ghostInfluence: 0.25,
        ghostLag: 0.04,
        maxPixelRatio: 1.5,
        initDuration: 1200,
        settlingDuration: 1000
      };

      // State
      const state = {
        width: 0,
        height: 0,
        pixelRatio: 1,
        time: 0,
        initTime: 0,
        targetMouse: { x: 0.5, y: 0.5 },
        currentMouse: { x: 0.5, y: 0.5 },
        ghostMouse: { x: 0.5, y: 0.5 },
        previousMouse: { x: 0.5, y: 0.5 },
        velocity: 0,
        pointerDirection: { x: 0, y: 0 },
        isPointerActive: false,
        isPointerInViewport: false,
        isAnimating: false,
        isDestroyed: false,
        lastPointerTime: 0
      };

      // Three.js setup
      let scene, camera, renderer, material, geometry, videoTexture;
      let animationFrame = 0;

      // Vertex shader
      const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;

      // Fragment shader - media sampling with subtle distortion
      const fragmentShader = `
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        uniform vec2 uGhostMouse;
        uniform vec2 uPointerDirection;
        uniform float uVelocity;
        uniform float uStrength;
        uniform float uRadius;
        uniform float uAspectRatio;
        uniform float uInitProgress;
        uniform float uGhostInfluence;

        varying vec2 vUv;

        // Simplex noise function
        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod(i, 289.0);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m;
          m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x = a0.x * x0.x + h.x * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          vec2 uv = vUv;
          
          // Correct aspect ratio for interaction
          vec2 aspectUV = uv;
          aspectUV.x *= uAspectRatio;
          
          vec2 mouseAspect = uMouse;
          mouseAspect.x *= uAspectRatio;
          
          vec2 ghostAspect = uGhostMouse;
          ghostAspect.x *= uAspectRatio;
          
          // Calculate distance to mouse
          float dist = distance(aspectUV, mouseAspect);
          float ghostDist = distance(aspectUV, ghostAspect);
          
          // Create subtle influence field
          float influence = smoothstep(uRadius, 0.0, dist);
          
          // Add very subtle organic noise to influence
          float noise = snoise(uv * 0.8 + uTime * 0.05) * 0.5 + 0.5;
          influence *= (0.7 + noise * 0.3);
          
          // Ghost influence
          float ghostInfluence = smoothstep(uRadius * 1.15, 0.0, ghostDist) * uGhostInfluence;
          
          // Directional stretch based on velocity
          float directionalStretch = length(uPointerDirection) * uVelocity * 0.4;
          
          // Calculate distortion amounts
          float distortion = influence * uStrength * (1.0 + uVelocity * 2.5);
          float ghostDistortion = ghostInfluence * uStrength * 0.5;
          
          // Apply directional deformation
          vec2 directionOffset = uPointerDirection * directionalStretch * 0.12;
          
          // Apply distortion to UV coordinates
          vec2 distortedUV = uv;
          
          // Main directional distortion
          distortedUV += directionOffset * influence;
          distortedUV += vec2(sin(uv.y * 4.0 + uTime * 0.08), cos(uv.x * 4.0 + uTime * 0.06)) * distortion * 0.025;
          
          // Ghost distortion
          distortedUV += vec2(sin(uv.y * 3.0 + uTime * 0.05), cos(uv.x * 3.0 + uTime * 0.04)) * ghostDistortion * 0.02;
          
          // Very subtle ambient motion
          float ambientNoise = snoise(distortedUV * 0.5 + uTime * 0.015);
          distortedUV += vec2(ambientNoise) * 0.004 * uInitProgress;
          
          // Sample the video texture with distorted coordinates
          vec4 texColor = texture2D(uTexture, distortedUV);
          
          // Add very subtle grain
          float grain = snoise(uv * 60.0 + uTime * 0.3) * 0.01;
          texColor.rgb += grain * 0.05;
          
          // Subtle edge fade for smooth transition
          float edgeFade = 1.0;
          edgeFade *= smoothstep(0.0, 0.15, uv.x);
          edgeFade *= smoothstep(1.0, 0.85, uv.x);
          edgeFade *= smoothstep(0.0, 0.1, uv.y);
          edgeFade *= smoothstep(1.0, 0.9, uv.y);
          
          texColor.rgb *= edgeFade;
          
          // Initialize with fade
          texColor.rgb *= uInitProgress;
          
          gl_FragColor = texColor;
        }
      `;

      // Create video texture from hero video
      function createVideoTexture() {
        const video = document.querySelector('video[data-ll-hero-video]');
        if (!video) {
          log("Hero video not found - using fallback");
          return null;
        }
        
        videoTexture = new THREE.VideoTexture(video);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.format = THREE.RGBFormat;
        
        return videoTexture;
      }

      // Create scene
      function createScene() {
        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      }

      // Create renderer
      function createRenderer() {
        renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: true,
          powerPreference: "high-performance"
        });
        
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.maxPixelRatio));
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        const canvas = renderer.domElement;
        canvas.className = "interactive-background";
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.position = "fixed";
        canvas.style.inset = "0";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = "0";
        
        document.body.insertBefore(canvas, document.body.firstChild);
      }

      // Create geometry and material
      function createMaterial() {
        geometry = new THREE.PlaneGeometry(2, 2);
        
        const texture = createVideoTexture();
        
        material = new THREE.ShaderMaterial({
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          uniforms: {
            uTexture: { value: texture },
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uGhostMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uPointerDirection: { value: new THREE.Vector2(0, 0) },
            uVelocity: { value: 0 },
            uStrength: { value: config.interactionStrength },
            uRadius: { value: config.interactionRadius },
            uAspectRatio: { value: window.innerWidth / window.innerHeight },
            uInitProgress: { value: 0 },
            uGhostInfluence: { value: config.ghostInfluence }
          }
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
      }

      // Update pointer position
      function updatePointer(x, y) {
        state.previousMouse.x = state.targetMouse.x;
        state.previousMouse.y = state.targetMouse.y;
        
        state.targetMouse.x = x / window.innerWidth;
        state.targetMouse.y = 1.0 - (y / window.innerHeight);
        
        state.isPointerActive = true;
        state.isPointerInViewport = true;
        state.lastPointerTime = performance.now();
      }

      // Calculate velocity and direction
      function updateVelocity() {
        const dx = state.targetMouse.x - state.currentMouse.x;
        const dy = state.targetMouse.y - state.currentMouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        state.velocity = state.velocity * config.velocityDecay + distance * config.velocityMultiplier;
        
        // Calculate normalized direction
        if (distance > 0.0001) {
          state.pointerDirection.x = dx / distance;
          state.pointerDirection.y = dy / distance;
        }
      }

      // Smooth mouse position
      function smoothMouse() {
        state.currentMouse.x += (state.targetMouse.x - state.currentMouse.x) * config.pointerLerp;
        state.currentMouse.y += (state.targetMouse.y - state.currentMouse.y) * config.pointerLerp;
        
        // Ghost mouse lags further behind
        state.ghostMouse.x += (state.currentMouse.x - state.ghostMouse.x) * config.ghostLag;
        state.ghostMouse.y += (state.currentMouse.y - state.ghostMouse.y) * config.ghostLag;
      }

      // Handle resize
      function handleResize() {
        state.width = window.innerWidth;
        state.height = window.innerHeight;
        state.pixelRatio = Math.min(window.devicePixelRatio, config.maxPixelRatio);
        
        renderer.setPixelRatio(state.pixelRatio);
        renderer.setSize(state.width, state.height);
        
        material.uniforms.uResolution.value.set(state.width, state.height);
        material.uniforms.uAspectRatio.value = state.width / state.height;
      }

      // Animation loop
      function animate() {
        if (state.isDestroyed) return;
        
        const now = performance.now();
        const delta = (now - state.initTime) / 1000;
        state.time = delta;
        
        // Smooth initialization
        state.initProgress = Math.min(delta / (config.initDuration / 1000), 1.0);
        
        // Update pointer
        smoothMouse();
        updateVelocity();
        
        // Calculate settling - decay velocity and direction when pointer stops
        const timeSinceLastPointer = now - state.lastPointerTime;
        const settlingFactor = Math.min(timeSinceLastPointer / config.settlingDuration, 1.0);
        
        // Gradually reduce influence when settling
        const currentStrength = config.interactionStrength * (1.0 - settlingFactor * 0.7);
        
        // Update uniforms
        material.uniforms.uTime.value = state.time;
        material.uniforms.uMouse.value.set(state.currentMouse.x, state.currentMouse.y);
        material.uniforms.uGhostMouse.value.set(state.ghostMouse.x, state.ghostMouse.y);
        material.uniforms.uPointerDirection.value.set(state.pointerDirection.x, state.pointerDirection.y);
        material.uniforms.uVelocity.value = state.velocity;
        material.uniforms.uStrength.value = currentStrength;
        material.uniforms.uInitProgress.value = state.initProgress;
        
        // Decay velocity and direction when pointer inactive
        if (!state.isPointerActive || timeSinceLastPointer > 100) {
          state.velocity *= config.velocityDecay;
          state.pointerDirection.x *= 0.95;
          state.pointerDirection.y *= 0.95;
        }
        
        renderer.render(scene, camera);
        animationFrame = requestAnimationFrame(animate);
      }

      // Event listeners
      function bindEvents() {
        window.addEventListener("pointermove", (e) => {
          updatePointer(e.clientX, e.clientY);
        }, { passive: true });
        
        window.addEventListener("touchmove", (e) => {
          if (e.touches.length > 0) {
            updatePointer(e.touches[0].clientX, e.touches[0].clientY);
          }
        }, { passive: true });
        
        window.addEventListener("resize", handleResize);
        
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) {
            if (animationFrame) {
              cancelAnimationFrame(animationFrame);
              animationFrame = 0;
            }
          } else {
            if (!animationFrame && !state.isDestroyed) {
              animate();
            }
          }
        });
        
        // Handle pointer leaving viewport - gradual decay
        document.addEventListener("pointerleave", () => {
          state.isPointerInViewport = false;
          // Don't immediately set isPointerActive to false - let it settle naturally
        });
        
        document.addEventListener("pointerenter", () => {
          state.isPointerInViewport = true;
          state.isPointerActive = true;
        });
      }

      // Initialize
      function init() {
        createScene();
        createRenderer();
        createMaterial();
        handleResize();
        bindEvents();
        
        state.initTime = performance.now();
        animate();
      }

      // Cleanup
      function destroy() {
        state.isDestroyed = true;
        
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        }
        
        if (videoTexture) {
          videoTexture.dispose();
          videoTexture = null;
        }
        
        if (renderer) {
          renderer.dispose();
          const canvas = renderer.domElement;
          if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
        }
        
        if (geometry) geometry.dispose();
        if (material) material.dispose();
      }

      // Start
      init();
      
      // Expose cleanup function
      window.__interactiveBackground = { destroy };
      
    } catch (err) {
      log("Interactive background error: " + (err && err.message ? err.message : String(err)));
    }
  }

  // Initialize when DOM is ready
  if (document.body) {
    initInteractiveBackground();
  } else {
    document.addEventListener("DOMContentLoaded", initInteractiveBackground, { once: true });
  }
})();

