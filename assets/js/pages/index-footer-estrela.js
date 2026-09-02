'use strict';

(function() {
  var timezone = 'Africa/Johannesburg';
  var clockFactory = window.__lawaniShared && typeof window.__lawaniShared.createZonedClock === 'function'
    ? window.__lawaniShared.createZonedClock
    : null;
  var clock = clockFactory
    ? clockFactory({
        timezone: timezone,
        fallbackZoneLabel: '(GMT+2)'
      })
    : {
        read: function() {
          return {
            time: '00:00:00',
            zone: '(GMT+2)'
          };
        }
      };

  function tick() {
    var timeNodes = document.querySelectorAll('[data-footer-clock-time]');
    var zoneNodes = document.querySelectorAll('[data-footer-clock-zone]');
    if (!timeNodes.length && !zoneNodes.length) return;

    var now = new Date();
    var values = clock.read(now);
    var timeValue = values.time;
    var zoneValue = values.zone;

    timeNodes.forEach(function(node) {
      node.textContent = timeValue;
    });

    zoneNodes.forEach(function(node) {
      node.textContent = zoneValue;
    });
  }

  tick();
  window.setInterval(tick, 1000);
})();
