(function () {
  if (window.THREE) return;
  if (document.querySelector('script[data-three-global="1"]')) return;

  var script = document.createElement('script');
  script.type = 'module';
  script.setAttribute('data-three-global', '1');
  script.textContent =
    'import * as THREE from "./assets/js/libs/three.module.js"; window.THREE = THREE; window.dispatchEvent(new Event("three:ready"));';
  document.head.appendChild(script);
})();
