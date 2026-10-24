(function () {
  "use strict";

  function cssDuration(name, fallback) {
    if (!document.documentElement || typeof window.getComputedStyle !== "function") return fallback;
    var value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    var amount = parseFloat(value);
    if (!Number.isFinite(amount)) return fallback;
    return value.indexOf("ms") !== -1 ? amount : amount * 1000;
  }

  function cssEasing(name, fallback) {
    if (!document.documentElement || typeof window.getComputedStyle !== "function") return fallback;
    return window.getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  /**
   * Lawani St. Constants
   * ========================================
   * Centralized configuration values for motion, thresholds, and timing.
   * Extracted magic numbers for maintainability and consistency.
   */

  window.LawaniConstants = {
    // Viewport and scroll thresholds
    SCROLL: {
      HERO_PAST_THRESHOLD: 0.55,        // Percentage of hero height to trigger "past hero" state
      HERO_LINE_SCALE_MIN: 0.18,         // Minimum hero line scale
      HERO_LINE_SCALE_MAX: 0.82,        // Maximum hero line scale reduction
      NAV_NOTE_THRESHOLD: 0.46,         // Viewport percentage threshold for nav note updates
      SECTION_REVEAL_THRESHOLD: 0.08,   // Intersection threshold for section reveals
      SERVICE_LINK_THRESHOLD: [0.25, 0.5, 0.75], // Multi-threshold for service link activation
      SERVICE_LINK_ROOT_MARGIN: "-18% 0px -52% 0px", // Root margin for service link observer
      PROJECT_REVEAL_THRESHOLD: 0.06,    // Threshold for project reveal
      PROJECT_REVEAL_ROOT_MARGIN: "0px 0px -8%", // Root margin for project reveal
      VIDEO_INTERSECTION_THRESHOLD: 0.08, // Threshold for video play/pause
      VIDEO_ROOT_MARGIN: "80px 0px",     // Root margin for video observer
      CASE_REVEAL_THRESHOLD: 0.1,       // Threshold for case study reveals
      CASE_REVEAL_ROOT_MARGIN: "0px 0px -10% 0px", // Root margin for case study reveals
      HERO_SCROLL_THRESHOLD: 0.72,      // Percentage for hero scroll effect
      HERO_ROTATION_THRESHOLD: 0.92,    // Threshold for hero rotation effect
    },

    // Animation durations (ms)
    DURATION: {
      MICRO: cssDuration("--motion-fast", 180),
      CONTROL: cssDuration("--motion-control", 240),
      COMPONENT: cssDuration("--motion-component", 420),
      REVEAL: cssDuration("--motion-reveal", 760),
      EXPAND: cssDuration("--motion-expand", 640),
      PAGE_COVER: cssDuration("--motion-page-cover", 540),
      PAGE_REVEAL: cssDuration("--motion-page-reveal", 680),
      BUTTON_SCRAMBLE: 720,             // Button text scramble effect
      OVERLAY_EXIT: 520,                // Overlay exit animation
      OVERLAY_OPEN_DELAY: 400,           // Delay before overlay activation
      OVERLAY_FOCUS_DELAY: 120,          // Delay before overlay focus
      MENU_CLOSE_ON_RESIZE: 820,         // Viewport width to auto-close menu
      SCROLL_OFFSET_DESKTOP: 92,         // Scroll offset for expanded projects (desktop)
      SCROLL_OFFSET_MOBILE: 72,          // Scroll offset for expanded projects (mobile)
      HERO_LINE_HOLD: 520,               // Logo hold duration in loader
      HERO_EXIT: 560,                    // Hero exit duration
      HERO_MINIMUM: 650,                 // Minimum hero loader duration
      HERO_TIMEOUT: 1400,                // Hero loader timeout
      HERO_UPDATE_INTERVAL: 50,          // Hero update interval
      REVEAL_DELAY_INCREMENT: 70,        // Incremental delay for reveal items
      REVEAL_DELAY_MAX: 280,             // Maximum reveal delay
      FOOTER_MARQUEE_DESKTOP: 280,       // Footer marquee parallax distance (desktop)
      FOOTER_MARQUEE_MOBILE: 160,        // Footer marquee parallax distance (mobile)
      FOOTER_COPY_STAGGER: 0.07,         // Footer copy stagger (seconds)
      FOOTER_COPY_DELAY: 0.06,          // Footer copy delay (seconds)
      FOOTER_COPY_DURATION: 0.22,       // Footer copy animation duration (seconds)
      FOOTER_COPY_Y: 28,                 // Footer copy Y offset
    },

    // Easing functions (CSS cubic-bezier format)
    EASING: {
      OUT: cssEasing("--motion-ease-out", "cubic-bezier(0.16, 1, 0.3, 1)"),
      IN_OUT: cssEasing("--motion-ease-in-out", "cubic-bezier(0.65, 0, 0.35, 1)"),
      SWEEP_IN: cssEasing("--motion-ease-sweep-in", "cubic-bezier(0.76, 0, 0.24, 1)"),
      SWEEP_OUT: cssEasing("--motion-ease-sweep-out", "cubic-bezier(0.16, 1, 0.3, 1)"),
      GSAP_OUT: "power3.out",
      GSAP_IN_OUT: "power2.inOut",
    },

    // Breakpoints (px)
    BREAKPOINT: {
      MENU_DESKTOP: 821,                 // Desktop menu breakpoint
      MENU_MOBILE: 820,                  // Mobile menu breakpoint
      HERO_EFFECT: 820,                  // Hero scroll effect breakpoint
      FOOTER_MOBILE: 560,                // Footer mobile breakpoint
      TABLET: 1024,                      // Tablet breakpoint
    },

    // Layout dimensions (px)
    LAYOUT: {
      MENU_WIDTH: 610,                   // Maximum menu width
      MENU_MIN_WIDTH: 500,               // Minimum menu width
      NAV_DOCK_HEIGHT: 60,               // Navigation dock height (control-height)
      CONTACT_DOCK_WIDTH: 220,           // Contact dock width
      GUTTER: 24,                        // Default gutter spacing
      HERO_MIN_HEIGHT: 360,              // Minimum hero height
      CASE_MIN_HEIGHT: 230,              // Minimum case row height
      CASE_DETAIL_MIN_HEIGHT: 266,       // Minimum case detail height
      CAPABILITIES_PADDING: 80,          // Capabilities section padding (min)
      CAPABILITIES_PADDING_MAX: 140,     // Capabilities section padding (max)
      FOOTER_PADDING: 80,                // Footer padding (min)
      FOOTER_PADDING_MAX: 140,           // Footer padding (max)
      FOOTER_MIN_HEIGHT: 540,            // Footer minimum height
      FOOTER_COPY_OFFSET: 225,          // Footer copy grid offset
    },

    // Drag thresholds
    DRAG: {
      SCROLL_THRESHOLD: 4,               // Minimum delta to trigger drag scroll
      SCROLL_MULTIPLIER: 1.15,           // Drag scroll multiplier
      RAIL_THRESHOLD: 6,                 // Minimum delta to trigger rail interaction
    },

    // WebGL and canvas
    WEBGL: {
      FOOTER_LOAD_MARGIN: 360,           // Margin to load Three.js
      FOOTER_RENDER_MARGIN: 240,        // Margin to start rendering
      FOOTER_CHECK_MARGIN: 360,          // Margin to check footer visibility
      PIXEL_RATIO_MAX: 1.25,             // Maximum device pixel ratio
      RENDER_INTERVAL: 32,               // Minimum render interval (ms)
      DEVICE_MEMORY_THRESHOLD: 2,        // Minimum device memory for WebGL
    },

    // Audio
    AUDIO: {
      FREQUENCY_START: 660,              // UI sound start frequency (Hz)
      FREQUENCY_END: 440,                // UI sound end frequency (Hz)
      DURATION: 0.065,                   // UI sound duration (s)
      GAIN_START: 0.0001,                // UI sound start gain
      GAIN_PEAK: 0.035,                  // UI sound peak gain
      GAIN_PEAK_TIME: 0.008,             // Time to reach peak gain (s)
      GAIN_RAMP_DOWN: 0.06,               // Time to ramp down gain (s)
    },

    // Intersection observer options
    OBSERVER: {
      ROOT_MARGIN_DEFAULT: "0px 0px -8% 0px",
      THRESHOLD_DEFAULT: 0.08,
    },

    // Animation timing
    ANIMATION: {
      HERO_FADE_IN_DURATION: 1,          // Hero fade in duration (s)
      HERO_FADE_IN_DELAY: 0.3,           // Hero fade in delay (s)
      HERO_FADE_IN_EASING: "ease-out",
      VIDEO_SCALE: 1.1,                  // Video scale transform
      VIDEO_TRANSITION: 0.1,             // Video transition duration (s)
    },
  };
})();
