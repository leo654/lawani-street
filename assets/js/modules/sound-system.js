/**
 * Lawani St. Sound System
 *
 * A small, opt-in interface-sound layer. It deliberately does not preload
 * media or create an AudioContext until someone enables sound and interacts
 * with the page, so it is quiet by default and stays within autoplay rules.
 */

const STORAGE_KEY = "ll-sound-effects";
const TOGGLE_SELECTOR = "[data-ll-sound-toggle]";
const CONTROL_SELECTOR = [
  "a[href]",
  "button:not(:disabled)",
  "input[type='button']:not(:disabled)",
  "input[type='submit']:not(:disabled)",
  "input[type='reset']:not(:disabled)",
  "[role='button']",
  "[role='link']",
  "summary",
].join(", ");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let enabled = false;
let audioContext = null;
let masterGain = null;
let compressor = null;
let reducedMotion = reduceMotion.matches;
const listeners = new Set();

function getStoredPreference() {
  try {
    const storage = window.LawaniStorage || window.localStorage;
    return storage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

function persistPreference(nextValue) {
  try {
    const storage = window.LawaniStorage || window.localStorage;
    storage.setItem(STORAGE_KEY, nextValue ? "on" : "off");
  } catch {
    // Storage is optional: the setting still applies for this visit.
  }
}

function getContext() {
  if (audioContext) return audioContext;

  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return null;

  try {
    audioContext = new AudioContextConstructor();
    masterGain = audioContext.createGain();
    compressor = audioContext.createDynamicsCompressor();

    masterGain.gain.value = 0.18;
    compressor.threshold.value = -18;
    compressor.knee.value = 10;
    compressor.ratio.value = 8;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;

    masterGain.connect(compressor);
    compressor.connect(audioContext.destination);
  } catch {
    audioContext = null;
    masterGain = null;
    compressor = null;
  }

  return audioContext;
}

function syncToggles() {
  document.querySelectorAll(TOGGLE_SELECTOR).forEach((toggle) => {
    const stateLabel = enabled ? "Sound on" : "Sound off";
    const nextAction = enabled ? "Turn sound off" : "Turn sound on";

    toggle.classList.remove("ll-button", "ll-button--compact");
    toggle.classList.add("ll-sound-toggle");
    toggle.setAttribute("data-sound-mode", enabled ? "on" : "off");
    toggle.setAttribute("aria-pressed", String(enabled));
    toggle.setAttribute("aria-label", `${stateLabel}. ${nextAction}.`);
  });
}

function notify() {
  listeners.forEach((listener) => listener(enabled));
  window.dispatchEvent(new CustomEvent("lawani:soundchange", { detail: { enabled } }));
}

function setEnabled(nextValue, { persist = true, announce = true } = {}) {
  enabled = Boolean(nextValue);
  if (persist) persistPreference(enabled);
  syncToggles();
  if (announce) notify();
}

function resume(context) {
  if (context.state !== "suspended") return;
  context.resume().catch(() => {});
}

function playVoice({ frequency, offset = 0, duration, volume, type = "sine", bend = 1 }) {
  if (!audioContext || !masterGain) return;

  const start = audioContext.currentTime + offset;
  const end = start + duration;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, frequency * bend), end);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.008, duration * 0.25));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start(start);
  oscillator.stop(end + 0.01);
}

const SOUND_LIBRARY = {
  activate: [
    { frequency: 520, duration: 0.045, volume: 0.09, type: "triangle", bend: 0.84 },
    { frequency: 780, offset: 0.018, duration: 0.05, volume: 0.045, type: "sine", bend: 0.92 },
  ],
  navigate: [
    { frequency: 440, duration: 0.045, volume: 0.075, type: "sine", bend: 1.18 },
    { frequency: 660, offset: 0.022, duration: 0.055, volume: 0.045, type: "sine", bend: 1.04 },
  ],
  toggleOn: [
    { frequency: 420, duration: 0.06, volume: 0.09, type: "sine", bend: 1.28 },
    { frequency: 640, offset: 0.035, duration: 0.075, volume: 0.055, type: "triangle", bend: 1.08 },
  ],
  toggleOff: [
    { frequency: 620, duration: 0.055, volume: 0.075, type: "sine", bend: 0.82 },
    { frequency: 430, offset: 0.03, duration: 0.065, volume: 0.045, type: "triangle", bend: 0.9 },
  ],
};

function play(name = "activate") {
  if (!enabled || document.hidden) return false;

  const context = getContext();
  const pattern = SOUND_LIBRARY[name] || SOUND_LIBRARY.activate;
  if (!context || !masterGain) return false;

  resume(context);
  const scale = reducedMotion ? 0.72 : 1;
  pattern.forEach((voice) => {
    playVoice({ ...voice, duration: voice.duration * scale, volume: voice.volume * scale });
  });
  return true;
}

function findControl(target) {
  return target instanceof Element ? target.closest(CONTROL_SELECTOR) : null;
}

function playForControl(control) {
  if (!control || control.matches(TOGGLE_SELECTOR) || control.getAttribute("aria-disabled") === "true") return;
  play(control.matches("a[href]") ? "navigate" : "activate");
}

function initialize() {
  enabled = getStoredPreference();
  syncToggles();

  document.addEventListener("click", (event) => {
    const toggle = event.target instanceof Element ? event.target.closest(TOGGLE_SELECTOR) : null;
    if (toggle) {
      const nextEnabled = !enabled;
      if (enabled) play("toggleOff");
      setEnabled(nextEnabled);
      if (nextEnabled) play("toggleOn");
      return;
    }

    playForControl(findControl(event.target));
  });

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) setEnabled(event.newValue === "on", { persist: false });
  });

  const updateReducedMotion = (event) => {
    reducedMotion = event.matches;
  };
  if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", updateReducedMotion);
  else if (reduceMotion.addListener) reduceMotion.addListener(updateReducedMotion);
}

window.LawaniSound = {
  get enabled() {
    return enabled;
  },
  setEnabled,
  play,
  subscribe(listener) {
    if (typeof listener !== "function") return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

initialize();
