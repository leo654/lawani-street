/*
 * Sound control artwork: a bundle of fine waveform strands that meet at both ends
 * (after the Airelibre mark). One strand carries the big swell; the others cross it at
 * smaller sizes and different speeds, which reads as a ribbon turning in space.
 * Sound on  -> the swell opens and the strands drift through each other.
 * Sound off -> the strands lie straight and white, a hair apart, like a bundle of thread.
 * sound-system.js owns the state (data-sound-mode on the button); this only draws it.
 */
const button = document.querySelector("[data-ll-sound-wave]");
const group = button ? button.querySelector("[data-wave-strands]") : null;

if (button && group) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const NS = "http://www.w3.org/2000/svg";
  const SAMPLES = 64;
  const X0 = 10;
  const WIDTH = 56;
  const MID = 18;
  const HEIGHT = 10;

  // amp: share of the swell; freq: waves across the bundle; speed: drift rate; off: phase offset.
  const STRANDS = [
    { lane: 0, amp: 1, freq: 1.25, speed: 1, off: 0, width: 1.15, alpha: 1 },
    { lane: -1.2, amp: 0.42, freq: 1.4, speed: -0.7, off: 1.9, width: 1, alpha: 0.9 },
    { lane: 1.2, amp: 0.62, freq: 0.9, speed: 0.55, off: 3.4, width: 0.8, alpha: 0.75 },
    { lane: -2.3, amp: 0.3, freq: 1.8, speed: 1.3, off: 0.8, width: 0.55, alpha: 0.6 },
    { lane: 2.3, amp: 0.22, freq: 1.2, speed: -1.1, off: 4.6, width: 0.45, alpha: 0.5 },
  ];

  const paths = STRANDS.map((s) => {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("class", "ll-wave-strand");
    p.setAttribute("stroke-width", String(s.width));
    p.style.setProperty("--strand-alpha", String(s.alpha));
    group.appendChild(p);
    return p;
  });

  let amount = 0;
  let velocity = 0;
  let time = 0;
  let last = 0;
  let frame = 0;

  // Bell envelope, slightly left of centre like the reference, pinned to zero at both ends.
  function bell(u) {
    const core = Math.exp(-Math.pow((u - 0.47) / 0.27, 2));
    return core * Math.pow(Math.sin(Math.PI * u), 0.6);
  }

  function strandPath(s, k) {
    let d = "";
    for (let i = 0; i <= SAMPLES; i += 1) {
      const u = i / SAMPLES;
      const env = bell(u) * k;
      const wave = Math.sin(Math.PI * 2 * s.freq * u - time * s.speed * 2.4 + s.off);
      // Gentle shared tilt: left end a touch high, right end rising, as in the mark (only while playing).
      const tilt = 2.2 * Math.cos(Math.PI * u) * (1 - bell(u)) * Math.min(1, k);
      // Muted: the strands lie dead straight, a hair apart, so it still reads as a bundle of threads.
      const rest = s.lane * (1 - Math.min(1, Math.max(0, k)));
      const y = MID - HEIGHT * s.amp * env * wave - tilt * 0.5 + rest;
      d += (i === 0 ? "M" : "L") + (X0 + WIDTH * u).toFixed(2) + " " + y.toFixed(2);
    }
    return d;
  }

  function render() {
    STRANDS.forEach((s, i) => paths[i].setAttribute("d", strandPath(s, Math.max(0, amount))));
  }

  function isOn() {
    return button.getAttribute("data-sound-mode") === "on";
  }

  function tick(now) {
    frame = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    const on = isOn();
    const target = on ? 1 : 0;
    velocity += ((target - amount) * (on ? 70 : 60) - velocity * (on ? 11 : 13)) * dt;
    amount += velocity * dt;
    if (!on && amount < 0) amount = 0;
    if (!reduced.matches) time += dt * (0.25 + 0.75 * Math.min(1, Math.max(0, amount)));
    render();
    const settled = Math.abs(target - amount) < 0.002 && Math.abs(velocity) < 0.01;
    if ((on && !reduced.matches) || !settled) {
      frame = window.requestAnimationFrame(tick);
    } else {
      amount = target;
      velocity = 0;
      render();
      last = 0;
    }
  }

  function wake() {
    if (!frame && !document.hidden) {
      last = 0;
      frame = window.requestAnimationFrame(tick);
    }
  }

  new MutationObserver(wake).observe(button, { attributes: true, attributeFilter: ["data-sound-mode"] });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    } else {
      wake();
    }
  });
  reduced.addEventListener("change", wake);

  amount = isOn() ? 1 : 0;
  render();
  wake();
}
