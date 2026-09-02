'use strict';

(function() {
  if (!document.body || !document.body.classList.contains('home-index')) return;

  var microTextElement = document.querySelector('[data-micro-text]');
  if (!microTextElement) return;

  var chars = microTextElement.querySelectorAll('.char');
  if (!chars.length) return;

  var mouse = { x: 0, y: 0 };
  var magneticRadius = 100;
  var magneticStrength = 0.4;

  // Track mouse position
  document.addEventListener('mousemove', function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // Magnetic effect for each character
  chars.forEach(function(char) {
    var rect = char.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;

    char.addEventListener('mouseenter', function() {
      char.classList.add('magnetic');
    });

    char.addEventListener('mouseleave', function() {
      char.classList.remove('magnetic');
      char.style.transform = '';
    });

    // Add wave animation on click
    char.addEventListener('click', function() {
      char.classList.remove('wave');
      void char.offsetWidth; // Trigger reflow
      char.classList.add('wave');
      
      // Trigger bounce on nearby characters
      var charIndex = Array.from(chars).indexOf(char);
      if (charIndex > 0) {
        chars[charIndex - 1].classList.remove('bounce');
        void chars[charIndex - 1].offsetWidth;
        chars[charIndex - 1].classList.add('bounce');
      }
      if (charIndex < chars.length - 1) {
        chars[charIndex + 1].classList.remove('bounce');
        void chars[charIndex + 1].offsetWidth;
        chars[charIndex + 1].classList.add('bounce');
      }
    });
  });

  // Animation loop for magnetic effect
  function animate() {
    chars.forEach(function(char) {
      if (!char.classList.contains('magnetic')) return;

      var rect = char.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;

      var dx = mouse.x - centerX;
      var dy = mouse.y - centerY;
      var distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < magneticRadius) {
        var force = (magneticRadius - distance) / magneticRadius;
        var moveX = dx * force * magneticStrength;
        var moveY = dy * force * magneticStrength;
        
        char.style.transform = 'translate(' + moveX + 'px, ' + moveY + 'px) scale(1.1)';
      } else {
        char.style.transform = '';
      }
    });

    requestAnimationFrame(animate);
  }

  animate();

  // Initial staggered animation on load
  function initEntranceAnimation() {
    chars.forEach(function(char, index) {
      char.style.opacity = '0';
      char.style.transform = 'translateY(30px)';
      
      setTimeout(function() {
        char.style.transition = 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        char.style.opacity = '1';
        char.style.transform = 'translateY(0)';
      }, index * 80);
    });
  }

  // Start entrance animation when element is in view
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        initEntranceAnimation();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  observer.observe(microTextElement);

  // Random character wiggle effect
  function randomWiggle() {
    var randomChar = chars[Math.floor(Math.random() * chars.length)];
    if (randomChar && !randomChar.matches(':hover')) {
      randomChar.classList.remove('wave');
      void randomChar.offsetWidth;
      randomChar.classList.add('wave');
    }
    
    setTimeout(randomWiggle, 3000 + Math.random() * 4000);
  }

  // Start random wiggle after initial animation
  setTimeout(randomWiggle, 2000);

})();
