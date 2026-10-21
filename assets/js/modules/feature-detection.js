(function () {
  "use strict";

  /**
   * Lawani St. Feature Detection
   * ========================================
   * Comprehensive feature detection with graceful degradation.
   * Provides a unified API for checking browser capabilities.
   */

  var features = {
    // Core APIs
    intersectionObserver: false,
    requestAnimationFrame: false,
    passiveEvents: false,
    webAudio: false,
    webGL: false,
    webGL2: false,

    // Storage
    localStorage: false,
    sessionStorage: false,

    // Performance
    performanceNow: false,
    performanceObserver: false,

    // Modern JavaScript
    asyncAwait: false,
    arrowFunctions: false,
    templateLiterals: false,
    destructuring: false,
    spread: false,
    classes: false,
    modules: false,

    // CSS features
    cssVariables: false,
    cssGrid: false,
    cssFlexbox: false,
    cssCustomProperties: false,
    cssBackdropFilter: false,
    cssClipPath: false,
    cssMixBlendMode: false,

    // Input
    touch: false,
    pointerEvents: false,
    hover: false,

    // Video
    video: false,
    videoAutoplay: false,
    videoPlaysInline: false,

    // Images
    webp: false,
    avif: false,

    // Device
    reducedMotion: false,
    highContrast: false,
    darkMode: false,
    deviceMemory: false,
    hardwareConcurrency: false,
  };

  function detectIntersectionObserver() {
    features.intersectionObserver = "IntersectionObserver" in window;
  }

  function detectRequestAnimationFrame() {
    features.requestAnimationFrame = "requestAnimationFrame" in window;
  }

  function detectPassiveEvents() {
    var supportsPassive = false;
    try {
      var opts = Object.defineProperty({}, "passive", {
        get: function () { supportsPassive = true; }
      });
      window.addEventListener("test", null, opts);
      window.removeEventListener("test", null, opts);
    } catch (e) {}
    features.passiveEvents = supportsPassive;
  }

  function detectWebAudio() {
    features.webAudio = !!(window.AudioContext || window.webkitAudioContext);
  }

  function detectWebGL() {
    try {
      var canvas = document.createElement("canvas");
      var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      features.webGL = !!gl;
      features.webGL2 = !!(canvas.getContext("webgl2"));
    } catch (e) {
      features.webGL = false;
      features.webGL2 = false;
    }
  }

  function detectStorage() {
    try {
      localStorage.setItem("__test__", "test");
      localStorage.removeItem("__test__");
      features.localStorage = true;
    } catch (e) {
      features.localStorage = false;
    }

    try {
      sessionStorage.setItem("__test__", "test");
      sessionStorage.removeItem("__test__");
      features.sessionStorage = true;
    } catch (e) {
      features.sessionStorage = false;
    }
  }

  function detectPerformance() {
    features.performanceNow = "performance" in window && "now" in window.performance;
    features.performanceObserver = "PerformanceObserver" in window;
  }

  function detectJavaScriptFeatures() {
    features.asyncAwait = typeof Promise !== "undefined" && typeof (async function () {}).constructor === "Function";
    features.arrowFunctions = (() => {}) instanceof Function;
    features.templateLiterals = `test` === "test";
    features.destructuring = (function () { try { var {a} = {a: 1}; return a === 1; } catch (e) { return false; } })();
    features.spread = (function () { try { return [...[1,2,3]].length === 3; } catch (e) { return false; } })();
    features.classes = (function () { try { class Test {}; return typeof Test === "function"; } catch (e) { return false; } })();

    features.modules = false;
  }

  function detectCSSFeatures() {
    features.cssVariables = CSS.supports("--test", "var(--test)");
    features.cssGrid = CSS.supports("display", "grid");
    features.cssFlexbox = CSS.supports("display", "flex");
    features.cssCustomProperties = CSS.supports("--test", "red");
    features.cssBackdropFilter = CSS.supports("backdrop-filter", "blur(10px)");
    features.cssClipPath = CSS.supports("clip-path", "circle(50%)");
    features.cssMixBlendMode = CSS.supports("mix-blend-mode", "multiply");
  }

  function detectInput() {
    features.touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    features.pointerEvents = "PointerEvent" in window;
    features.hover = window.matchMedia("(hover: hover)").matches;
  }

  function detectVideo() {
    features.video = !!document.createElement("video").canPlayType;
    features.videoAutoplay = "autoplay" in document.createElement("video");
    features.videoPlaysInline = "playsInline" in document.createElement("video");
  }

  function detectImageFormats() {
    features.webp = document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp") === 0;
    features.avif = document.createElement("canvas").toDataURL("image/avif").indexOf("data:image/avif") === 0;
  }

  function detectPreferences() {
    features.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    features.highContrast = window.matchMedia("(prefers-contrast: high)").matches;
    features.darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    features.deviceMemory = "deviceMemory" in navigator;
    features.hardwareConcurrency = "hardwareConcurrency" in navigator;
  }

  function runDetection() {
    detectIntersectionObserver();
    detectRequestAnimationFrame();
    detectPassiveEvents();
    detectWebAudio();
    detectWebGL();
    detectStorage();
    detectPerformance();
    detectJavaScriptFeatures();
    detectCSSFeatures();
    detectInput();
    detectVideo();
    detectImageFormats();
    detectPreferences();
  }

  runDetection();

  window.LawaniFeatures = {
    supported: function (feature) {
      return features[feature] === true;
    },
    unsupported: function (feature) {
      return features[feature] === false;
    },
    get: function (feature) {
      return features[feature];
    },
    all: function () {
      return Object.assign({}, features);
    },
    has: function (featureList) {
      return featureList.every(function (feature) {
        return features[feature] === true;
      });
    },
    any: function (featureList) {
      return featureList.some(function (feature) {
        return features[feature] === true;
      });
    }
  };
})();
