import liquidGL from "liquid-gl";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const lenses = document.querySelectorAll(".ll-nav-dock, .ll-contact-dock");

if (!reduceMotion && lenses.length) {
  try {
    const effect = liquidGL({
      target: ".ll-nav-dock, .ll-contact-dock",
      snapshot: "body",
      engine: "auto",
      resolution: 1.25,
      refraction: 0.035,
      aberration: 0.018,
      bevelDepth: 0.14,
      bevelWidth: 0.24,
      frost: 1.2,
      shadow: true,
      specular: true,
      reveal: "fade",
      interaction: "fluid",
      interactionStrength: 1.2,
      interactionRadius: 0.9,
      interactionViscosity: 0.78,
      tint: "rgba(255, 255, 255, 0.035)",
      on: {
        init() {
          document.documentElement.classList.add("liquid-gl-ready");
        },
      },
    });

    window.addEventListener("pagehide", () => effect.destroy(), { once: true });
  } catch (error) {
    console.warn("Liquid glass could not start; using the CSS glass fallback.", error);
  }
}
