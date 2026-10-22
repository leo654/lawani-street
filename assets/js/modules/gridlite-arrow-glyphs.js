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

  function createGlyph(svg, glyphText, extraClass) {
    var glyph = document.createElement("span");
    glyph.className = [
      svg.getAttribute("class"),
      "ll-arrow-glyph",
      extraClass
    ].filter(Boolean).join(" ");
    glyph.setAttribute("aria-hidden", "true");

    var character = document.createElement("span");
    character.className = "ll-arrow-glyph__character";
    character.textContent = glyphText;
    glyph.appendChild(character);
    svg.replaceWith(glyph);
  }

  document.querySelectorAll("svg.ll-service-product__select-icon").forEach(function (svg) {
    createGlyph(svg, "↓", "ll-arrow-glyph--chevron-down");
  });

  document.querySelectorAll(".ll-button__icon-panel > svg").forEach(function (svg) {
    createGlyph(svg, "→", "ll-icon ll-icon--arrow-up-right ll-arrow-glyph--up-right");
  });

  document.querySelectorAll(".cs-related-row__view > svg.ll-icon:not([class*='ll-icon--arrow-'])").forEach(function (svg) {
    createGlyph(svg, "→", "ll-icon--arrow-up-right ll-arrow-glyph--up-right");
  });

  document.querySelectorAll("svg.ll-nav-toggle__icon").forEach(function (svg) {
    var lines = Array.from(svg.querySelectorAll(".ll-icon__menu-line"));
    if (lines.length !== 3) return;

    var toggle = document.createElement("span");
    toggle.className = "ll-nav-toggle__icon ll-nav-toggle__lines";
    toggle.setAttribute("aria-hidden", "true");

    lines.forEach(function (_, index) {
      var line = document.createElement("span");
      line.className = "ll-nav-toggle__line ll-nav-toggle__line--" + (index + 1);
      toggle.appendChild(line);
    });

    svg.replaceWith(toggle);
  });

})();
