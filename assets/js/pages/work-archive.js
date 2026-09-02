(function() {
  'use strict';

  if (!document.body.classList.contains('work-archive') && !document.querySelector('.home-work-archive')) return;

  var DESKTOP_MQ = window.matchMedia('(min-width: 1100px)');
  var REDUCED_MOTION_MQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  var state = {
    activeListProjectId: null
  };

  var listRoot = document.getElementById('work-list-projects');
  var listView = document.querySelector('#work .work-list');
  var listHoverScope = document.querySelector('#work .work-list');
  var projects = listRoot
    ? Array.prototype.slice.call(listRoot.querySelectorAll('.work-list-project'))
    : [];

  if (!listRoot || !listView || !listHoverScope || !projects.length) return;

  function setupRevealObserver() {
    var revealTargets = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!revealTargets.length) return;

    if (REDUCED_MOTION_MQ.matches || !('IntersectionObserver' in window)) {
      revealTargets.forEach(function(el) {
        el.classList.add('is-inview');
      });
      return;
    }

    var observer = new IntersectionObserver(function(entries, obs) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-inview');
        obs.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.18
    });

    revealTargets.forEach(function(el) {
      observer.observe(el);
    });
  }

  function setupHeroParallax() {
    var hero = document.querySelector('.work-hero');
    var floats = Array.prototype.slice.call(document.querySelectorAll('.work-hero__float'));
    if (!hero || !floats.length) return;

    if (REDUCED_MOTION_MQ.matches) return;

    var ticking = false;
    var multipliers = [18, -14, 10];

    function update() {
      var rect = hero.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight || 1;
      var progress = Math.max(-1, Math.min(1, (vh - rect.top) / (vh + rect.height)));

      floats.forEach(function(floatEl, idx) {
        var offset = (multipliers[idx % multipliers.length] * progress).toFixed(2);
        floatEl.style.transform = 'translate3d(0,' + offset + 'px,0)';
      });
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  function formatIndex(index) {
    return String(index + 1).padStart(2, '0');
  }

  function getRenderedListProjects() {
    return projects.filter(function(projectEl) {
      return !projectEl.hidden;
    });
  }

  function clearActiveListProject() {
    state.activeListProjectId = null;
    projects.forEach(function(projectEl) {
      projectEl.classList.remove('is-active');
      projectEl.setAttribute('aria-current', 'false');
    });
  }

  function activateListProjectById(id) {
    var rendered = getRenderedListProjects();
    if (!rendered.length) {
      clearActiveListProject();
      return;
    }

    var nextId = id;
    var nextProject = rendered.find(function(projectEl) {
      return projectEl.getAttribute('data-project-id') === String(nextId);
    });

    if (!nextProject) {
      nextProject = rendered[0];
      nextId = nextProject.getAttribute('data-project-id');
    }

    state.activeListProjectId = nextId;

    rendered.forEach(function(projectEl) {
      var active = projectEl === nextProject;
      projectEl.classList.toggle('is-active', active);
      projectEl.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  function syncDefaultListActiveProject() {
    var rendered = projects;
    if (!rendered.length) {
      clearActiveListProject();
      return;
    }

    if (!DESKTOP_MQ.matches || REDUCED_MOTION_MQ.matches) {
      activateListProjectById(rendered[0].getAttribute('data-project-id'));
      return;
    }

    activateListProjectById(state.activeListProjectId || rendered[0].getAttribute('data-project-id'));
  }

  function normalizeProjects() {
    projects.forEach(function(projectEl, index) {
      projectEl.hidden = false;
      var numberEl = projectEl.querySelector('.project-number');
      if (numberEl) numberEl.textContent = formatIndex(index);
    });
  }

  function syncViewUi() {
    listView.classList.add('active');
    syncDefaultListActiveProject();
  }

  function handleListHover(event) {
    if (!DESKTOP_MQ.matches || REDUCED_MOTION_MQ.matches) return;

    var projectEl = event.target && event.target.closest ? event.target.closest('.work-list-project') : null;
    if (!projectEl || !listRoot.contains(projectEl) || projectEl.hidden) return;

    activateListProjectById(projectEl.getAttribute('data-project-id'));
  }

  listRoot.addEventListener('mouseover', handleListHover);
  listRoot.addEventListener('focusin', handleListHover);
  listHoverScope.addEventListener('mouseleave', function() {
    syncDefaultListActiveProject();
  });

  if (DESKTOP_MQ && typeof DESKTOP_MQ.addEventListener === 'function') {
    DESKTOP_MQ.addEventListener('change', syncDefaultListActiveProject);
  }

  if (REDUCED_MOTION_MQ && typeof REDUCED_MOTION_MQ.addEventListener === 'function') {
    REDUCED_MOTION_MQ.addEventListener('change', syncDefaultListActiveProject);
  }

  normalizeProjects();
  syncViewUi();
  setupRevealObserver();
  setupHeroParallax();
})();
