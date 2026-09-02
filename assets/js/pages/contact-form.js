(function () {
  "use strict";

  var form = document.querySelector("[data-project-form]");
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll("[data-step]"));
  var progressItems = Array.prototype.slice.call(form.querySelectorAll("[data-progress-step]"));
  var progressButtons = Array.prototype.slice.call(form.querySelectorAll("[data-step-jump]"));
  var options = Array.prototype.slice.call(form.querySelectorAll("[data-project-type]"));
  var projectTypesInput = form.querySelector("[data-project-types]");
  var otherField = form.querySelector("[data-other-field]");
  var otherInput = form.querySelector("[data-other-input]");
  var selectionError = form.querySelector("[data-selection-error]");
  var summary = form.querySelector("[data-project-summary]");
  var description = form.querySelector("[data-project-description]");
  var descriptionCount = form.querySelector("[data-description-count]");
  var submitButton = form.querySelector("[data-submit-button]");
  var formStatus = form.querySelector("[data-form-status]");
  var selectedTypes = new Set();
  var currentStep = 1;
  var maxVisitedStep = 1;
  var transitioning = false;
  var recipient = "talktolawanistreet@gmail.com";
  var motion = window.LawaniMotion;

  var labels = {
    "brand-identity": "Brand identity",
    website: "Website",
    campaign: "Campaign",
    product: "Digital product",
    "creative-direction": "Creative direction",
    other: "Something else"
  };

  function reducedMotion() {
    return motion ? motion.reduced() : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function setError(input, message) {
    if (!input) return;
    input.setAttribute("aria-invalid", message ? "true" : "false");
    var error = form.querySelector("#" + input.id + "Error");
    if (error) error.textContent = message || "";
  }

  function validationMessage(input) {
    if (input.validity.typeMismatch) return "Enter a valid email address";
    if (input.validity.tooShort) return "Add a little more detail";
    if (input.validity.valueMissing) return "Complete this field";
    return "Check this field";
  }

  function validateStep(stepNumber) {
    var step = form.querySelector('[data-step="' + stepNumber + '"]');
    if (!step) return false;

    if (stepNumber === 1) {
      if (!selectedTypes.size) {
        selectionError.textContent = "Select at least one service";
        selectionError.hidden = false;
        options[0].focus();
        return false;
      }

      if (selectedTypes.has("other") && !otherInput.value.trim()) {
        selectionError.textContent = "Tell me what you need";
        selectionError.hidden = false;
        setError(otherInput, "Please specify the service");
        otherInput.focus();
        return false;
      }

      selectionError.hidden = true;
      setError(otherInput, "");
    }

    var firstInvalid = null;
    Array.prototype.slice.call(step.querySelectorAll("[required]")).forEach(function (input) {
      var valid = input.checkValidity() && input.value.trim();
      setError(input, valid ? "" : validationMessage(input));
      if (!valid && !firstInvalid) firstInvalid = input;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }
    return true;
  }

  function updateProgress(stepNumber) {
    progressItems.forEach(function (item) {
      var itemStep = Number(item.getAttribute("data-progress-step"));
      item.classList.toggle("is-complete", itemStep < stepNumber);
      if (itemStep === stepNumber) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });

    progressButtons.forEach(function (button) {
      button.disabled = Number(button.getAttribute("data-step-jump")) > maxVisitedStep;
    });
  }

  function focusStep(step) {
    var target = step.querySelector("input:not([type=hidden]), textarea, select, button:not([data-back])");
    if (!target) target = step.querySelector(".project-form__question");
    if (!target) return;
    if (!target.hasAttribute("tabindex") && target.matches("h2")) target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }

  function showStep(stepNumber) {
    if (transitioning || stepNumber === currentStep) return;
    var outgoing = form.querySelector('[data-step="' + currentStep + '"]');
    var incoming = form.querySelector('[data-step="' + stepNumber + '"]');
    if (!outgoing || !incoming) return;

    transitioning = true;
    var finish = function () {
      outgoing.hidden = true;
      outgoing.setAttribute("aria-hidden", "true");
      incoming.hidden = false;
      incoming.setAttribute("aria-hidden", "false");
      incoming.classList.remove("is-entering");
      void incoming.offsetWidth;
      incoming.classList.add("is-entering");

      currentStep = stepNumber;
      maxVisitedStep = Math.max(maxVisitedStep, stepNumber);
      updateProgress(stepNumber);
      if (stepNumber === 3) updateSummary();

      window.requestAnimationFrame(function () {
        focusStep(incoming);
        transitioning = false;
      });
    };

    if (reducedMotion() || typeof outgoing.animate !== "function") {
      finish();
      return;
    }

    var animation = outgoing.animate(
      [
        { opacity: 1, transform: "translate3d(0,0,0)" },
        { opacity: 0, transform: "translate3d(0,-12px,0)" }
      ],
      { duration: 220, easing: "cubic-bezier(0.65,0,0.35,1)", fill: "forwards" }
    );
    animation.finished.then(finish).catch(finish);
  }

  function updateSummary() {
    var values = Array.from(selectedTypes).map(function (value) { return labels[value]; });
    if (selectedTypes.has("other") && otherInput.value.trim()) values.push(otherInput.value.trim());
    summary.textContent = values.join(" / ");
  }

  function syncSelection() {
    projectTypesInput.value = Array.from(selectedTypes).map(function (value) { return labels[value]; }).join(", ");
    var hasOther = selectedTypes.has("other");
    otherField.hidden = !hasOther;
    otherInput.required = hasOther;
    if (!hasOther) {
      otherInput.value = "";
      setError(otherInput, "");
    }
    selectionError.hidden = true;
  }

  options.forEach(function (button) {
    button.addEventListener("click", function () {
      var value = button.getAttribute("data-project-type");
      if (selectedTypes.has(value)) selectedTypes.delete(value);
      else selectedTypes.add(value);
      var selected = selectedTypes.has(value);
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
      syncSelection();
    });
  });

  form.addEventListener("click", function (event) {
    var next = event.target.closest("[data-next]");
    var back = event.target.closest("[data-back]");
    var jump = event.target.closest("[data-step-jump]");

    if (next) {
      if (validateStep(currentStep)) showStep(Number(next.getAttribute("data-next")));
      return;
    }

    if (back) {
      showStep(Number(back.getAttribute("data-back")));
      return;
    }

    if (jump) {
      var target = Number(jump.getAttribute("data-step-jump"));
      if (target <= maxVisitedStep) showStep(target);
    }
  });

  function setStatus(state, message, fallbackUrl) {
    formStatus.setAttribute("data-state", state);
    formStatus.replaceChildren(document.createTextNode(message || ""));
    if (!fallbackUrl) return;
    var link = document.createElement("a");
    link.href = fallbackUrl;
    link.textContent = " Email me directly";
    formStatus.appendChild(link);
  }

  function buildMailto(formData, projectTypes) {
    var lines = [
      "PROJECT TYPE:\n" + projectTypes,
      "NAME:\n" + formData.get("name"),
      "EMAIL:\n" + formData.get("email"),
      "COMPANY:\n" + (formData.get("company") || "N/A"),
      "TIMELINE:\n" + (formData.get("timeline") || "Not specified"),
      "BUDGET:\n" + (formData.get("budget") || "Not specified"),
      "PROJECT:\n" + formData.get("projectDescription")
    ];
    if (selectedTypes.has("other") && otherInput.value.trim()) lines.splice(1, 0, "OTHER SERVICE:\n" + otherInput.value.trim());
    return {
      body: lines.join("\n\n"),
      url: "mailto:" + recipient + "?subject=" + encodeURIComponent("Start a project: " + projectTypes) + "&body=" + encodeURIComponent(lines.join("\n\n"))
    };
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (form.getAttribute("data-state") === "success" || !validateStep(3)) return;

    var formData = new FormData(form);
    var projectTypes = Array.from(selectedTypes).map(function (value) { return labels[value]; }).join(", ");
    var fallback = buildMailto(formData, projectTypes);
    formData.set("projectTypes", projectTypes);
    formData.set("message", fallback.body);

    if (window.location.protocol === "file:") {
      window.location.assign(fallback.url);
      return;
    }

    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    submitButton.textContent = "Sending…";
    setStatus("pending", "Sending your project request…");

    fetch(form.action, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
      credentials: "same-origin"
    })
      .then(function (response) {
        return response.text().then(function (text) {
          var data = null;
          try { data = text ? JSON.parse(text) : null; } catch (error) {}
          if (!response.ok || !data || data.ok !== true) {
            throw new Error(data && data.error ? data.error : "Unable to send automatically");
          }
          return data;
        });
      })
      .then(function () {
        form.setAttribute("data-state", "success");
        submitButton.textContent = "Project sent";
        setStatus("success", "Thanks — your project request has been sent.");
      })
      .catch(function () {
        form.setAttribute("data-state", "error");
        submitButton.disabled = false;
        submitButton.textContent = "Try again";
        setStatus("error", "Automatic sending failed.", fallback.url);
      })
      .finally(function () {
        submitButton.setAttribute("aria-busy", "false");
      });
  });

  Array.prototype.slice.call(form.querySelectorAll("input, textarea, select")).forEach(function (input) {
    input.addEventListener("input", function () {
      setError(input, "");
      if (form.getAttribute("data-state") === "error") setStatus("idle", "");
    });
  });

  if (description && descriptionCount) {
    description.addEventListener("input", function () {
      descriptionCount.value = description.value.length + " / 4000";
      descriptionCount.textContent = descriptionCount.value;
    });
  }

  updateProgress(1);
  syncSelection();
})();
