'use strict';

(function() {
  if (!document.body || !document.body.classList.contains('home-index')) return;

  var phoneSliderSection = document.querySelector('[data-phone-slider]');
  if (!phoneSliderSection) return;

  var slides = phoneSliderSection.querySelectorAll('.phone-slide');
  var dots = phoneSliderSection.querySelectorAll('.phone-slider-dot');
  var progressBar = phoneSliderSection.querySelector('.phone-slider-progress-bar');
  var headlineContainer = document.getElementById('slider-headline');
  
  if (!slides.length || !dots.length || !progressBar) return;

  // State management
  var state = {
    currentIndex: 0,
    totalSlides: slides.length,
    isScrolling: false,
    isAnimating: false
  };

  // Headline content for each slide
  var headlineContent = [
    {
      sub: 'Strategy',
      row1: ['BRAND', 'IDENTITY'],
      row2: ['VISUAL', 'SYSTEM']
    },
    {
      sub: 'Motion',
      row1: ['DIGITAL', 'DESIGN'],
      row2: ['INTERACTIVE', 'EXPERIENCE']
    },
    {
      sub: 'Creative',
      row1: ['ART', 'DIRECTION'],
      row2: ['STUDIO', 'WORK']
    }
  ];

  // Initialize slides
  function initSlides() {
    if (typeof gsap !== 'undefined') {
      slides.forEach(function(slide) {
        gsap.set(slide, {
          opacity: 0,
          scale: 0.95,
          y: 30
        });
      });
      
      // Show first slide
      showSlide(0);
      
      // Animate initial headline
      if (headlineContainer) {
        var spans = headlineContainer.querySelectorAll('span');
        gsap.fromTo(spans, 
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: 'power2.out',
            delay: 0.4
          }
        );
      }
    }
  }

  // Show specific slide
  function showSlide(index) {
    if (index < 0 || index >= state.totalSlides) return;
    
    if (typeof gsap !== 'undefined') {
      slides.forEach(function(slide, i) {
        if (i === index) {
          gsap.to(slide, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out'
          });
        } else {
          gsap.to(slide, {
            opacity: 0,
            scale: 0.95,
            y: -30,
            duration: 0.6,
            ease: 'power2.inOut'
          });
        }
      });
    } else {
      slides.forEach(function(slide, i) {
        slide.classList.toggle('active', i === index);
      });
    }
  }

  // Update headline content with animation
  function updateHeadline(index) {
    if (!headlineContainer || !headlineContent[index]) return;
    
    var content = headlineContent[index];
    var sub = headlineContainer.querySelector('.headline-sub');
    var row1Spans = headlineContainer.querySelectorAll('.headline-row:first-child span');
    var row2Spans = headlineContainer.querySelectorAll('.headline-row:last-child span');
    
    if (typeof gsap !== 'undefined') {
      // Animate out current text first
      var allSpans = headlineContainer.querySelectorAll('span');
      gsap.to(allSpans, {
        opacity: 0,
        y: -10,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: function() {
          // Update content
          if (sub) sub.textContent = content.sub;
          if (row1Spans[0]) row1Spans[0].textContent = content.row1[0];
          if (row1Spans[1]) row1Spans[1].textContent = content.row1[1];
          if (row2Spans[0]) row2Spans[0].textContent = content.row2[0];
          if (row2Spans[1]) row2Spans[1].textContent = content.row2[1];
          
          // Animate in new text
          var newSpans = headlineContainer.querySelectorAll('span');
          gsap.fromTo(newSpans, 
            { opacity: 0, y: 10 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.08,
              ease: 'power2.out'
            }
          );
        }
      });
    } else {
      // Fallback without animation
      if (sub) sub.textContent = content.sub;
      if (row1Spans[0]) row1Spans[0].textContent = content.row1[0];
      if (row1Spans[1]) row1Spans[1].textContent = content.row1[1];
      if (row2Spans[0]) row2Spans[0].textContent = content.row2[0];
      if (row2Spans[1]) row2Spans[1].textContent = content.row2[1];
    }
  }

  // Update UI elements
  function updateUI(index) {
    // Update dots
    dots.forEach(function(dot, i) {
      dot.classList.toggle('active', i === index);
    });
    
    // Update progress bar
    var progress = state.totalSlides > 1 ? (index / (state.totalSlides - 1)) * 100 : 0;
    progressBar.style.width = progress + '%';
  }

  // Main slide change function
  function changeSlide(index) {
    if (index < 0 || index >= state.totalSlides || state.isAnimating) return;
    if (index === state.currentIndex) return;
    
    state.isAnimating = true;
    state.currentIndex = index;
    
    showSlide(index);
    updateHeadline(index);
    updateUI(index);
    
    setTimeout(function() {
      state.isAnimating = false;
    }, 600);
  }

  // ScrollTrigger integration
  function initScrollTrigger() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    
    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
      trigger: phoneSliderSection,
      start: 'top top',
      end: '+=300%',
      scrub: 1,
      pin: true,
      anticipatePin: 1,
      onUpdate: function(self) {
        var progress = self.progress;
        var slideIndex = Math.floor(progress * state.totalSlides);
        
        if (slideIndex >= state.totalSlides) slideIndex = state.totalSlides - 1;
        if (slideIndex < 0) slideIndex = 0;
        
        if (slideIndex !== state.currentIndex) {
          changeSlide(slideIndex);
        }
        
        progressBar.style.width = (progress * 100) + '%';
      }
    });
  }

  // Click navigation
  function initClickNavigation() {
    dots.forEach(function(dot, index) {
      dot.addEventListener('click', function() {
        changeSlide(index);
      });
    });
  }

  // Touch navigation
  function initTouchNavigation() {
    var touchStartX = 0;
    var touchEndX = 0;
    
    phoneSliderSection.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    phoneSliderSection.addEventListener('touchend', function(e) {
      touchEndX = e.changedTouches[0].screenX;
      var deltaX = touchEndX - touchStartX;
      
      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          changeSlide(Math.max(state.currentIndex - 1, 0));
        } else {
          changeSlide(Math.min(state.currentIndex + 1, state.totalSlides - 1));
        }
      }
    }, { passive: true });
  }

  // Keyboard navigation
  function initKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        changeSlide(Math.min(state.currentIndex + 1, state.totalSlides - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        changeSlide(Math.max(state.currentIndex - 1, 0));
      }
    });
  }

  // Initialize everything
  function init() {
    initSlides();
    initScrollTrigger();
    initClickNavigation();
    initTouchNavigation();
    initKeyboardNavigation();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

})();

