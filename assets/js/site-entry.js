const body = document.body;
const page = {
  home: body.classList.contains("home-index"),
  work: body.classList.contains("work-index"),
  caseStudy: body.classList.contains("case-study"),
  contact: body.classList.contains("ll-contact-page"),
  pitchdeck: body.classList.contains("ll-deck-page"),
  privacy: body.classList.contains("cookie-privacy-page"),
  error: body.classList.contains("ll-error-page"),
};

const inSiteShell = page.home || page.work || page.caseStudy || page.contact;
const hasSharedMotion = inSiteShell || page.pitchdeck || page.privacy || page.error;
const hasMenu = Boolean(document.querySelector("[data-ll-menu-toggle]"));
const hasWorkItems = Boolean(document.querySelector("[data-work-item]"));
const hasCookieUI = !page.error && !document.body.classList.contains("redirect-page");
const usesGsap = page.home || page.work || page.caseStudy || page.contact || page.pitchdeck || page.privacy || page.error;

document.documentElement.classList.replace("no-js", "js");

document.querySelectorAll('[data-work-detail][aria-hidden="true"]').forEach((detail) => {
  detail.inert = true;
});

function loadClassicScript(source) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = source;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Unable to load motion dependency: ${source}`));
    document.head.append(script);
  });
}

async function loadMotionDependencies() {
  if (!usesGsap) return;
  try {
    if (!window.gsap) await loadClassicScript(new URL("./libs/gsap.min.js", import.meta.url).href);
    if ((page.home || page.work || page.caseStudy || page.pitchdeck) && !window.ScrollTrigger) {
      await loadClassicScript(new URL("./libs/ScrollTrigger.min.js", import.meta.url).href);
    }
    if (window.gsap && window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);
  } catch (error) {
    console.warn("Motion dependencies could not be loaded; interactive features will use fallbacks.", error);
    throw error;
  }
}

async function initialize() {
  try {
    if (hasSharedMotion) {
      await import("./modules/motion-system.js").catch((e) => console.warn("Motion system failed to load:", e));
    }

    if (inSiteShell && document.querySelector(".ll-footer, .cs-footer, .lwa-footer")) {
      await import("./modules/footer-wordmark.js").catch((e) => console.warn("Footer wordmark failed to load:", e));
    }

    if (page.home || page.work || page.caseStudy) {
      await import("./modules/media-reveals.js").catch((error) => {
        console.warn("Media scroll reveals failed to load.", error);
      });
      await import("./modules/media-ripple.js").catch((error) => {
        console.warn("Media ripple effect failed to load.", error);
      });
    }

    await import("./modules/constants.js").catch((e) => console.warn("Constants failed to load:", e));
    await import("./modules/storage.js").catch((e) => console.warn("Storage module failed to load:", e));
    await import("./modules/feature-detection.js").catch((e) => console.warn("Feature detection failed to load:", e));
    await import("./modules/sound-system.js").catch((e) => console.warn("Sound system failed to load:", e));

    if (page.caseStudy) {
      await import("./pages/case-study-ui.js").catch((e) => console.warn("Case study UI failed to load:", e));
      if (body.classList.contains("case-study--kicksjoint")) {
        await import("./pages/kicksjoint-ui.js").catch((e) => console.warn("Kicksjoint UI failed to load:", e));
      }
      if (body.classList.contains("case-study--tyol")) {
        await import("./components/replay.js").catch((e) => console.warn("TYOL logo controls failed to load:", e));
      }
    }

    if (usesGsap) await import("./modules/magnetic-controls.js").catch((e) => console.warn("Magnetic controls failed to load:", e));

    if (document.querySelector("svg.ll-icon[class*='ll-icon--arrow-'], .ll-button__icon-panel > svg")) {
      await import("./modules/gridlite-arrow-glyphs.js").catch((e) => console.warn("Arrow glyphs failed to load:", e));
    }

    try {
      await loadMotionDependencies();
    } catch (error) {
      console.warn("GSAP is unavailable; interactive features will use their built-in fallbacks.", error);
    }

    if (hasSharedMotion) {
      await import("./modules/liquid-glass.js").catch((error) => {
        console.warn("Liquid glass failed to load; using the CSS fallback.", error);
      });
      if (inSiteShell || page.pitchdeck) {
        await import("./elastic-cursor.js").catch((e) => console.warn("Elastic cursor failed to load:", e));
      }
      if (inSiteShell) {
        await import("./modules/pitchdeck-overlay.js").catch((e) => console.warn("Pitchdeck overlay failed to load:", e));
        if (hasMenu) await import("./pages/lamalama-ui.js").catch((e) => console.warn("Lamalama UI failed to load:", e));
      }
      if (page.privacy || page.error) {
        await import("./site-motion.js").catch((e) => console.warn("Page motion failed to load:", e));
      }
    }

    if (hasCookieUI) await import("./cookie-consent.js").catch((e) => console.warn("Cookie consent failed to load:", e));

    if (page.home) {
      await import("./pages/home-loader.js").catch((e) => console.warn("Home loader failed to load:", e));
      await import("./pages/home-ui.js").catch((e) => console.warn("Home UI failed to load:", e));
      await import("./pages/home-footer-webgl.js").catch((e) => console.warn("Home footer WebGL failed to load:", e));
    }
    if (hasWorkItems) await import("./pages/work-lama.js").catch((e) => console.warn("Work lama failed to load:", e));
    if (page.contact) await import("./pages/contact-form.js").catch((e) => console.warn("Contact form failed to load:", e));
    if (page.pitchdeck) await import("./pages/pitchdeck.js").catch((e) => console.warn("Pitchdeck failed to load:", e));
  } catch (error) {
    console.error("Site features could not be initialized.", error);
    document.body.classList.add("ll-js-error");
  }
}

initialize();
