(function () {
  "use strict";

  var directionClasses = [
    "ll-icon--arrow-right",
    "ll-icon--arrow-left",
    "ll-icon--arrow-down",
    "ll-icon--arrow-up",
    "ll-icon--arrow-up-right"
  ];

  function replaceArrow(svg) {
    var directionClass = directionClasses.find(function (className) {
      return svg.classList.contains(className);
    });
    if (!directionClass) return;

    var direction = directionClass.slice("ll-icon--arrow-".length);
    var glyph = document.createElement("span");
    glyph.className = svg.getAttribute("class") + " ll-arrow-glyph ll-arrow-glyph--" + direction;
    glyph.setAttribute("aria-hidden", "true");

    var character = document.createElement("span");
    character.className = "ll-arrow-glyph__character";
    character.textContent = "→";
    glyph.appendChild(character);

    svg.replaceWith(glyph);
  }

  document.querySelectorAll("svg.ll-icon[class*='ll-icon--arrow-']").forEach(replaceArrow);
})();
