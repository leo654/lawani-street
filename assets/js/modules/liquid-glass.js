import liquidGL from "../../../node_modules/liquid-gl/liquidGL.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileViewport = window.matchMedia("(max-width: 820px), (pointer: coarse)");
const glassTargetSelector = ".ll-nav-dock, .ll-contact-dock__primary";
const hasGlassTargets = Boolean(document.querySelector(glassTargetSelector));
const effects = [];

function destroyEffects() {
  effects.splice(0).forEach((effect) => {
    if (Array.isArray(effect)) {
      effect.forEach((instance) => instance?.destroy?.());
      return;
    }
    effect?.destroy?.();
  });
  document.documentElement.classList.remove("liquid-gl-ready");
}

function createLens(target, zIndex, settings = {}) {
  if (!document.querySelector(target)) return;
  const instances = liquidGL({
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
        if (!mobileViewport.matches) document.documentElement.classList.add("liquid-gl-ready");
      },
    },
  });
  if (Array.isArray(instances)) effects.push(...instances);
  else if (instances) effects.push(instances);
}

function syncLiquidGlass() {
  destroyEffects();
  if (reduceMotion.matches || !hasGlassTargets || mobileViewport.matches) return;

  try {
    createLens(glassTargetSelector, 100, {
      interactionStrength: 1.2,
      interactionRadius: 0.9,
    });
  } catch (error) {
    destroyEffects();
    console.warn("Liquid glass could not start; using the CSS glass fallback.", error);
  }
}

syncLiquidGlass();
if (typeof mobileViewport.addEventListener === "function") {
  mobileViewport.addEventListener("change", syncLiquidGlass);
} else {
  mobileViewport.addListener(syncLiquidGlass);
}
if (typeof reduceMotion.addEventListener === "function") {
  reduceMotion.addEventListener("change", syncLiquidGlass);
} else {
  reduceMotion.addListener(syncLiquidGlass);
}
window.addEventListener("pageshow", (event) => {
  if (event.persisted) syncLiquidGlass();
});
window.addEventListener("pagehide", destroyEffects);
