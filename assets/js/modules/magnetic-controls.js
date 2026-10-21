const gsap = window.gsap;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const selector = ".ll-button:not(.ll-sound-toggle):not(.ll-home-hero__video-toggle), .ll-action-link";

if (gsap && gsap.quickTo && finePointer.matches && !reducedMotion.matches) {
  const controls = [...document.querySelectorAll(selector)];
  const motions = controls.map((control) => {
    const x = gsap.quickTo(control, "x", { duration: 0.28, ease: "power3.out" });
    const y = gsap.quickTo(control, "y", { duration: 0.28, ease: "power3.out" });

    control.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse" || document.hidden || reducedMotion.matches) return;
      const bounds = control.getBoundingClientRect();
      x(Math.max(-4, Math.min(4, (event.clientX - bounds.left - bounds.width / 2) * 0.08)));
      y(Math.max(-4, Math.min(4, (event.clientY - bounds.top - bounds.height / 2) * 0.08)));
    }, { passive: true });
    control.addEventListener("pointerleave", () => {
      x(0);
      y(0);
    });
    return control;
  });

  const reset = () => motions.forEach((control) => gsap.set(control, { x: 0, y: 0 }));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) reset();
  });
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) reset();
  });
  finePointer.addEventListener("change", () => {
    if (!finePointer.matches) reset();
  });
}
