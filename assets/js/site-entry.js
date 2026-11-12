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
    if (hasSharedMotion && !window.ScrollTrigger) {
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
    await import("./modules/feature-detection.js").catch((e) => console.warn("Feature detection failed to load:", e));

    try {
      await loadMotionDependencies();
    } catch (error) {
      console.warn("GSAP is unavailable; interactive features will use their built-in fallbacks.", error);
    }

    if (hasSharedMotion) {
      await import("./modules/motion-system.js?v=20261112-clean").catch((e) => console.warn("Motion system failed to load:", e));
    }

    // Preloader, page intros, split text, cursor, parallax and the rest of the motion language.
    await import("./modules/motion-kit.js?v=20261112-clean").catch((e) => {
      console.warn("Motion kit failed to load:", e);
      document.documentElement.classList.remove("mk-preloading", "mk-arriving", "mk-intro-pending");
    });

    if ((inSiteShell || body.classList.contains("ll-site-footer-page")) && document.querySelector(".ll-footer, .cs-footer, .lwa-footer")) {
      await import("./modules/footer-wordmark.js?v=20261112-clean").catch((e) => console.warn("Footer wordmark failed to load:", e));
    }

    await import("./modules/constants.js?v=20261112-clean").catch((e) => console.warn("Constants failed to load:", e));
    await import("./modules/storage.js").catch((e) => console.warn("Storage module failed to load:", e));
    await import("./modules/sound-system.js").catch((e) => console.warn("Sound system failed to load:", e));
    if (document.querySelector("[data-ll-sound-wave]")) await import("./modules/sound-wave.js?v=20261112-clean").catch((e) => console.warn("Sound wave failed to load:", e));

    if (page.caseStudy) {
      await import("./pages/case-study-ui.js?v=20261112-clean").catch((e) => console.warn("Case study UI failed to load:", e));
      if (body.classList.contains("case-study--kicksjoint")) {
        await import("./pages/kicksjoint-ui.js").catch((e) => console.warn("Kicksjoint UI failed to load:", e));
      }
      if (body.classList.contains("case-study--tyol")) {
        await import("./components/replay.js").catch((e) => console.warn("TYOL logo controls failed to load:", e));
      }
    }

    if (document.querySelector("svg.ll-icon[class*='ll-icon--arrow-'], .ll-button__icon-panel > svg")) {
      await import("./modules/gridlite-arrow-glyphs.js?v=20261112-clean").catch((e) => console.warn("Arrow glyphs failed to load:", e));
    }

    if (hasSharedMotion) {
      // WebGL liquid glass re-uploaded a full-page texture every frame (the main
      // cause of scroll jank on the home page); the CSS glass fallback is used instead.
      // Privacy and 404 carry the same nav dock + menu as the rest of the site, so they load the menu code too.
      if (inSiteShell || hasMenu) {
        await import("./modules/pitchdeck-overlay.js?v=20261112-clean").catch((e) => console.warn("Pitchdeck overlay failed to load:", e));
        if (hasMenu) await import("./pages/lamalama-ui.js?v=20261112-clean").catch((e) => console.warn("Lamalama UI failed to load:", e));
      }
      // The 404 page fades its own content in with CSS, tied to the page intro, so only the privacy page needs this.
      if (page.privacy) {
        await import("./site-motion.js").catch((e) => console.warn("Page motion failed to load:", e));
      }
    }

    if (hasCookieUI) await import("./cookie-consent.js?v=20261112-clean").catch((e) => console.warn("Cookie consent failed to load:", e));

    if (page.home) {
      await import("./pages/home-ui.js?v=20261112-clean").catch((e) => console.warn("Home UI failed to load:", e));
      if (document.querySelector("[data-cup-3d]")) {
        await import("./components/cup-3d.js?v=20261112-clean").catch((e) => console.warn("Cup 3D failed to load:", e));
      }
    }
    if (document.querySelector(".ll-site-footer-page .ll-footer")) {
      await import("./pages/site-footer.js?v=20261112-clean").catch((e) => console.warn("Footer motion failed to load:", e));
      await import("./pages/home-footer-webgl.js?v=20261112-clean").catch((e) => console.warn("Footer WebGL failed to load:", e));
    }
    if (hasWorkItems) await import("./pages/work-lama.js?v=20261112-clean").catch((e) => console.warn("Work lama failed to load:", e));
    if (page.contact) await import("./pages/contact-form.js").catch((e) => console.warn("Contact form failed to load:", e));
    if (page.pitchdeck) await import("./pages/pitchdeck.js?v=20261112-clean").catch((e) => console.warn("Pitchdeck failed to load:", e));
  } catch (error) {
    console.error("Site features could not be initialized.", error);
    document.body.classList.add("ll-js-error");
  }
}

initialize();
