const footers = Array.from(document.querySelectorAll(".ll-footer, .cs-footer, .lwa-footer"));
const canRelight = matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches;
const cleanups = [];
let parallaxFrame = 0;

const updateParallax = () => {
  parallaxFrame = 0;
  const viewportHeight = Math.max(1, window.innerHeight);
  const maxTravel = Math.min(viewportHeight * 0.095, 110);

  footers.forEach((footer) => {
    const rect = footer.getBoundingClientRect();
    const visible = rect.bottom > 0 && rect.top < viewportHeight;
    const travelRange = Math.max(1, Math.min(rect.height, viewportHeight));
    const progress = visible ? Math.max(0, Math.min(1, (viewportHeight - rect.top) / travelRange)) : 0;
    footer.style.setProperty("--footer-parallax-y", (-progress * maxTravel).toFixed(1) + "px");
  });
};

const scheduleParallax = () => {
  if (canRelight && !parallaxFrame) parallaxFrame = requestAnimationFrame(updateParallax);
};

if (footers.length && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-mark-fixed", entry.isIntersecting);
    });
    scheduleParallax();
  }, { threshold: 0 });

  if (canRelight) {
    window.addEventListener("scroll", scheduleParallax, { passive: true });
    window.addEventListener("resize", scheduleParallax, { passive: true });
    scheduleParallax();
  }

  footers.forEach((footer) => {
    observer.observe(footer);

    if (!canRelight) return;

    let frame = 0;
    let pointer = null;

    const updateLight = () => {
      frame = 0;
      if (!pointer) return;

      const markStyle = getComputedStyle(footer, "::before");
      const lineHeight = parseFloat(markStyle.lineHeight) || parseFloat(markStyle.fontSize) * 0.72;
      const markTop = window.innerHeight - 96 - lineHeight;
      const x = Math.max(0, Math.min(1, pointer.clientX / Math.max(1, window.innerWidth)));
      const y = Math.max(0, Math.min(1, (pointer.clientY - markTop) / Math.max(1, lineHeight)));
      const lightX = Math.max(-1, Math.min(1, (pointer.clientX - window.innerWidth / 2) / Math.max(1, window.innerWidth / 2)));
      const lightY = Math.max(-1, Math.min(1, (pointer.clientY - (markTop + lineHeight / 2)) / Math.max(1, lineHeight / 2)));

      footer.style.setProperty("--footer-light-x", (x * 100) + "%");
      footer.style.setProperty("--footer-light-y", (y * 100) + "%");
      footer.style.setProperty("--footer-bevel-x", (-lightX * 1.1).toFixed(2) + "px");
      footer.style.setProperty("--footer-bevel-y", (-lightY * 1.1).toFixed(2) + "px");
    };

    const onPointerMove = (event) => {
      if (event.pointerType === "touch") return;
      pointer = event;
      if (!frame) frame = requestAnimationFrame(updateLight);
    };

    const onPointerLeave = () => {
      pointer = null;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      footer.style.removeProperty("--footer-light-x");
      footer.style.removeProperty("--footer-light-y");
      footer.style.removeProperty("--footer-bevel-x");
      footer.style.removeProperty("--footer-bevel-y");
    };

    footer.addEventListener("pointermove", onPointerMove, { passive: true });
    footer.addEventListener("pointerleave", onPointerLeave, { passive: true });
    cleanups.push(() => {
      if (frame) cancelAnimationFrame(frame);
      footer.removeEventListener("pointermove", onPointerMove);
      footer.removeEventListener("pointerleave", onPointerLeave);
    });
  });

  window.addEventListener("pagehide", () => {
    observer.disconnect();
    if (parallaxFrame) cancelAnimationFrame(parallaxFrame);
    window.removeEventListener("scroll", scheduleParallax);
    window.removeEventListener("resize", scheduleParallax);
    cleanups.forEach((cleanup) => cleanup());
    footers.forEach((footer) => {
      footer.classList.remove("is-mark-fixed");
      footer.style.removeProperty("--footer-parallax-y");
    });
  }, { once: true });
}
