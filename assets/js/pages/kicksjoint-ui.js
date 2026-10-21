(function () {
  "use strict";

  if (!document.body || !document.body.classList.contains("case-study--kicksjoint")) return;

  window.addEventListener("message", function (event) {
    var iconsFrame = document.querySelector(".cs-gallery__media--animated-icons iframe");
    var logoFrame = document.querySelector(".cs-gallery__row--logo-animation iframe");
    var message = event.data;

    if (event.source === iconsFrame?.contentWindow && message?.type === "kicksjoint-icons-height") {
      var height = Number(message.height);
      if (Number.isFinite(height) && height >= 200 && height <= 5000) {
        iconsFrame.style.height = height + "px";
      }
      return;
    }

    if (event.source === iconsFrame?.contentWindow && message?.type === "kicksjoint-icons-invert" &&
        typeof message.inverted === "boolean") {
      iconsFrame.parentElement?.toggleAttribute("data-inverted", message.inverted);
      return;
    }

    if (event.source === logoFrame?.contentWindow && message?.type === "kicksjoint-logo-invert" &&
        typeof message.inverted === "boolean") {
      logoFrame.parentElement?.toggleAttribute("data-inverted", message.inverted);
    }
  });
})();
