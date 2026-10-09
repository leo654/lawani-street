(function () {
  'use strict';

  var CONSENT_KEY = 'lawani-cookie-consent';
  var CONSENT_VERSION = '1';

  function hasConsented() {
    try {
      var stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) return false;
      var data = JSON.parse(stored);
      return data.version === CONSENT_VERSION;
    } catch (e) {
      return false;
    }
  }

  function setConsent(accepted) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        version: CONSENT_VERSION,
        accepted: accepted,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Failed to store cookie consent:', e);
    }
  }

  function initCookieConsent() {
    var banner = document.getElementById('cookie-consent');
    if (!banner) return;

    // Don't show if already consented
    if (hasConsented()) {
      return;
    }

    // Show banner after a short delay
    setTimeout(function () {
      banner.setAttribute('aria-hidden', 'false');
    }, 1000);

    // Handle button clicks
    var acceptButton = banner.querySelector('[data-cookie-consent="accept"]');
    var declineButton = banner.querySelector('[data-cookie-consent="decline"]');

    if (acceptButton) {
      acceptButton.addEventListener('click', function () {
        setConsent(true);
        hideBanner(banner);
      });
    }

    if (declineButton) {
      declineButton.addEventListener('click', function () {
        setConsent(false);
        hideBanner(banner);
      });
    }
  }

  function hideBanner(banner) {
    banner.setAttribute('aria-hidden', 'true');
    setTimeout(function () {
      banner.style.display = 'none';
    }, 400);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieConsent);
  } else {
    initCookieConsent();
  }
})();
