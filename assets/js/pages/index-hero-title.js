'use strict';

(function() {
  if (!document.body || !document.body.classList.contains('home-index')) return;

  var heroTitle = document.querySelector('.hero-title');
  if (!heroTitle) return;

  // Split text into individual letters
  function splitTextToLetters(element) {
    var text = element.textContent;
    element.innerHTML = '';
    text.split('').forEach(function(char, index) {
      var span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform = 'translateY(30px)';
      element.appendChild(span);
    });
    return element.querySelectorAll('span');
  }

  // Initialize GSAP animation for hero title
  function initHeroTitleAnimation() {
    if (typeof gsap === 'undefined') return;

    var letters = splitTextToLetters(heroTitle);

    // Animate letters with stagger
    gsap.to(letters, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: 'power2.out',
      delay: 0.4
    });

    // Scroll-based disappear at 100vh
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      gsap.to(heroTitle, {
        opacity: 0,
        scrollTrigger: {
          trigger: heroTitle,
          start: 'top top',
          end: '100vh top',
          scrub: 1
        }
      });
    }
  }

  // Start animation when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroTitleAnimation, { once: true });
  } else {
    initHeroTitleAnimation();
  }

})();
