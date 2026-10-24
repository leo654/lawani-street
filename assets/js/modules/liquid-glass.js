import liquidGL from "liquid-gl";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const navLensSelector = ".ll-nav-dock, .ll-contact-dock";
const mediaLensSelector = [
  "body.home-index .ll-home-hero__media",
  "body.home-index .ll-manifesto__gallery figure",
  "body.home-index .ll-manifesto__portrait",
  "body.home-index .lwa-project__gallery figure:has(img, video)",
  ".case-study .cs-story__media",
  ".case-study .cs-gallery figure:has(img, video)",
  ".work-index .lwa-project__gallery figure:has(img, video)",
  ".ll-menu-reel",
].join(", ");
const hasNavLenses = document.querySelector(navLensSelector);
const hasMediaLenses = document.querySelector(mediaLensSelector);

if (!reduceMotion && (hasNavLenses || hasMediaLenses)) {
  try {
    const effects = [];

    function createLens(target, zIndex, settings = {}) {
      if (!document.querySelector(target)) return;
      effects.push(liquidGL({
        target,
        snapshot: "body",
        engine: "auto",
        resolution: 1.25,
        zIndex,
        refraction: 0.045,
        aberration: 0.02,
        bevelDepth: 0.14,
        bevelWidth: 0.24,
        frost: 0.7,
        shadow: true,
        specular: true,
        reveal: "fade",
        interaction: "fluid",
        interactionStrength: 1.8,
        interactionRadius: 1.25,
        interactionViscosity: 0.78,
        tint: "rgba(255, 255, 255, 0.035)",
        ...settings,
        on: {
          init() {
            document.documentElement.classList.add("liquid-gl-ready");
          },
        },
      }));
    }

    createLens(navLensSelector, 100, {
      interactionStrength: 1.2,
      interactionRadius: 0.9,
    });
    createLens(mediaLensSelector, 1);

    window.addEventListener("pagehide", () => effects.forEach((effect) => effect.destroy()), { once: true });
  } catch (error) {
    console.warn("Liquid glass could not start; using the CSS glass fallback.", error);
  }
}
