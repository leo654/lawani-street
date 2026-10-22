(function () {
  "use strict";

  var CONSENT_KEY = "lawani-cookie-consent";
  var CONSENT_VERSION = "2";
  var isPrivacyPage = document.body && document.body.classList.contains("cookie-privacy-page");
  var isEmbedded = window.self !== window.top;

  if (!document.body || isEmbedded) return;

  function readConsent() {
    try {
      var raw = window.localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;

      var consent = JSON.parse(raw);
      if (
        consent.version !== CONSENT_VERSION ||
        typeof consent.analytics !== "boolean" ||
        typeof consent.marketing !== "boolean"
      ) {
        return null;
      }
      return consent;
    } catch (error) {
      console.error("Unable to read cookie preferences:", error);
      return null;
    }
  }

  function storeConsent(preferences) {
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify({
        version: CONSENT_VERSION,
        necessary: true,
        analytics: preferences.analytics,
        marketing: preferences.marketing,
        timestamp: Date.now()
      }));
      return true;
    } catch (error) {
      console.error("Unable to save cookie preferences:", error);
      return false;
    }
  }

  function animateConsentText(dialog) {
    var gsap = window.gsap;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!gsap || typeof gsap.fromTo !== "function" || reduceMotion) return;

    var walker = document.createTreeWalker(dialog.querySelector(".cookie-consent__content"), NodeFilter.SHOW_TEXT);
    var textNodes = [];
    var currentNode;

    while ((currentNode = walker.nextNode())) {
      if (currentNode.nodeValue.trim() && !currentNode.parentElement.closest(".cookie-consent__word")) {
        textNodes.push(currentNode);
      }
    }

    textNodes.forEach(function (textNode) {
      var parts = textNode.nodeValue.match(/\s+|[^\s]+/g) || [];
      var fragment = document.createDocumentFragment();

      parts.forEach(function (part) {
        if (/^\s+$/.test(part)) {
          fragment.appendChild(document.createTextNode(part));
          return;
        }

        var word = document.createElement("span");
        var wordContent = document.createElement("span");
        word.className = "cookie-consent__word";
        wordContent.className = "cookie-consent__word-content";
        wordContent.textContent = part;
        word.appendChild(wordContent);
        fragment.appendChild(word);
      });

      textNode.parentNode.replaceChild(fragment, textNode);
    });

    var words = Array.prototype.filter.call(
      dialog.querySelectorAll(".cookie-consent__word-content"),
      function (word) {
        return !word.closest("[hidden]");
      }
    );

    if (words.length) {
      gsap.fromTo(words, {
        yPercent: 110,
        opacity: 0
      }, {
        yPercent: 0,
        opacity: 1,
        duration: 0.48,
        stagger: 0.012,
        ease: "power3.out",
        overwrite: true
      });
    }
  }

  function createDialog() {
    var dialog = document.createElement("section");
    dialog.className = "cookie-consent";
    dialog.id = "cookie-consent";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "false");
    dialog.setAttribute("aria-hidden", "true");
    dialog.setAttribute("aria-labelledby", "cookie-consent-title");
    dialog.inert = true;
    dialog.innerHTML = [
      '<div class="cookie-consent__content">',
        '<h2 class="cookie-consent__title" id="cookie-consent-title">Cookies</h2>',
        '<p class="cookie-consent__text cookie-consent__notice-text" data-cookie-notice>',
          'Optional analytics help us understand site traffic. Optional marketing technologies are only used with your permission. Read our ',
          '<a class="cookie-consent__link" href="privacy.html" target="_blank" rel="noopener noreferrer">Privacy policy</a> or ',
          '<button class="cookie-consent__link cookie-consent__button--manage" type="button" data-cookie-action="manage">Customize</button>.',
        '</p>',
        '<div class="cookie-consent__preferences" data-cookie-preferences hidden>',
          '<p class="cookie-consent__preferences-intro">Choose which optional preferences to save. Necessary storage is always on so we can remember your choice.</p>',
          '<label class="cookie-consent__toggle-row">',
            '<span class="cookie-consent__toggle-copy"><strong>Necessary</strong><span>Stores your cookie choices.</span></span>',
            '<input class="cookie-consent__toggle" type="checkbox" checked disabled aria-label="Necessary storage, always on">',
          '</label>',
          '<label class="cookie-consent__toggle-row">',
            '<span class="cookie-consent__toggle-copy"><strong>Analytics</strong><span>Allow optional analytics technologies.</span></span>',
            '<input class="cookie-consent__toggle" type="checkbox" data-cookie-category="analytics" aria-label="Allow analytics">',
          '</label>',
          '<label class="cookie-consent__toggle-row">',
            '<span class="cookie-consent__toggle-copy"><strong>Marketing</strong><span>Allow optional marketing technologies.</span></span>',
            '<input class="cookie-consent__toggle" type="checkbox" data-cookie-category="marketing" aria-label="Allow marketing">',
          '</label>',
        '</div>',
        '<p class="cookie-consent__notice" data-cookie-error role="status" hidden>',
          'Your preferences could not be saved in this browser. Check your storage settings and try again.',
        '</p>',
        '<div class="cookie-consent__actions" data-cookie-actions>',
          '<button class="cookie-consent__button" type="button" data-cookie-action="decline">Decline</button>',
          '<button class="cookie-consent__button cookie-consent__button--accept" type="button" data-cookie-action="accept">Accept</button>',
        '</div>',
      '</div>'
    ].join("");
    document.body.appendChild(dialog);
    return dialog;
  }

  function openDialog(dialog, manage) {
    var preferences = dialog.querySelector("[data-cookie-preferences]");
    var actions = dialog.querySelector("[data-cookie-actions]");
    var manageButton = dialog.querySelector('[data-cookie-action="manage"]');
    var consent = readConsent();

    preferences.hidden = !manage;
    actions.classList.toggle("is-managing", manage);
    dialog.querySelector('[data-cookie-category="analytics"]').checked = !!(consent && consent.analytics);
    dialog.querySelector('[data-cookie-category="marketing"]').checked = !!(consent && consent.marketing);
    dialog.querySelector('[data-cookie-action="decline"]').hidden = manage;
    var acceptButton = dialog.querySelector('[data-cookie-action="accept"], [data-cookie-action="save"]');
    acceptButton.setAttribute("data-cookie-action", manage ? "save" : "accept");
    acceptButton.textContent = manage ? "Save preferences" : "Accept";
    manageButton.textContent = manage ? "Back" : "Customize";
    dialog.querySelector("[data-cookie-error]").hidden = true;
    actions.querySelector('[data-cookie-action="decline"]').setAttribute("aria-label", "Reject all optional preferences");

    dialog.inert = false;
    dialog.setAttribute("aria-hidden", "false");

    if (manage) {
      var firstPreference = preferences.querySelector('input:not(:disabled)');
      if (firstPreference) firstPreference.focus({ preventScroll: true });
    } else if (document.activeElement !== manageButton) {
      manageButton.focus({ preventScroll: true });
    }

    animateConsentText(dialog);
  }

  function closeDialog(dialog) {
    if (dialog.contains(document.activeElement)) document.activeElement.blur();
    dialog.setAttribute("aria-hidden", "true");
    dialog.inert = true;
  }

  function init() {
    var dialog = createDialog();
    var consent = readConsent();

    dialog.addEventListener("click", function (event) {
      var button = event.target.closest("[data-cookie-action]");
      if (!button) return;

      var action = button.getAttribute("data-cookie-action");
      if (action === "manage") {
        var preferences = dialog.querySelector("[data-cookie-preferences]");
        openDialog(dialog, preferences.hidden);
        return;
      }

      var choice = { analytics: false, marketing: false };
      if (action === "accept") {
        choice.analytics = true;
        choice.marketing = true;
      } else if (action === "save") {
        choice.analytics = dialog.querySelector('[data-cookie-category="analytics"]').checked;
        choice.marketing = dialog.querySelector('[data-cookie-category="marketing"]').checked;
      }

      if (!storeConsent(choice)) {
        dialog.querySelector("[data-cookie-error]").hidden = false;
        return;
      }

      closeDialog(dialog);
    });

    if (isPrivacyPage) {
      var settingsLink = document.querySelector("[data-cookie-settings-link]");
      if (settingsLink) {
        settingsLink.addEventListener("click", function (event) {
          event.preventDefault();
          openDialog(dialog, true);
        });
      }
      if (window.location.hash === "#cookie-settings") openDialog(dialog, true);
      return;
    }

    if (consent) return;
    window.setTimeout(function () {
      openDialog(dialog, false);
    }, 900);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
