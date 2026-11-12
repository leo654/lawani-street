/*
 * Lawani St. motion kit
 * ---------------------------------------------------------------------------
 * Macro motion: first-visit preloader, page intros, hero scroll choreography,
 * clip-reveal + parallax media, stripe edges on dark sections, footer lift.
 * Micro motion: split-text reveals (chars, lines, opacity, fill), decoding
 * labels, hover shuffles, letter rolls, drawn rules, underlines, contextual
 * cursor, velocity marquee, drag-to-scroll galleries,
 * related-work image follower, copy-email.
 *
 * Every effect is opt-out with data-mk-text="none" / data-mk-off and the
 * whole kit stands down for prefers-reduced-motion.
 */
(function () {
  "use strict";

  if (window.MotionKit) return;

  var root = document.documentElement;
  var body = document.body;
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var page = {
    home: body.classList.contains("home-index"),
    work: body.classList.contains("work-index"),
    caseStudy: body.classList.contains("case-study"),
    contact: body.classList.contains("ll-contact-page"),
    deck: body.classList.contains("ll-deck-page"),
    privacy: body.classList.contains("cookie-privacy-page"),
    error: body.classList.contains("ll-error-page")
  };

  function clearFirstPaintGuards() {
    root.classList.remove("mk-preloading", "mk-arriving", "mk-intro-pending");
  }

  function toArray(list) {
    return Array.prototype.slice.call(list || []);
  }

  function all(selector, scope) {
    return toArray((scope || document).querySelectorAll(selector));
  }

  function revealPlainReveals() {
    all(".ll-reveal").forEach(function (node) { node.classList.add("is-visible"); });
  }

  /* Outline buttons have no surface of their own, so they read the section behind them:
     charcoal ink on light sections, cream on dark ones (button-unified.css paints the two). */
  function tagButtonSurfaces() {
    var OUTLINE = ".ll-button:not(.ll-button--square, .ll-button--solid, .ll-button--glass, .ll-button--media, .ll-sound-toggle, .ll-theme-toggle, .ll-mobile-menu__cta, .ll-mobile-menu__pitch)";
    all(OUTLINE).forEach(function (button) {
      var node = button.parentElement;
      var rgb = null;
      while (node && !rgb) {
        var style = window.getComputedStyle(node);
        var match = /rgba?\(([^)]+)\)/.exec(style.backgroundColor || "");
        if (match) {
          var c = match[1].split(",").map(parseFloat);
          if (c.length < 4 || c[3] > 0.5) rgb = c;
        }
        node = node.parentElement;
      }
      if (!rgb) rgb = [244, 242, 236];
      var light = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255 > 0.5;
      button.classList.toggle("is-on-light", light);
      button.classList.toggle("is-on-dark", !light);
    });
  }
  tagButtonSurfaces();

  if (!gsap || !ScrollTrigger || reduceQuery.matches) {
    clearFirstPaintGuards();
    revealPlainReveals();
    window.MotionKit = { active: false, booted: true };
    window.dispatchEvent(new CustomEvent("mk:booted"));
    return;
  }

  root.classList.add("mk-ready");

  var EXPO = "expo.inOut";
  var GLYPH_SOURCE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var SKIP_TEXT = "[data-mk-text='none'], [aria-hidden='true'], [hidden], [inert], .ll-visually-hidden, .lwa-project__detail, form, .ll-button, .ll-menu-row, header, .mk-preloader, .cookie-consent, [data-ll-clock]";

  /* ---------------------------------------------------------------------
     Helpers
     --------------------------------------------------------------------- */
  function isSkipped(node) {
    return !node || node.hasAttribute("data-mk-done") || Boolean(node.closest(SKIP_TEXT)) ||
      node.getClientRects().length === 0;
  }

  function wrapWords(node, makeChars) {
    toArray(node.childNodes).forEach(function (child) {
      if (child.nodeType === Node.TEXT_NODE) {
        var parts = child.textContent.split(/(\s+)/);
        if (!parts.some(function (part) { return /\S/.test(part); })) return;
        var fragment = document.createDocumentFragment();
        parts.forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            fragment.appendChild(document.createTextNode(" "));
            return;
          }
          var word = document.createElement("span");
          word.className = "mk-word mk-mask";
          if (makeChars) {
            Array.from(part).forEach(function (character) {
              var span = document.createElement("span");
              span.className = "mk-char";
              span.textContent = character;
              word.appendChild(span);
            });
          } else {
            var inner = document.createElement("span");
            inner.className = "mk-line-inner";
            inner.textContent = part;
            word.appendChild(inner);
          }
          fragment.appendChild(word);
        });
        child.parentNode.replaceChild(fragment, child);
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      if (child.matches("svg, img, video, picture, input, select, textarea, br, button, .mk-word")) return;
      wrapWords(child, makeChars);
    });
  }

  function split(node, mode) {
    if (node.hasAttribute("data-mk-split")) return node;
    var label = node.textContent.replace(/\s+/g, " ").trim();
    if (mode === "chars" && label && !node.querySelector("a, button") && !node.hasAttribute("aria-label")) {
      node.setAttribute("aria-label", label);
    }
    wrapWords(node, mode === "chars");
    if (mode === "chars" && node.hasAttribute("aria-label")) {
      all(".mk-word", node).forEach(function (word) { word.setAttribute("aria-hidden", "true"); });
    }
    node.setAttribute("data-mk-split", mode);
    node.classList.add("mk-split");
    return node;
  }

  function groupLines(node) {
    var lines = [];
    var currentTop = null;
    var current = [];
    all(".mk-word", node).forEach(function (word) {
      var top = Math.round(word.getBoundingClientRect().top);
      if (currentTop === null || Math.abs(top - currentTop) < 6) {
        if (currentTop === null) currentTop = top;
        current.push(word.firstElementChild);
      } else {
        lines.push(current);
        current = [word.firstElementChild];
        currentTop = top;
      }
    });
    if (current.length) lines.push(current);
    return lines;
  }

  function shuffledString(text) {
    var characters = Array.from(text);
    var letters = characters.filter(function (character) { return /\S/.test(character); });
    for (var index = letters.length - 1; index > 0; index -= 1) {
      var swap = Math.floor(Math.random() * (index + 1));
      var temp = letters[index];
      letters[index] = letters[swap];
      letters[swap] = temp;
    }
    var pointer = 0;
    return characters.map(function (character) {
      return /\S/.test(character) ? letters[pointer++] : character;
    }).join("");
  }

  function plainTextTarget(node) {
    if (!node) return null;
    if (node.childElementCount === 0) return node.textContent.trim() ? node : null;
    var candidates = all("span, strong, em", node).filter(function (child) {
      return child.childElementCount === 0 && child.textContent.trim() &&
        child.getAttribute("aria-hidden") !== "true" && !child.classList.contains("ll-visually-hidden");
    });
    return candidates[0] || null;
  }

  /* Hayler-style shuffle: the word's own letters jumble for a few beats. */
  var shuffling = new WeakMap();
  function shuffleText(node, options) {
    var target = plainTextTarget(node);
    if (!target) return;
    var settings = Object.assign({ iterations: 7, speed: 42 }, options || {});
    var original = target.getAttribute("data-mk-text-original") || target.textContent;
    target.setAttribute("data-mk-text-original", original);
    var host = target.closest("a, button") || target;
    if (!host.hasAttribute("aria-label") && host === target) target.setAttribute("aria-label", original.trim());

    var previous = shuffling.get(target);
    if (previous) window.clearTimeout(previous);
    var step = 0;
    function tick() {
      step += 1;
      if (step >= settings.iterations) {
        target.textContent = original;
        shuffling.delete(target);
        return;
      }
      target.textContent = shuffledString(original);
      shuffling.set(target, window.setTimeout(tick, settings.speed));
    }
    tick();
  }

  /* Decode: random glyphs resolve into the real text left to right. */
  function decodeText(node, duration) {
    var target = plainTextTarget(node);
    if (!target) return;
    var original = target.getAttribute("data-mk-text-original") || target.textContent;
    target.setAttribute("data-mk-text-original", original);
    var characters = Array.from(original);
    var state = { progress: 0 };
    gsap.to(state, {
      progress: 1,
      duration: duration || 0.9,
      ease: "power2.out",
      onUpdate: function () {
        var fixed = Math.floor(state.progress * characters.length);
        target.textContent = characters.map(function (character, index) {
          if (index < fixed || /\s|\[|\]|\(|\)|\/|\.|,|:/.test(character)) return character;
          return GLYPH_SOURCE.charAt(Math.floor(Math.random() * GLYPH_SOURCE.length));
        }).join("");
      },
      onComplete: function () { target.textContent = original; }
    });
  }

  /* ---------------------------------------------------------------------
     Text reveals
     --------------------------------------------------------------------- */
  /*
   * Hayler text library, mapped onto this site:
   *   slide   = .has-slide   (char clones roll in from above, random, replays on re-entry)
   *   blur    = .has-blur    (chars sharpen out of a blur, scrubbed)
   *   opacity = .has-opacity (words lift from 10% to full, scrubbed)
   *   fill    = .has-fill    (one continuous colour sweep through the text, scrubbed)
   *   decode  = .has-shuffle (glyph shuffle on entry)
   *   lines   = .has-mask    (lines rise out of masks, reset when scrolled back above)
   */
  var TEXT_RULES = [
    { mode: "slide", selector: "main h2, footer h2, .cs-footer h2, .lwa-footer h2, [data-mk-text='slide'], [data-mk-text='chars']" },
    { mode: "blur", selector: ".cs-story__lead, [data-mk-text='blur']" },
    { mode: "opacity", selector: ".ll-skill-sets__copy, [data-mk-text='opacity']" },
    { mode: "fill", selector: ".ll-manifesto__copy > p, [data-mk-text='fill']" },
    { mode: "decode", selector: ".ll-label, .lwa-kicker, .cs-story__label, .ll-skill-sets__eyebrow, .cs-tags li, .lwa-project__tags span, [data-mk-text='decode']" },
    { mode: "lines", selector: "main p, main h3, main blockquote, main li > p, [data-mk-text='lines']" }
  ];

  function revealChars(node, delay) {
    var chars = all(".mk-char", node);
    gsap.set(chars, { yPercent: -100 });
    return gsap.to(chars, {
      yPercent: 0,
      duration: 0.75,
      delay: delay || 0,
      ease: EXPO,
      stagger: { each: 0.0075, from: "random" }
    });
  }

  function revealLines(node, delay) {
    var lines = groupLines(node);
    var timeline = gsap.timeline({ delay: delay || 0 });
    lines.forEach(function (line, index) {
      timeline.fromTo(line, { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: "expo.out" }, index * 0.1);
    });
    return timeline;
  }

  // Every char holds two stacked copies so the roll never shows an empty slot.
  function cloneChars(node) {
    all(".mk-char", node).forEach(function (character) {
      if (character.childElementCount) return;
      var glyph = character.textContent;
      character.textContent = "";
      var first = document.createElement("span");
      first.className = "mk-char__a";
      first.textContent = glyph;
      var second = document.createElement("span");
      second.className = "mk-char__b";
      second.textContent = glyph;
      character.appendChild(first);
      character.appendChild(second);
    });
  }

  function textColour(node) {
    return window.getComputedStyle(node).color;
  }

  function setupText(node, mode) {
    if (isSkipped(node)) return;
    node.setAttribute("data-mk-done", mode);

    if (mode === "decode") {
      ScrollTrigger.create({
        trigger: node,
        start: "top 92%",
        once: true,
        onEnter: function () { decodeText(node, 0.8); }
      });
      return;
    }

    if (mode === "slide") {
      split(node, "chars");
      cloneChars(node);
      node.classList.add("mk-slide");
      var chars = all(".mk-char", node);
      // Hayler animates at most 30 random letters; the rest are simply in place.
      var moving = chars.length > 30 ? gsap.utils.shuffle(chars.slice()).slice(0, 30) : chars;
      var tween = gsap.fromTo(moving, { yPercent: -100 }, {
        yPercent: 0,
        duration: 0.75,
        ease: EXPO,
        stagger: { each: 0.0075, from: "random" },
        paused: true,
        onComplete: function () { node.classList.remove("is-rolling"); }
      });
      node.classList.add("is-rolling");
      ScrollTrigger.create({
        trigger: node,
        start: "top 85%",
        onEnter: function () { node.classList.add("is-rolling"); tween.restart(); },
        onLeaveBack: function () { tween.pause(0); node.classList.add("is-rolling"); }
      });
      return;
    }

    if (mode === "blur") {
      split(node, "chars");
      var glyphs = all(".mk-char", node);
      var colour = textColour(node);
      gsap.set(glyphs, { opacity: 0, x: -6, textShadow: colour + " 0px 0px 12px" });
      gsap.to(glyphs, {
        opacity: 1,
        x: 0,
        textShadow: colour + " 0px 0px 0px",
        duration: 0.75,
        stagger: 0.1,
        ease: "none",
        scrollTrigger: {
          trigger: node,
          start: "top 85%",
          end: function () { return "+=" + node.offsetHeight; },
          scrub: 1,
          invalidateOnRefresh: true
        }
      });
      return;
    }

    if (mode === "opacity") {
      split(node, "words");
      gsap.fromTo(all(".mk-word", node), { opacity: 0.1 }, {
        opacity: 1,
        duration: 0.3,
        stagger: 0.3,
        ease: "none",
        scrollTrigger: {
          trigger: node,
          start: "top 85%",
          end: function () { return "+=" + node.offsetHeight; },
          scrub: 1,
          invalidateOnRefresh: true
        }
      });
      return;
    }

    if (mode === "fill") {
      // One inline run, so the sweep travels line by line like Hayler's .has-fill.
      var run = document.createElement("span");
      run.className = "mk-fill";
      while (node.firstChild) run.appendChild(node.firstChild);
      node.appendChild(run);
      node.setAttribute("data-mk-split", "fill");
      gsap.to(run, {
        backgroundSize: "100% 100%",
        duration: 0.5,
        ease: "none",
        scrollTrigger: {
          trigger: run,
          start: "top 85%",
          end: function () { return "+=" + run.offsetHeight; },
          scrub: 2,
          invalidateOnRefresh: true
        }
      });
      return;
    }

    if (mode === "lines") {
      split(node, "words");
      var inners = all(".mk-line-inner", node);
      gsap.set(inners, { yPercent: 100 });
      var lineTimeline = null;
      ScrollTrigger.create({
        trigger: node,
        start: "top 80%",
        onEnter: function () {
          if (!lineTimeline || !lineTimeline.isActive()) lineTimeline = revealLines(node);
        }
      });
      ScrollTrigger.create({
        trigger: node,
        start: "top 100%",
        onLeaveBack: function () {
          if (lineTimeline) lineTimeline.kill();
          lineTimeline = null;
          gsap.set(inners, { yPercent: 100 });
        }
      });
    }
  }

  function initText(scope) {
    TEXT_RULES.forEach(function (rule) {
      all(rule.selector, scope).forEach(function (node) {
        if (node.hasAttribute("data-mk-done")) return;
        // Footers keep their body text static so nothing shifts at the end of the page; only the
        // headline ("Let's Talk.") rolls in like "From idea to impact." (one-shot, not scrubbed).
        if (node.closest("footer") && !(rule.mode === "slide" && node.matches("h2"))) return;
        if (rule.mode === "lines" && node.querySelector("p, h1, h2, h3, ul, ol, div")) return;
        if (node.matches("main h1")) return;
        if ((rule.mode === "slide" || rule.mode === "blur" || rule.mode === "lines") && node.closest("a, button")) return;
        setupText(node, rule.mode);
      });
    });
  }

  /* ---------------------------------------------------------------------
     Page intro (after preloader / arrival cover / immediately)
     --------------------------------------------------------------------- */
  function buildIntro() {
    var timeline = gsap.timeline({ paused: true, defaults: { ease: EXPO } });
    var header = all(".ll-floating-header > *");
    if (header.length) {
      timeline.fromTo(header, { yPercent: -180 }, { yPercent: 0, duration: 1.2, stagger: 0.08, clearProps: "transform" }, 0.15);
    }

    // Hayler HeroCaptionAnimation: each title line rises out of its mask with
    // opacity, expo.out, 1.5s minus 0.2s per line, lines 0.1s apart.
    var captionStart = page.home ? 0.55 : 0.2;
    var heading = document.querySelector("main h1");
    if (heading && !heading.closest("[aria-hidden='true'], [hidden]")) {
      split(heading, "words");
      heading.setAttribute("data-mk-done", "intro");
      groupLines(heading).forEach(function (line, index) {
        gsap.set(line, { yPercent: 100, opacity: 0 });
        timeline.to(line, {
          yPercent: 0,
          opacity: 1,
          duration: Math.max(0.5, 1.5 - index * 0.2),
          ease: "expo.out"
        }, captionStart + index * 0.1);
      });
    }

    // Subtitles and info lines: words per line, 0.05s between lines, 0.1s after the title.
    var subtitleSelector = page.home ? ".ll-home-hero__label, .ll-home-hero__intro" :
      page.caseStudy ? ".cs-hero__meta li" :
      page.work ? ".lwa-kicker, .lwa-hero__intro" :
      page.contact ? ".contact-intro p" :
      page.privacy ? "main > p, main section > p" :
      page.error ? "main p" : null;
    if (subtitleSelector) {
      var subtitleIndex = 0;
      all(subtitleSelector).slice(0, 8).forEach(function (subtitle) {
        if (subtitle.closest("[aria-hidden='true'], [hidden]") || subtitle.getClientRects().length === 0) return;
        split(subtitle, "words");
        subtitle.setAttribute("data-mk-done", "intro");
        groupLines(subtitle).forEach(function (line) {
          var lineIndex = subtitleIndex;
          subtitleIndex += 1;
          gsap.set(line, { yPercent: 100, opacity: 0 });
          timeline.to(line, {
            yPercent: 0,
            opacity: 1,
            duration: Math.max(0.6, 1.5 - lineIndex * 0.1),
            ease: "expo.out"
          }, captionStart + 0.1 + lineIndex * 0.05);
        });
      });
    }

    // Hayler #hero-footer: rises with sine.out as the caption lands; its border draws.
    if (page.home) {
      var rail = all(".ll-home-hero__rail > *:not(.ll-home-hero__rail-line)");
      if (rail.length) timeline.fromTo(rail, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "sine.out" }, captionStart + 0.3);
      var line = document.querySelector(".ll-home-hero__rail-line");
      if (line) timeline.fromTo(line, { scaleX: 0, transformOrigin: "0 50%" }, { scaleX: 1, duration: 0.5, ease: "power1.inOut" }, captionStart + 0.3);
    }

    if (page.contact) {
      var fields = all(".contact-form > *").slice(0, 10);
      if (fields.length) timeline.fromTo(fields, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.05, ease: "expo.out", clearProps: "transform" }, 0.75);
    }

    return timeline;
  }

  var intro = null;
  var introStarted = false;
  function startIntro() {
    if (introStarted) return;
    introStarted = true;
    root.classList.remove("mk-intro-pending");
    if (intro) intro.play(0);
    window.dispatchEvent(new CustomEvent("mk:intro"));
    window.setTimeout(function () { ScrollTrigger.refresh(); }, 1200);
  }

  /* ---------------------------------------------------------------------
     Preloader
     --------------------------------------------------------------------- */
  function runPreloader() {
    var loader = document.createElement("div");
    loader.className = "mk-preloader";
    loader.setAttribute("aria-hidden", "true");
    loader.innerHTML =
      '<div class="mk-preloader__columns"><span></span><span></span><span></span><span></span></div>' +
      '<div class="mk-preloader__top">' +
        '<span class="mk-preloader__mask"><span>Lawani St.</span></span>' +
        '<span class="mk-preloader__mask"><span>London / Everywhere</span></span>' +
      '</div>' +
      '<div></div>' +
      '<div class="mk-preloader__bottom">' +
        '<span class="mk-preloader__mask"><span data-mk-loader-label>Loading</span></span>' +
        '<span class="mk-preloader__mask mk-preloader__counter"><span data-mk-loader-count>000</span></span>' +
      '</div>' +
      '<div class="mk-preloader__track"><span></span></div>';
    body.appendChild(loader);

    var masks = all(".mk-preloader__mask > span", loader);
    var count = loader.querySelector("[data-mk-loader-count]");
    var label = loader.querySelector("[data-mk-loader-label]");
    var bar = loader.querySelector(".mk-preloader__track > span");
    var columns = all(".mk-preloader__columns > span", loader);
    var state = { value: 0 };
    var loaded = document.readyState === "complete";
    var startedAt = performance.now();
    var minimum = 1500;
    var exiting = false;

    gsap.fromTo(masks, { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.06, ease: "expo.out" });
    var labelTimer = window.setInterval(function () { shuffleText(label, { iterations: 6, speed: 45 }); }, 900);

    function render() {
      var value = Math.round(state.value);
      count.textContent = String(value).padStart(3, "0");
      bar.style.transform = "scaleX(" + (state.value / 100).toFixed(3) + ")";
    }

    var crawl = gsap.to(state, { value: 86, duration: 2.6, ease: "power2.out", onUpdate: render });

    function exit() {
      if (exiting) return;
      exiting = true;
      crawl.kill();
      window.clearInterval(labelTimer);
      try { window.sessionStorage.setItem("mk-preloaded", "1"); } catch (error) {}

      var timeline = gsap.timeline({
        onComplete: function () { loader.remove(); }
      });
      timeline.to(state, { value: 100, duration: 0.55, ease: "power2.inOut", onUpdate: render });
      timeline.to(masks, { yPercent: -110, duration: 0.7, stagger: 0.04, ease: "power3.in" }, "+=0.12");
      timeline.to(bar.parentNode, { autoAlpha: 0, duration: 0.3 }, "<");
      timeline.add(function () { root.classList.remove("mk-preloading"); }, ">-0.05");
      // Hayler exit: the four columns lift away in a staggered order.
      [1, 3, 0, 2].forEach(function (columnIndex, order) {
        timeline.to(columns[columnIndex], { scaleY: 0, duration: 1.15, ease: EXPO }, "columns+=" + (order * 0.07));
      });
      timeline.add(startIntro, "columns+=0.4");
    }

    function maybeExit() {
      var wait = Math.max(0, minimum - (performance.now() - startedAt));
      window.setTimeout(exit, wait);
    }

    if (loaded) maybeExit();
    else window.addEventListener("load", maybeExit, { once: true });
    window.setTimeout(exit, 6000);
  }

  /* ---------------------------------------------------------------------
     Media: clip reveal + parallax, thumbnail rails
     --------------------------------------------------------------------- */
  function initMedia() {
    var frames = all(".cs-gallery figure, .cs-story__media, .ll-manifesto__portrait, .ll-manifesto__gallery figure, [data-mk-media]")
      .filter(function (frame) {
        return !frame.hasAttribute("data-mk-off") && !frame.querySelector("iframe") &&
          frame.querySelector("img, video") && !frame.closest("[aria-hidden='true'], [hidden]");
      });

    frames.forEach(function (frame) {
      var media = frame.querySelector("img, video");
      frame.classList.add("mk-media");
      gsap.set(frame, { clipPath: "inset(100% 0% 0% 0%)" });

      ScrollTrigger.create({
        trigger: frame,
        start: "top 92%",
        once: true,
        onEnter: function () {
          gsap.to(frame, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: EXPO, clearProps: "clipPath" });
        }
      });
    });

    all(".lwa-project__rail").forEach(function (rail) {
      var thumbs = all("img", rail);
      if (!thumbs.length) return;
      gsap.set(thumbs, { clipPath: "inset(100% 0% 0% 0%)" });
      ScrollTrigger.create({
        trigger: rail,
        start: "top 94%",
        once: true,
        onEnter: function () {
          gsap.to(thumbs, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, stagger: 0.07, ease: EXPO, clearProps: "clipPath" });
        }
      });
    });
  }

  /* ---------------------------------------------------------------------
     Hero scroll choreography
     --------------------------------------------------------------------- */
  function initHeroScroll() {
    // The home hero film stays untouched; captions follow Hayler's parallax-caption.
    if (page.home) {
      var hero = document.querySelector(".ll-home-hero");
      if (hero) {
        ScrollTrigger.create({
          trigger: hero,
          start: "top top",
          end: "bottom top",
          toggleClass: { targets: hero, className: "mk-onscreen" },
          onToggle: function (self) { hero.classList.toggle("mk-offscreen", !self.isActive && self.progress >= 1); }
        });
        var homeCaption = all(".ll-home-hero__message, .ll-home-hero__intro", hero);
        if (homeCaption.length) {
          gsap.to(homeCaption, {
            opacity: 0,
            yPercent: 10,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: function () { return "+=" + hero.offsetHeight * 0.75; },
              scrub: true,
              invalidateOnRefresh: true
            }
          });
        }
      }
      return;
    }

    // Hayler .parallax-caption: the caption fades out and drifts 10% down while the hero scrolls away.
    var caption = document.querySelector(".cs-hero, .lwa-hero");
    if (caption) {
      gsap.to(caption, {
        opacity: 0,
        yPercent: 10,
        ease: "none",
        scrollTrigger: {
          trigger: caption,
          start: "top top",
          end: function () { return "+=" + caption.offsetHeight; },
          scrub: true,
          invalidateOnRefresh: true
        }
      });
    }
  }

  /* ---------------------------------------------------------------------
     Dark section stripe edge + footer lift
     --------------------------------------------------------------------- */
  function solidBackground(node) {
    var candidates = [node].concat(toArray(node.children));
    for (var index = 0; index < candidates.length; index += 1) {
      var colour = window.getComputedStyle(candidates[index]).backgroundColor;
      if (colour && colour !== "transparent" && !/rgba\(.*,\s*0\)$/.test(colour)) return colour;
    }
    return null;
  }

  function opaque(colour) {
    return colour && colour !== "transparent" && !/rgba\(.*,\s*0\)$/.test(colour) ? colour : null;
  }

  // Colour of whatever sits directly above a section: walk down the last children of the previous sibling.
  function colourAbove(section) {
    var node = section.previousElementSibling;
    var found = null;
    for (var depth = 0; node && depth < 4; depth += 1) {
      found = opaque(window.getComputedStyle(node).backgroundColor) || found;
      node = node.lastElementChild;
    }
    if (found) return found;
    return opaque(window.getComputedStyle(section.parentElement).backgroundColor) ||
      opaque(window.getComputedStyle(body).backgroundColor) ||
      opaque(window.getComputedStyle(root).backgroundColor);
  }

  /*
   * Footers are always the last thing on the page, so a trigger like "top 35%"
   * may never be reached before the page runs out of scroll. Every footer
   * animation therefore runs on ONE scrubbed timeline whose end is clamped to
   * the real maximum scroll, so it always finishes exactly at the bottom.
   */
  function footerRange(section, endFraction) {
    function top() { return section.getBoundingClientRect().top + window.scrollY; }
    return {
      start: function () { return Math.max(0, top() - window.innerHeight); },
      end: function () {
        var startAt = Math.max(0, top() - window.innerHeight);
        var wanted = top() - window.innerHeight * endFraction;
        return Math.max(startAt + 1, Math.min(wanted, ScrollTrigger.maxScroll(window) - 2));
      }
    };
  }

  function initFooters() {
    all(".ll-footer, .cs-footer, .lwa-footer, [data-mk-stripes]").forEach(function (section) {
      if (section.hasAttribute("data-mk-off")) return;
      var own = solidBackground(section);
      var outside = colourAbove(section);
      var stripes = null;

      if (own && outside && own !== outside) {
        section.classList.add("mk-stripes-host");
        stripes = document.createElement("div");
        stripes.className = "mk-stripes";
        stripes.setAttribute("aria-hidden", "true");
        stripes.style.setProperty("--mk-stripe-color", outside);
        var count = window.innerWidth < 720 ? 5 : 9;
        for (var index = 0; index < count; index += 1) stripes.appendChild(document.createElement("span"));
        section.insertBefore(stripes, section.firstChild);
      }

      // Every footer (home, work and project pages) behaves the same: only the stripe edge
      // runs here, and the wordmark reveal lives in footer-wordmark.js. A scrubbed content
      // "lift" is opt-in (data-mk-footer-lift) because it keeps moving after scrolling stops.
      var inner = section.querySelector("[data-mk-footer-lift]");
      if (!stripes && !inner) return;

      var range = footerRange(section, 0.2);
      var timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: range.start,
          end: range.end,
          scrub: 0.8,
          invalidateOnRefresh: true
        }
      });

      if (stripes) {
        // The section above drips away in uneven bands, finishing ~70% through.
        stripeOrder(toArray(stripes.children)).forEach(function (stripe, order) {
          timeline.fromTo(stripe, { scaleY: 1 }, { scaleY: 0, duration: 0.3 }, order * 0.045);
        });
      }

      if (inner) {
        // Content rises out from under the section above (clipped by the footer).
        timeline.fromTo(inner, { y: function () { return -0.16 * window.innerHeight; } }, {
          y: 0,
          duration: 1
        }, 0);
      } else {
        timeline.to({}, { duration: 1 }, 0);
      }
    });
  }

  /* ---------------------------------------------------------------------
     Hayler stripe order: within every group of three, middle, left, right.
     --------------------------------------------------------------------- */
  function stripeOrder(stripes) {
    var ordered = [];
    for (var group = 0; group < stripes.length; group += 3) {
      [1, 0, 2].forEach(function (offset) {
        if (stripes[group + offset]) ordered.push(stripes[group + offset]);
      });
    }
    return ordered;
  }

  function makeStripes(className, colour) {
    var cover = document.createElement("div");
    cover.className = "mk-section-stripes " + className;
    cover.setAttribute("aria-hidden", "true");
    cover.style.setProperty("--mk-stripe-color", colour);
    var count = window.innerWidth < 720 ? 5 : 9;
    for (var index = 0; index < count; index += 1) cover.appendChild(document.createElement("span"));
    return cover;
  }

  /*
   * Section transitions (Hayler .reveal-stripes-top / .reveal-stripes-bottom):
   * where a section's colour differs from its neighbour, the neighbour's colour
   * hangs over the edge in stripes that retract (top) or grow (bottom) on scroll.
   */
  function flowSections(container) {
    return toArray(container.children).filter(function (node) {
      if (!/^(SECTION|DIV|ARTICLE)$/.test(node.tagName)) return false;
      if (node.matches("[hidden], [aria-hidden='true'], .cookie-consent, .ll-hero-showreel")) return false;
      var style = window.getComputedStyle(node);
      return style.display !== "none" && style.position !== "fixed" && style.position !== "absolute" && node.offsetHeight > 120;
    });
  }

  function channels(colour) {
    return (colour || "").match(/[\d.]+/g) ? colour.match(/[\d.]+/g).slice(0, 3).map(Number) : [0, 0, 0];
  }

  function distinct(first, second) {
    if (!first || !second) return true;
    var a = channels(first);
    var b = channels(second);
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > 48;
  }

  function initSectionStripes() {
    var main = document.querySelector("main");
    if (!main) return;
    var sections = flowSections(main);
    var ground = opaque(window.getComputedStyle(body).backgroundColor) || opaque(window.getComputedStyle(root).backgroundColor);
    sections.forEach(function (section, index) {
      if (section.hasAttribute("data-mk-off") || section.matches(".ll-home-hero, .cs-hero, .lwa-hero")) return;
      var own = opaque(window.getComputedStyle(section).backgroundColor);
      // Only accent sections (clearly a different colour from the page) carry the transitions.
      if (!own || !distinct(own, ground)) return;
      var previous = sections[index - 1];
      var next = sections[index + 1];
      var above = previous ? opaque(window.getComputedStyle(previous).backgroundColor) : null;
      var below = next ? opaque(window.getComputedStyle(next).backgroundColor) : null;

      if (above && distinct(above, own)) {
        section.classList.add("mk-stripes-section");
        var top = makeStripes("mk-section-stripes--top", above);
        section.insertBefore(top, section.firstChild);
        var topTimeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: top, start: "top 100%", end: "+=220%", scrub: true, invalidateOnRefresh: true }
        });
        stripeOrder(toArray(top.children)).forEach(function (stripe, order) {
          topTimeline.fromTo(stripe, { scaleY: 1 }, { scaleY: 0, duration: 0.1 }, order * 0.02);
        });
      }

      if (below && distinct(below, own)) {
        section.classList.add("mk-stripes-section");
        var bottom = makeStripes("mk-section-stripes--bottom", below);
        section.appendChild(bottom);
        var bottomTimeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: bottom, start: "top 100%", end: "+=220%", scrub: true, invalidateOnRefresh: true }
        });
        stripeOrder(toArray(bottom.children)).forEach(function (stripe, order) {
          bottomTimeline.fromTo(stripe, { scaleY: 0 }, { scaleY: 1, duration: 0.1 }, order * 0.02);
        });
      }
    });
  }

  /* ---------------------------------------------------------------------
     Rolling digit counters (Hayler .increment-counter)
     --------------------------------------------------------------------- */
  var COUNTER_SELECTOR = ".ll-skill-category__count, [data-mk-counter]";

  function buildDigit(target, start) {
    var column = document.createElement("span");
    column.className = "mk-count";
    var sizer = document.createElement("span");
    sizer.className = "mk-count__sizer";
    sizer.textContent = target;
    var inner = document.createElement("span");
    inner.className = "mk-count__inner";
    for (var lap = 0; lap < 2; lap += 1) {
      for (var digit = 0; digit <= 9; digit += 1) {
        var cell = document.createElement("span");
        cell.textContent = digit;
        cell.style.transform = "translateY(" + (100 * (lap * 10 + digit)) + "%)";
        inner.appendChild(cell);
      }
    }
    column.appendChild(sizer);
    column.appendChild(inner);
    gsap.set(inner, { yPercent: -100 * start });
    return { column: column, inner: inner, target: target, start: start };
  }

  function initCounters() {
    all(COUNTER_SELECTOR).forEach(function (node) {
      if (node.hasAttribute("data-mk-counted") || isSkipped(node)) return;
      var text = node.textContent;
      if (!/\d/.test(text)) return;
      node.setAttribute("data-mk-counted", "");
      node.setAttribute("data-mk-done", "counter");
      if (!node.hasAttribute("aria-label")) node.setAttribute("aria-label", text.trim());
      var startText = (node.getAttribute("data-mk-counter-start") || "").replace(/\D/g, "");
      var digits = [];
      var fragment = document.createDocumentFragment();
      var digitIndex = 0;
      var totalDigits = text.replace(/\D/g, "").length;
      while (startText.length < totalDigits) startText = "0" + startText;
      Array.from(text).forEach(function (character) {
        if (/\d/.test(character)) {
          var built = buildDigit(parseInt(character, 10), parseInt(startText[digitIndex], 10));
          digitIndex += 1;
          digits.push(built);
          fragment.appendChild(built.column);
        } else {
          var plain = document.createElement("span");
          plain.className = "mk-count__plain";
          plain.textContent = character;
          fragment.appendChild(plain);
        }
      });
      node.textContent = "";
      var holder = document.createElement("span");
      holder.setAttribute("aria-hidden", "true");
      holder.appendChild(fragment);
      node.appendChild(holder);

      var timeline = gsap.timeline({ paused: true });
      digits.forEach(function (digit, index) {
        var stop = digit.target;
        if (digit.start > digit.target) stop = 10 + digit.target;
        if (digit.start === digit.target) stop = digit.start + 10;
        timeline.to(digit.inner, { yPercent: -100 * stop, duration: 1.1, ease: EXPO }, 0.12 * index);
      });
      ScrollTrigger.create({
        trigger: node,
        start: "top 100%",
        once: true,
        onEnter: function () { timeline.play(); }
      });
    });
  }

  /* ---------------------------------------------------------------------
     Grouped fades (Hayler [data-animate]): items sharing a row fade in
     together with a 0.1s step.
     --------------------------------------------------------------------- */
  var GROUP_SELECTOR = "main .ll-button:not(.ll-home-hero .ll-button):not(.lwa-project__detail .ll-button):not(.cs-hero .ll-button):not(footer .ll-button):not(.cs-footer .ll-button):not(.lwa-footer .ll-button), .ll-skill-category li, .contact-email-alternative, .cs-story__credits li, [data-mk-animate]";

  function initGroupFades() {
    var items = all(GROUP_SELECTOR).filter(function (node) {
      return !node.hasAttribute("data-mk-grouped") && !node.closest("[hidden], [aria-hidden='true'], header, .mk-preloader, .cookie-consent");
    });
    var rows = [];
    items.forEach(function (node) {
      node.setAttribute("data-mk-grouped", "");
      var top = Math.round(node.getBoundingClientRect().top + window.scrollY);
      var row = rows.find(function (candidate) { return Math.abs(candidate.top - top) < 5; });
      if (!row) {
        row = { top: top, nodes: [] };
        rows.push(row);
      }
      row.nodes.push(node);
    });
    rows.forEach(function (row) {
      row.nodes.forEach(function (node, index) {
        var offset = parseFloat(node.getAttribute("data-mk-animate")) || (node.matches("li") ? 20 : 0);
        gsap.set(node, { autoAlpha: 0, y: offset });
        ScrollTrigger.create({
          trigger: node,
          start: function () { return "top " + (window.innerHeight * 0.85 + offset) + "px"; },
          once: true,
          invalidateOnRefresh: true,
          onEnter: function () {
            gsap.to(node, {
              autoAlpha: 1, y: 0, duration: 0.75, delay: 0.1 * index, ease: "expo.out",
              clearProps: "opacity,visibility,transform"
            });
          }
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Menu timeline (Hayler .menu-timeline): items rise out of masks in order
     --------------------------------------------------------------------- */
  function initMenuTimeline() {
    var menu = document.querySelector("[data-ll-mobile-menu]");
    if (!menu) return;
    menu.classList.add("mk-menu");
    var running = null;
    function items() {
      return all(".ll-mobile-menu__nav > * > .ll-menu-row, .ll-mobile-menu__nav > .ll-menu-row, .ll-menu-group__items.is-open a, .ll-mobile-menu__actions > *, .ll-mobile-menu__cta, .ll-mobile-menu__footer", menu)
        .filter(function (node) { return node.offsetParent !== null; });
    }
    function play(open) {
      if (running) running.kill();
      var list = items();
      if (open) {
        running = gsap.fromTo(list, { yPercent: 100, clipPath: "inset(0% 0% 100% 0%)" }, {
          yPercent: 0,
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.05,
          delay: 0.08,
          clearProps: "transform,clipPath"
        });
      } else {
        running = gsap.to(list, { yPercent: -40, clipPath: "inset(0% 0% 100% 0%)", duration: 0.35, ease: "power3.in", stagger: 0.02, clearProps: "transform,clipPath" });
      }
    }
    var wasOpen = menu.classList.contains("is-open");
    new MutationObserver(function () {
      var open = menu.classList.contains("is-open");
      if (open === wasOpen) return;
      wasOpen = open;
      play(open);
    }).observe(menu, { attributes: true, attributeFilter: ["class"] });
  }

  /* ---------------------------------------------------------------------
     Drawn rules
     --------------------------------------------------------------------- */
  function initRules() {
    all(".lwa-project, .ll-footer__utility, [data-mk-rule]").forEach(function (host) {
      var style = window.getComputedStyle(host);
      var side = parseFloat(style.borderTopWidth) > 0 ? "top" : parseFloat(style.borderBottomWidth) > 0 ? "bottom" : null;
      if (!side) return;
      var colour = side === "top" ? style.borderTopColor : style.borderBottomColor;
      var rule = document.createElement("span");
      rule.className = "mk-rule mk-rule--" + side;
      rule.setAttribute("aria-hidden", "true");
      rule.style.setProperty("--mk-rule-color", colour);
      host.classList.add("mk-rule-host");
      host.style.setProperty("border-" + side + "-color", "transparent", "important");
      host.appendChild(rule);
      ScrollTrigger.create({
        trigger: host,
        start: "top 90%",
        once: true,
        // Hayler .animated-line.in-view: scaleX 0 to 1 from the left, 0.5s ease-in-out.
        onEnter: function () { gsap.to(rule, { scaleX: 1, duration: 0.5, ease: "power1.inOut" }); }
      });
    });
  }

  /* ---------------------------------------------------------------------
     Plain .ll-reveal blocks (previously section-reveals.js)
     --------------------------------------------------------------------- */
  function initBlockReveals() {
    if (page.caseStudy) return; // case-study-ui.js owns these on project pages
    all(".ll-reveal:not([data-mk-block])").forEach(function (node) {
      node.setAttribute("data-mk-block", "");
      ScrollTrigger.create({
        trigger: node,
        start: "top 92%",
        once: true,
        onEnter: function () { node.classList.add("is-visible"); }
      });
    });
  }

  /* ---------------------------------------------------------------------
     Letter roll buttons (replaces button-text-rolls.js)
     --------------------------------------------------------------------- */
  var ROLL_SELECTOR = [
    ".ll-button:not(.ll-button--square, .ll-theme-toggle, .ll-sound-toggle, .ll-button--media)",
    ".cs-footer__actions a",
    ".ll-deck-contact a",
    ".ll-service-product__cta",
    ".project-form__button",
    ".contact-form__submit",
    ".ll-footer__project-cta > a",
    "[data-mk-roll]"
  ].join(",");

  // Hayler .button-text: the whole label lifts out while its copy (data-hover) rises from below.
  function buildRoll(text) {
    var roll = document.createElement("span");
    roll.className = "mk-roll";
    roll.setAttribute("aria-hidden", "true");
    var label = document.createElement("span");
    label.className = "mk-roll__text";
    label.textContent = text;
    label.setAttribute("data-hover", text);
    roll.appendChild(label);
    return roll;
  }

  function initRolls() {
    all(ROLL_SELECTOR).forEach(function (control) {
      if (control.classList.contains("mk-roll-trigger") || control.querySelector(".mk-roll, .ll-text-roll")) return;
      var label = toArray(control.children).find(function (child) {
        return child.tagName === "SPAN" && child.childElementCount === 0 && child.textContent.trim() &&
          child.getAttribute("aria-hidden") !== "true" && !child.classList.contains("ll-visually-hidden");
      });
      var text;
      if (label) {
        text = label.textContent.trim();
        label.replaceChildren(buildRoll(text));
      } else {
        var node = toArray(control.childNodes).find(function (child) {
          return child.nodeType === Node.TEXT_NODE && child.textContent.trim();
        });
        if (!node) return;
        text = node.textContent.trim();
        var holder = document.createElement("span");
        holder.appendChild(buildRoll(text));
        control.replaceChild(holder, node);
      }
      if (!control.hasAttribute("aria-label")) control.setAttribute("aria-label", text);
      control.classList.add("mk-roll-trigger");
    });
  }

  /* ---------------------------------------------------------------------
     Hover shuffles + underlines
     --------------------------------------------------------------------- */
  var SHUFFLE_SELECTOR = ".ll-menu-row, .ll-footer__utility a, .lwa-filter button, .ll-menu-group__items a, [data-mk-shuffle]";
  var UNDERLINE_SELECTOR = ".ll-footer__utility nav a, .contact-email-alternative a, .cookie-privacy-page main a, [data-mk-underline]";

  function initHoverText() {
    all(UNDERLINE_SELECTOR).forEach(function (link) {
      if (link.classList.contains("ll-button") || link.querySelector("svg")) return;
      link.classList.add("mk-underline");
    });

    var lastTarget = null;
    document.addEventListener("pointerover", function (event) {
      var control = event.target.closest(SHUFFLE_SELECTOR);
      if (!control || control === lastTarget) return;
      lastTarget = control;
      shuffleText(control);
    });
    document.addEventListener("pointerout", function (event) {
      if (lastTarget && !lastTarget.contains(event.relatedTarget)) lastTarget = null;
    });
    document.addEventListener("focusin", function (event) {
      var control = event.target.closest(SHUFFLE_SELECTOR);
      if (control) shuffleText(control);
    });
  }

  /* ---------------------------------------------------------------------
     Velocity marquee (client strip) — scroll speeds it up and flips it
     --------------------------------------------------------------------- */
  var scrollVelocity = 0;
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: function (self) { scrollVelocity = self.getVelocity(); }
  });

  function initMarquees() {
    all(".ll-client-strip__track, [data-mk-marquee]").forEach(function (track) {
      var viewport = track.parentElement;
      track.classList.add("mk-marquee-driven");
      var x = 0;
      var direction = -1;
      var boost = 0;
      var dragging = false;
      var dragStart = 0;
      var dragOrigin = 0;
      var lastPointer = 0;
      var lastMoveTime = 0;
      var throwVelocity = 0;
      var half = 0;

      function measure() { half = track.scrollWidth / 2; }
      measure();
      window.addEventListener("resize", measure);

      gsap.ticker.add(function (time, delta) {
        if (!half) return;
        var step = delta / 16.67;
        if (!dragging) {
          if (Math.abs(scrollVelocity) > 30) direction = scrollVelocity > 0 ? -1 : 1;
          boost += (Math.min(Math.abs(scrollVelocity) / 220, 9) - boost) * 0.08;
          throwVelocity *= Math.pow(0.94, step);
          x += (direction * (0.6 + boost) + throwVelocity) * step;
        }
        x = gsap.utils.wrap(-half, 0, x);
        track.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)";
      });

      if (!finePointer) return;
      viewport.classList.add("mk-draggable");
      viewport.setAttribute("data-cursor", "Drag");
      viewport.addEventListener("pointerdown", function (event) {
        if (event.button !== 0) return;
        dragging = true;
        dragStart = event.clientX;
        dragOrigin = x;
        lastPointer = event.clientX;
        lastMoveTime = performance.now();
        throwVelocity = 0;
        viewport.classList.add("is-dragging");
        viewport.setPointerCapture(event.pointerId);
      });
      viewport.addEventListener("pointermove", function (event) {
        if (!dragging) return;
        // px per 60Hz frame, from elapsed time (the raw delta changed with the mouse's polling rate)
        var now = performance.now();
        var sample = (event.clientX - lastPointer) / Math.max(now - lastMoveTime, 1) * 16.67;
        throwVelocity += (sample - throwVelocity) * 0.35;
        lastPointer = event.clientX;
        lastMoveTime = now;
        x = dragOrigin + (event.clientX - dragStart);
      });
      function release() {
        if (!dragging) return;
        dragging = false;
        viewport.classList.remove("is-dragging");
        if (performance.now() - lastMoveTime > 90) throwVelocity = 0; // held still before letting go
        if (Math.abs(throwVelocity) > 1) direction = throwVelocity > 0 ? 1 : -1;
      }
      viewport.addEventListener("pointerup", release);
      viewport.addEventListener("pointercancel", release);
    });
  }

  /* ---------------------------------------------------------------------
     Drag-to-scroll galleries with inertia
     --------------------------------------------------------------------- */
  function initDragScroll() {
    if (!finePointer) return;
    all(".lwa-project__gallery, [data-mk-drag]").forEach(function (gallery) {
      gallery.classList.add("mk-draggable");
      gallery.setAttribute("data-cursor", "Drag");
      all("img", gallery).forEach(function (image) { image.draggable = false; });
      gallery.addEventListener("dragstart", function (event) { event.preventDefault(); });

      /*
       * One owner for the gallery's scroll position. While the mouse is down the
       * scroll position eases toward the pointer (a ~40ms follow, no rigid 1:1
       * stepping); on release it keeps the speed it had and coasts to a stop.
       * CSS scroll-snap is switched off for mouse galleries (see .mk-draggable)
       * because snapping fought every scrollLeft write and made the drag stick,
       * then jump a whole image at a time.
       */
      var down = false;
      var moved = false;
      var coasting = false;
      var running = false;
      var startX = 0;
      var startScroll = 0;
      var target = 0;
      var position = 0;
      var velocity = 0; // px per second

      function limit(value) {
        return Math.max(0, Math.min(gallery.scrollWidth - gallery.clientWidth, value));
      }

      function tick(time, deltaMs) {
        var dt = Math.min(deltaMs || 16.7, 50) / 1000;
        if (down) {
          var next = position + (target - position) * (1 - Math.exp(-dt * 24));
          var instant = dt > 0 ? (next - position) / dt : 0;
          velocity += (instant - velocity) * (1 - Math.exp(-dt * 18));
          position = next;
        } else if (coasting) {
          position += velocity * dt;
          velocity *= Math.exp(-dt * 4.2);
          var bounded = limit(position);
          if (bounded !== position) { position = bounded; velocity = 0; }
          if (Math.abs(velocity) < 8) coasting = false;
        } else {
          stopTicker();
          return;
        }
        gallery.scrollLeft = position;
      }

      function startTicker() {
        if (running) return;
        running = true;
        gsap.ticker.add(tick);
      }

      function stopTicker() {
        if (!running) return;
        running = false;
        gsap.ticker.remove(tick);
      }

      gallery.addEventListener("pointerdown", function (event) {
        if (event.pointerType !== "mouse" || event.button !== 0) return;
        down = true;
        moved = false;
        coasting = false;
        startX = event.clientX;
        startScroll = position = target = gallery.scrollLeft;
        velocity = 0;
        startTicker();
      });
      window.addEventListener("pointermove", function (event) {
        if (!down) return;
        var dx = event.clientX - startX;
        if (!moved && Math.abs(dx) > 4) {
          moved = true;
          gallery.classList.add("is-dragging");
        }
        if (moved) target = limit(startScroll - dx);
      });
      function release() {
        if (!down) return;
        down = false;
        gallery.classList.remove("is-dragging");
        coasting = moved && !reduceQuery.matches && Math.abs(velocity) > 40;
        if (!coasting) stopTicker();
      }
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", release);
      // A wheel or trackpad scroll takes over from any coasting.
      gallery.addEventListener("wheel", function () { coasting = false; }, { passive: true });
      gallery.addEventListener("click", function (event) {
        if (moved) {
          event.preventDefault();
          event.stopPropagation();
          moved = false;
        }
      }, true);
    });
  }

  /* ---------------------------------------------------------------------
     Copy email on click (fine pointers keep a clear fallback to mailto)
     --------------------------------------------------------------------- */
  var toast = null;
  function showToast(message) {
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "mk-toast";
      toast.setAttribute("role", "status");
      body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () { toast.classList.remove("is-visible"); }, 2200);
  }

  function initCopyEmail() {
    if (!finePointer || !navigator.clipboard) return;
    all("a[href^='mailto:']").forEach(function (link) {
      if (!/@/.test(link.textContent)) return;
      link.setAttribute("data-cursor", "Copy");
      link.addEventListener("click", function (event) {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        var address = link.getAttribute("href").replace(/^mailto:/i, "").split("?")[0];
        event.preventDefault();
        navigator.clipboard.writeText(address).then(function () {
          showToast("Email copied — " + address);
          if (cursor) cursor.flash("Copied");
        }, function () {
          window.location.href = link.href;
        });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Cursor, modelled on Hayler (clapat). The real pointer stays visible; a small
     brand-orange square trails it as an accent (a soft, frame-rate independent
     ease), and changes calmly with what it is over:
       buttons   → the square fades away; the button's own hover (orange fill,
                   arrow tile) takes over. No ring or box.
       highlight → text links and menu rows: it swells into a large, faint square
       label     → a word tag centred on the pointer (View, Next, Drag, Copy, Play)
       icon      → a small blurred square with + / − (the expandable work rows)
       hide      → fades out (fields, embeds, the work-list previews)
       loading   → an orange ring that spins while the next page loads
     No stretch, squash or ripple: the motion stays quiet so the hand leads.
     --------------------------------------------------------------------- */
  var cursor = null;
  function initCursor() {
    if (!finePointer || window.innerWidth < 720) return;

    var element = document.createElement("div");
    element.className = "mk-cursor is-out";
    element.setAttribute("aria-hidden", "true");
    element.innerHTML = '<span class="mk-cursor__pos"><span class="mk-cursor__ball"><span class="mk-cursor__text"></span><span class="mk-cursor__icon"></span></span></span>';
    body.appendChild(element);
    root.classList.add("mk-has-cursor");

    var position = element.querySelector(".mk-cursor__pos");
    var ball = element.querySelector(".mk-cursor__ball");
    var text = element.querySelector(".mk-cursor__text");
    var icon = element.querySelector(".mk-cursor__icon");
    var still = reduceQuery.matches;
    var ICONS = {
      plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
      minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
      arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>'
    };

    var DOT = 14;
    var SPEED = 0.2;                       // Hayler's transition speed for every change of state
    var HIDE = "input, textarea, select, iframe, [data-cursor-hide]";
    var ROW = ".lwa-project__toggle";
    var CARD = ".cs-next__card, [data-cursor-solid]";
    var CONTROL = ".ll-button, .ll-nav-toggle, .ll-sound-wave, .ll-footer__back-to-top, .ll-hero-showreel__close, .ll-deck__menu-toggle, .ll-deck__close, .ll-footer__social-links a, [data-cursor-wrap]";
    var HIGHLIGHT = "a, button, [role='button'], label, summary";
    var LABEL_WORDS = /^(view|drag|copy|copied|spin|play|pause|open|close|read|scroll|next|visit)$/i;
    var SOLID_WORDS = /^(view|next|visit)$/i;
    var STATES = ["is-highlight", "is-label", "is-drag", "is-solid", "is-icon", "is-hidden", "is-loading"];

    var mode = "";
    var loading = false;
    var flashing = false;
    var mouse = { x: -1, y: -1 };
    var pos = { x: -1, y: -1 };

    var setX = gsap.quickSetter(position, "x", "px");
    var setY = gsap.quickSetter(position, "y", "px");
    gsap.set(ball, { width: DOT, height: DOT, xPercent: -50, yPercent: -50 });
    // Follow lag in seconds: a soft trail behind the pointer.
    var TRAIL = 0.16;

    function morph(props, duration) {
      gsap.to(ball, Object.assign({ duration: still ? 0.01 : (duration || SPEED), ease: "power1.out", overwrite: "auto" }, props));
    }

    gsap.ticker.add(function (time, deltaMs) {
      if (mouse.x < 0) return;
      var t = mouse;
      if (pos.x < 0 || still) { pos.x = t.x; pos.y = t.y; }
      var k = 1 - Math.exp(-Math.min(deltaMs, 64) / 1000 / TRAIL);
      pos.x += (t.x - pos.x) * k;
      pos.y += (t.y - pos.y) * k;
      setX(pos.x);
      setY(pos.y);
    });

    function labelWidth() {
      var word = text.textContent;
      if (/^drag$/i.test(word)) return Math.ceil(text.scrollWidth) + 76;
      if (SOLID_WORDS.test(word)) return Math.ceil(text.scrollWidth) + 62;
      return Math.ceil(text.scrollWidth) + 40;
    }

    function setMode(next, node) {
      if (flashing) return;
      if (next === mode && next !== "label") return;
      element.classList.remove.apply(element.classList, STATES);
      mode = next;
      gsap.to(ball, { opacity: 1, duration: SPEED, overwrite: false });

      if (next === "hide") {
        element.classList.add("is-hidden");
        morph({ width: 6, height: 6, borderRadius: "2px", opacity: 0 });
        return;
      }
      if (next === "highlight") {
        element.classList.add("is-highlight");
        morph({ width: 80, height: 80, borderRadius: "2px" });
        return;
      }
      if (next === "label") {
        var solid = SOLID_WORDS.test(text.textContent);
        element.classList.add(/^drag$/i.test(text.textContent) ? "is-drag" : solid ? "is-solid" : "is-label");
        morph({ width: labelWidth(), height: solid ? 46 : 42, borderRadius: "21px" });
        gsap.fromTo(text, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: SPEED, overwrite: true });
        if (solid) gsap.fromTo(icon, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: SPEED, overwrite: true });
        return;
      }
      if (next === "icon") {
        element.classList.add("is-icon");
        morph({ width: 40, height: 40, borderRadius: "2px" });
        gsap.fromTo(icon, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: SPEED, overwrite: true });
        return;
      }
      morph({ width: DOT, height: DOT, borderRadius: "2px" });
    }

    function classify(node) {
      if (!node || !node.closest) return ["", null];
      if (node.closest(HIDE)) return ["hide", null];
      var row = node.closest(ROW);
      if (row) {
        var open = row.getAttribute("aria-expanded") === "true";
        icon.innerHTML = open ? ICONS.minus : ICONS.plus;
        return ["icon", row, open ? "minus" : "plus"];
      }
      var card = node.closest(CARD);
      if (card) {
        text.textContent = card.getAttribute("data-cursor-solid") || (card.matches(".cs-next__card") ? "Next" : "View");
        icon.innerHTML = ICONS.arrow;
        return ["label", card];
      }
      var tagged = node.closest("[data-cursor]");
      if (tagged && LABEL_WORDS.test(tagged.getAttribute("data-cursor"))) {
        text.textContent = tagged.getAttribute("data-cursor");
        return ["label", tagged];
      }
      if (node.closest("[data-ll-hero-open]")) {
        text.textContent = "Play";
        return ["label", node.closest("[data-ll-hero-open]")];
      }
      // Buttons and icon controls: no ring or box; the square steps aside and the button's own hover speaks.
      var control = node.closest(CONTROL);
      if (control) return ["hide", null];
      var link = node.closest(HIGHLIGHT);
      if (link) return ["highlight", link];
      return ["", null];
    }

    var iconShown = "";
    function update(node) {
      if (loading) return;
      var result = classify(node);
      if (result[0] === "icon" && mode === "icon") {
        if (result[2] !== iconShown) {
          iconShown = result[2];
          gsap.fromTo(icon, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: SPEED, overwrite: true });
        }
        return;
      }
      iconShown = result[0] === "icon" ? result[2] : "";
      if (result[0] === "label" && mode === "label") {
        var solidNow = SOLID_WORDS.test(text.textContent);
        element.classList.toggle("is-solid", solidNow && !/^drag$/i.test(text.textContent));
        element.classList.toggle("is-label", !solidNow && !/^drag$/i.test(text.textContent));
        morph({ width: labelWidth(), height: solidNow ? 46 : 42 });
        return;
      }
      setMode(result[0], result[1]);
    }

    window.addEventListener("pointermove", function (event) {
      if (event.pointerType !== "mouse") return;
      element.classList.remove("is-out");
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    }, { passive: true });

    document.addEventListener("pointerover", function (event) { update(event.target); });

    // Re-check what is under the pointer once scrolling settles (not every frame: elementFromPoint forces layout).
    var probeTimer = 0;
    window.addEventListener("scroll", function () {
      if (mouse.x < 0) return;
      window.clearTimeout(probeTimer);
      probeTimer = window.setTimeout(function () { update(document.elementFromPoint(mouse.x, mouse.y)); }, 90);
    }, { passive: true });

    document.addEventListener("pointerup", function (event) {
      // Rows flip between + and − once their click has toggled them.
      if (mode === "icon") window.setTimeout(function () { update(document.elementFromPoint(event.clientX, event.clientY)); }, 30);
    });

    // Leaving for another page: the square becomes a spinning orange ring on the pointer until the page goes.
    document.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var link = event.target.closest && event.target.closest("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      var url;
      try { url = new URL(link.href, window.location.href); } catch (error) { return; }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      element.classList.remove.apply(element.classList, STATES);
      element.classList.add("is-loading");
      mode = "loading";
      loading = true;
      morph({ width: 40, height: 40, borderRadius: "50%", opacity: 1 });
    });
    window.addEventListener("pageshow", function () {
      if (!loading) return;
      loading = false;
      element.classList.remove("is-loading");
      mode = "";
      setMode("", null);
    });
    document.documentElement.addEventListener("pointerleave", function () { element.classList.add("is-out"); });
    window.addEventListener("blur", function () { element.classList.add("is-out"); });

    cursor = {
      flash: function (label) {
        text.textContent = label;
        mode = "";
        setMode("label", null);
        flashing = true;
        window.setTimeout(function () {
          flashing = false;
          mode = "";
          if (mouse.x >= 0) update(document.elementFromPoint(mouse.x, mouse.y));
        }, 1100);
      }
    };
  }

  /* ---------------------------------------------------------------------
     Spin on scroll
     --------------------------------------------------------------------- */
  function initSpin() {
    all("[data-mk-spin]").forEach(function (node) {
      gsap.to(node, {
        rotation: parseFloat(node.getAttribute("data-mk-spin")) || 360,
        ease: "none",
        scrollTrigger: { trigger: node, start: "top bottom", end: "bottom top", scrub: 0.5 }
      });
    });
  }

  /* ---------------------------------------------------------------------
     Hayler nav-intro stretch: the closing headline's words grow apart until
     they span the full row as it scrolls up into view.
     --------------------------------------------------------------------- */
  function initStretch() {
    // Opt-in only: add data-mk-stretch to a heading to spread its words apart on scroll.
    // The footer "Let's Talk." headline is deliberately NOT included, so it stays in place.
    all("[data-mk-stretch]").forEach(function (heading) {
      if (heading.hasAttribute("data-mk-stretched")) return;
      if (!heading.hasAttribute("data-mk-split")) split(heading, "words");
      var words = all(".mk-word", heading).filter(function (word) { return word.parentElement === heading; });
      if (words.length < 2) return;
      heading.setAttribute("data-mk-stretched", "");
      heading.classList.add("mk-stretch");
      var moving = words.length >= 3 ? words : words.slice(0, -1);
      gsap.set(moving, { flexGrow: 0 });
      gsap.to(moving, {
        flexGrow: 1 / moving.length,
        ease: "none",
        scrollTrigger: {
          trigger: heading,
          start: "top bottom",
          // Finish within the page even when the headline sits near the very end.
          end: function () {
            var startAt = heading.getBoundingClientRect().top + window.scrollY - window.innerHeight;
            return Math.max(startAt + 1, Math.min(startAt + window.innerHeight * 0.6, ScrollTrigger.maxScroll(window)));
          },
          scrub: true,
          invalidateOnRefresh: true
        }
      });
    });
  }

  /* ---------------------------------------------------------------------
     Hayler nav snap (opt-in via [data-mk-snap]): when scrolling stops with the
     section more than half in view, glide it to the top (expo.inOut, 1.5s).
     No footer uses it by default: it hijacked the scroll at the end of work and
     project pages and made the footer jump or bounce.
     --------------------------------------------------------------------- */
  function initSnap() {
    var section = document.querySelector("[data-mk-snap]");
    if (!section || !window.LawaniMotion) return;
    var timer = 0;
    var snapping = false;
    var disabled = false;
    function expoInOut(t) {
      if (t === 0 || t === 1) return t;
      return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
    }
    section.addEventListener("click", function (event) {
      if (event.target.closest("a, button")) disabled = true;
    });
    window.addEventListener("scroll", function () {
      if (snapping || disabled) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        var rect = section.getBoundingClientRect();
        var visible = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
        if (rect.top < 2 || visible / section.offsetHeight <= 0.5) return;
        var target = Math.min(window.scrollY + rect.top, ScrollTrigger.maxScroll(window));
        if (target - window.scrollY < 2) return;
        snapping = true;
        var release = window.setTimeout(function () { snapping = false; }, 2000);
        window.LawaniMotion.scrollTo(target, {
          duration: 1.5,
          easing: expoInOut,
          onComplete: function () { window.clearTimeout(release); snapping = false; }
        });
      }, 200);
    }, { passive: true });
  }

  /* ---------------------------------------------------------------------
     Hayler copy-email: hovering an address dims everything else to 0.35
     --------------------------------------------------------------------- */
  function initEmailDim() {
    if (!finePointer) return;
    all("a[href^='mailto:']").forEach(function (link) {
      if (!/@/.test(link.textContent)) return;
      var others = null;
      link.addEventListener("mouseenter", function () {
        others = all("main > *, body > footer > *, .cs-footer__main > *, .ll-footer__inner > *").filter(function (node) {
          return !node.contains(link) && !link.contains(node) && !node.querySelector(".cs-footer__main, .ll-footer__inner");
        });
        gsap.to(others, { opacity: 0.35, duration: 0.3, overwrite: "auto" });
      });
      link.addEventListener("mouseleave", function () {
        if (others) gsap.to(others, { opacity: 1, duration: 0.3, overwrite: "auto", clearProps: "opacity" });
        others = null;
      });
    });
  }

  /* ---------------------------------------------------------------------
     Hayler 404 hover: the title lines roll up out of their masks
     --------------------------------------------------------------------- */
  function initErrorHover() {
    if (!page.error) return;
    var title = document.querySelector("main h1");
    if (!title) return;
    var busy = false;
    function roll() {
      if (busy) return;
      var inners = all(".mk-line-inner", title);
      if (!inners.length) return;
      busy = true;
      gsap.to(inners, {
        yPercent: -100,
        duration: 0.5,
        ease: "power2.inOut",
        stagger: 0.05,
        onComplete: function () {
          gsap.set(inners, { yPercent: 0 });
          busy = false;
        }
      });
    }
    title.addEventListener("pointerenter", roll);
    var back = document.querySelector("main a[href$='index.html'], main a[href='/']");
    if (back) back.addEventListener("pointerenter", roll);
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */
  function boot() {
    initCursor();
    initRolls();
    initHoverText();
    initCopyEmail();
    initEmailDim();
    initMenuTimeline();

    if (!page.deck) {
      intro = buildIntro();
      initCounters();
      initText(document.querySelector("main"));
      initText(document.querySelector("footer"));
      initMedia();
      initHeroScroll();
      initFooters();
      initSectionStripes();
      initRules();
      initGroupFades();
      initBlockReveals();
      initMarquees();
      initDragScroll();
      initSpin();
      initStretch();
      initSnap();
      initErrorHover();
    }

    var preloading = root.classList.contains("mk-preloading");
    // motion-system.js takes the first-paint `mk-arriving` class off as soon as its own curtain is in place, so it also
    // says so itself (LawaniMotion.arriving). The page stays perfectly still while the curtain lifts: the intro
    // waits until the last band has cleared (LawaniMotion.cleared / the ll:page-cleared event).
    var motion = window.LawaniMotion || {};
    var arriving = root.classList.contains("mk-arriving") || motion.arriving === true;
    if (preloading) {
      runPreloader();
    } else if (arriving) {
      if (motion.cleared) {
        window.setTimeout(startIntro, 60); // the curtain was already gone by the time the kit booted
      } else {
        // the reveal waits up to ~1.4s for the page to settle, then takes about 1s to lift
        var fallback = window.setTimeout(startIntro, 4200);
        window.addEventListener("ll:page-cleared", function () {
          window.clearTimeout(fallback);
          window.setTimeout(startIntro, 60);
        }, { once: true });
      }
    } else {
      startIntro();
    }

    // Lazy images and expanding panels change the page height after triggers were measured;
    // re-measure (debounced) whenever the document actually grows or shrinks.
    if ("ResizeObserver" in window) {
      var lastHeight = document.documentElement.scrollHeight;
      var refreshTimer = 0;
      new ResizeObserver(function () {
        var height = document.documentElement.scrollHeight;
        if (Math.abs(height - lastHeight) < 2) return;
        lastHeight = height;
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(function () { ScrollTrigger.refresh(); }, 180);
      }).observe(body);
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
    window.addEventListener("load", function () { ScrollTrigger.refresh(); }, { once: true });
  }

  window.MotionKit = {
    active: true,
    shuffle: shuffleText,
    decode: decodeText,
    split: split,
    revealBlocks: initBlockReveals,
    refresh: function () { ScrollTrigger.refresh(); }
  };

  try {
    boot();
  } catch (error) {
    console.error("Motion kit failed; showing static content.", error);
    clearFirstPaintGuards();
    revealPlainReveals();
    all("[data-mk-split] .mk-char, [data-mk-split] .mk-line-inner").forEach(function (node) { node.style.transform = "none"; });
  }

  // Set-up is done: the page transition (motion-system.js) waits for this before it lifts the curtain, so none
  // of this work can stutter the reveal.
  window.MotionKit.booted = true;
  window.dispatchEvent(new CustomEvent("mk:booted"));
})();
