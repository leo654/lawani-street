(function () {
  "use strict";

  var form = document.querySelector("[data-project-form]");
  if (!form) return;

  var recipient = "talktolawanistreet@gmail.com";
  var status = form.querySelector("[data-form-status]");
  var honeypot = form.querySelector('input[name="website"]');
  var reasonSelect = form.querySelector('select[name="reason"]');
  var select = form.querySelector("[data-contact-select]");
  var selectTrigger = select && select.querySelector("[data-select-trigger]");
  var selectValue = select && select.querySelector("[data-select-value]");
  var selectMenu = select && select.querySelector('[role="listbox"]');
  var selectOptions = select ? Array.from(select.querySelectorAll("[data-select-option]")) : [];

  function selectedIndex() {
    return selectOptions.findIndex(function (option) {
      return option.getAttribute("aria-selected") === "true";
    });
  }

  function closeSelect(returnFocus) {
    if (!select || !selectMenu || !selectTrigger) return;
    selectMenu.hidden = true;
    selectTrigger.setAttribute("aria-expanded", "false");
    if (returnFocus) selectTrigger.focus();
  }

  function focusOption(index) {
    if (!selectOptions.length) return;
    var safeIndex = (index + selectOptions.length) % selectOptions.length;
    selectOptions[safeIndex].focus();
  }

  function openSelect(index) {
    if (!select || !selectMenu || !selectTrigger) return;
    selectMenu.hidden = false;
    selectTrigger.setAttribute("aria-expanded", "true");
    focusOption(index >= 0 ? index : Math.max(selectedIndex(), 0));
  }

  function chooseOption(value) {
    if (!reasonSelect || !selectValue || !selectTrigger) return;
    reasonSelect.value = value;
    selectValue.textContent = value;
    selectValue.removeAttribute("data-empty");
    selectTrigger.removeAttribute("data-invalid");
    selectOptions.forEach(function (option) {
      option.setAttribute("aria-selected", String(option.getAttribute("data-select-option") === value));
    });
    reasonSelect.dispatchEvent(new Event("change", { bubbles: true }));
    if (status) status.textContent = "";
    closeSelect(true);
  }

  if (select && selectTrigger && selectMenu) {
    selectValue.setAttribute("data-empty", "true");

    selectTrigger.addEventListener("click", function () {
      if (selectMenu.hidden) openSelect(selectedIndex());
      else closeSelect(false);
    });

    selectTrigger.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        openSelect(selectedIndex() + (event.key === "ArrowDown" ? 1 : 0));
      }
    });

    selectOptions.forEach(function (option, index) {
      option.addEventListener("click", function () {
        chooseOption(option.getAttribute("data-select-option"));
      });

      option.addEventListener("keydown", function (event) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          focusOption(index + 1);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          focusOption(index - 1);
        } else if (event.key === "Home") {
          event.preventDefault();
          focusOption(0);
        } else if (event.key === "End") {
          event.preventDefault();
          focusOption(selectOptions.length - 1);
        } else if (event.key === "Escape") {
          event.preventDefault();
          closeSelect(true);
        } else if (event.key === "Tab") {
          closeSelect(false);
        }
      });
    });

    document.addEventListener("pointerdown", function (event) {
      if (!select.contains(event.target)) closeSelect(false);
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (honeypot && honeypot.value.trim()) return;

    if (reasonSelect && !reasonSelect.value) {
      if (selectTrigger) {
        selectTrigger.setAttribute("data-invalid", "true");
        selectTrigger.focus();
      }
      if (status) status.textContent = "PLEASE CHOOSE A PROJECT TYPE.";
      return;
    }

    var data = new FormData(form);
    var reason = String(data.get("reason") || "Project inquiry");
    var body = [
      "NAME: " + String(data.get("name") || ""),
      "EMAIL: " + String(data.get("email") || ""),
      "PHONE: " + String(data.get("phone") || "Not provided"),
      "REASON: " + reason,
      "MESSAGE:\n" + String(data.get("message") || "")
    ].join("\n\n");
    var url = "mailto:" + recipient + "?subject=" + encodeURIComponent("Project inquiry — " + reason) + "&body=" + encodeURIComponent(body);

    if (status) status.textContent = "Opening a new email draft…";
    window.location.assign(url);
  });
})();
