(function () {
  "use strict";

  var DECK_HASH = "#pitchdeck";
  var DECK_FILE = "pitchdeck.html";
  var root = null;
  var frame = null;
  var activeTrigger = null;
  var previousUrl = "";
  var ready = false;
  var open = false;
  var closing = false;
  var closeTimer = 0;
  var scrollPosition = 0;
  var pageStyles = null;
  var inertNodes = [];
  var pendingNavigation = "";
  var pausedVideos = [];

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isDeckLink(link) {
    if (!link || !link.href) return false;

    try {
      var url = new URL(link.href, window.location.href);
      return url.origin === window.location.origin && url.pathname.endsWith("/" + DECK_FILE);
    } catch (error) {
      return false;
    }
  }

  function isPlainClick(event, link) {
    return event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey &&
      !link.hasAttribute("download") &&
      (!link.target || link.target === "_self");
  }

  function deckUrl() {
    var url = new URL(DECK_FILE, window.location.href);
    url.searchParams.set("embedded", "1");
    url.searchParams.set("v", "20260901-global-arrow-svg-1");
    return url.href;
  }

  function createShell() {
    if (root || document.body.classList.contains("ll-deck-page")) return;

    root = document.createElement("div");
    root.className = "ll-pitch-overlay";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Lawani St resume");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = [
      '<div class="ll-pitch-overlay__surface">',
        '<iframe class="ll-pitch-overlay__deck" title="Lawani St resume" allow="autoplay" src="' + deckUrl() + '"></iframe>',
      '</div>'
    ].join("");

    frame = root.querySelector("iframe");
    document.body.appendChild(root);
  }

  function postToDeck(type) {
    if (!ready || !frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage({ type: type }, "*");
  }

  function lockPage() {
    scrollPosition = window.scrollY || window.pageYOffset || 0;
    pageStyles = {
      bodyOverflow: document.body.style.overflow,
      bodyPaddingRight: document.body.style.paddingRight,
      htmlOverflow: document.documentElement.style.overflow
    };

    var scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.body.classList.add("ll-pitch-overlay-open");
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (scrollbarWidth) document.body.style.paddingRight = scrollbarWidth + "px";

    inertNodes = [];
    Array.prototype.forEach.call(document.body.children, function (node) {
      if (node === root || !(node instanceof HTMLElement)) return;
      inertNodes.push({ node: node, inert: node.inert });
      node.inert = true;
    });
  }

  function pausePageMotion() {
    pausedVideos = [];
    Array.prototype.forEach.call(document.querySelectorAll("video"), function (video) {
      if (video.paused) return;
      pausedVideos.push(video);
      video.pause();
    });
    document.dispatchEvent(new CustomEvent("lawani:pitchdeck-open"));
  }

  function resumePageMotion() {
    document.dispatchEvent(new CustomEvent("lawani:pitchdeck-closed"));
    pausedVideos.forEach(function (video) {
      if (!video.isConnected || document.hidden) return;
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") playPromise.catch(function () {});
    });
    pausedVideos = [];
  }

  function unlockPage() {
    inertNodes.forEach(function (entry) {
      if (entry.node && entry.node.isConnected) entry.node.inert = entry.inert;
    });
    inertNodes = [];

    document.body.classList.remove("ll-pitch-overlay-open");
    if (pageStyles) {
      document.body.style.overflow = pageStyles.bodyOverflow;
      document.body.style.paddingRight = pageStyles.bodyPaddingRight;
      document.documentElement.style.overflow = pageStyles.htmlOverflow;
    }
    window.scrollTo(0, scrollPosition);
  }

  function setPitchHash() {
    var url = new URL(window.location.href);
    if (url.hash === DECK_HASH) return;
    url.hash = DECK_HASH;
    window.history.replaceState(null, "", url);
  }

  function clearPitchHash() {
    if (window.location.hash !== DECK_HASH) return;
    window.history.replaceState(null, "", previousUrl || (window.location.pathname + window.location.search));
  }

  function show(trigger, options) {
    if (open || closing || document.body.classList.contains("ll-deck-page")) return;
    createShell();
    if (!root) return;

    options = options || {};
    activeTrigger = trigger || document.querySelector('a[href*="pitchdeck.html"]');
    previousUrl = window.location.pathname + window.location.search + (window.location.hash === DECK_HASH ? "" : window.location.hash);
    open = true;
    closing = false;
    window.clearTimeout(closeTimer);

    if (options.updateHistory !== false) setPitchHash();
    lockPage();
    pausePageMotion();
    root.classList.remove("is-closing");
    root.classList.add("is-visible");
    root.setAttribute("aria-hidden", "false");
    postToDeck("lawani:pitchdeck-activate");

    window.requestAnimationFrame(function () {
      if (!root || !open) return;
      root.classList.add("is-open");
      window.setTimeout(function () {
        if (frame && frame.isConnected) frame.focus({ preventScroll: true });
      }, reducedMotion() ? 0 : 260);
    });
  }

  function finishClose() {
    if (!root) return;

    root.classList.remove("is-visible", "is-closing");
    root.setAttribute("aria-hidden", "true");
    unlockPage();

    var focusTarget = activeTrigger;
    activeTrigger = null;
    closing = false;
    if (pendingNavigation) {
      var destination = pendingNavigation;
      pendingNavigation = "";
      pausedVideos = [];
      window.location.assign(destination);
      return;
    }
    resumePageMotion();
    if (focusTarget && focusTarget.isConnected) focusTarget.focus({ preventScroll: true });
  }

  function hide(options) {
    if (!root || !open || closing) return;
    options = options || {};
    open = false;
    closing = true;
    postToDeck("lawani:pitchdeck-deactivate");
    root.classList.add("is-closing");
    root.classList.remove("is-open");
    if (options.updateHistory !== false) clearPitchHash();

    if (reducedMotion()) {
      finishClose();
      return;
    }

    var settled = false;
    function finish(event) {
      if (settled || (event && (event.target !== root || event.propertyName !== "opacity"))) return;
      settled = true;
      root.removeEventListener("transitionend", finish);
      window.clearTimeout(closeTimer);
      finishClose();
    }

    root.addEventListener("transitionend", finish);
    closeTimer = window.setTimeout(finish, 720);
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("a[href]");
    if (!isDeckLink(link) || !isPlainClick(event, link)) return;
    event.preventDefault();
    show(link, { updateHistory: true });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape" || !open) return;
    event.preventDefault();
    hide({ updateHistory: true });
  });

  window.addEventListener("message", function (event) {
    if (!root || !frame || event.source !== frame.contentWindow || !event.data) return;
    if (event.origin !== window.location.origin && event.origin !== "null") return;

    if (event.data.type === "lawani:pitchdeck-ready") {
      ready = true;
      root.classList.add("is-ready");
      postToDeck(open ? "lawani:pitchdeck-activate" : "lawani:pitchdeck-deactivate");
    }
    if (event.data.type === "lawani:pitchdeck-close") hide({ updateHistory: true });
    if (event.data.type === "lawani:pitchdeck-navigate" && event.data.href) {
      try {
        var destination = new URL(event.data.href, window.location.href);
        if (destination.origin !== window.location.origin) return;
        pendingNavigation = destination.href;
        hide({ updateHistory: true });
      } catch (error) {}
    }
  });

  window.addEventListener("hashchange", function () {
    if (window.location.hash === DECK_HASH && !open) show(null, { updateHistory: false });
    if (window.location.hash !== DECK_HASH && open) hide({ updateHistory: false });
  });

  window.LawaniPitchdeckOverlay = {
    close: function () { hide({ updateHistory: true }); },
    open: function (trigger) { show(trigger || null, { updateHistory: true }); }
  };

  function init() {
    createShell();
    if (window.location.hash === DECK_HASH) show(null, { updateHistory: false });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
