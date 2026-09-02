/* Enhanced GSAP Interactions for Kicksjoint Page */
(function() {
  'use strict';

  function initEnhancedInteractions() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // Hero section entrance animation
    const heroImage = document.querySelector('.oldhero .img-fluid');
    if (heroImage) {
      gsap.from(heroImage, {
        scale: 1.15,
        opacity: 0,
        duration: 1.8,
        ease: 'power2.out'
      });
    }

    // Hero text reveal
    const heroDescriptions = document.querySelectorAll('.oldhero .features__description');
    heroDescriptions.forEach((desc, index) => {
      gsap.from(desc, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.5 + (index * 0.1)
      });
    });

    // Grid items scroll reveal
    const gridItems = document.querySelectorAll('.grid-item2, .grid-item1');
    gridItems.forEach((item, index) => {
      gsap.from(item, {
        scrollTrigger: {
          trigger: item,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        y: 60,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        delay: Math.min(index * 0.05, 0.3)
      });
    });

    // Parallax effect on grid images
    const gridImages = document.querySelectorAll('.grid-item2 img, .grid-item1 img');
    gridImages.forEach(img => {
      gsap.to(img, {
        scrollTrigger: {
          trigger: img,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5
        },
        y: -40,
        scale: 1.05,
        ease: 'none'
      });
    });

    // Interactive hover effects for grid items
    const gridItemsWithImages = document.querySelectorAll('.grid-item2, .grid-item1');
    gridItemsWithImages.forEach(item => {
      const img = item.querySelector('img');
      if (img) {
        item.addEventListener('mouseenter', () => {
          gsap.to(img, {
            scale: 1.08,
            duration: 0.4,
            ease: 'power2.out'
          });
        });
        
        item.addEventListener('mouseleave', () => {
          gsap.to(img, {
            scale: 1,
            duration: 0.4,
            ease: 'power2.out'
          });
        });
      }
    });

    // Next project marquee enhancement
    const marquee = document.querySelector('.next-project-marquee');
    if (marquee) {
      const marqueeItems = marquee.querySelectorAll('.next-project-marquee__item');
      marqueeItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
          gsap.to(item, {
            scale: 1.1,
            duration: 0.3,
            ease: 'power2.out'
          });
        });
        
        item.addEventListener('mouseleave', () => {
          gsap.to(item, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out'
          });
        });
      });
    }

    // Next project section reveal
    const nextProject = document.querySelector('.project-next');
    if (nextProject) {
      gsap.from(nextProject, {
        scrollTrigger: {
          trigger: nextProject,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        },
        y: 50,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out'
      });
    }

    // Next project media hover effects
    const mediaLinks = document.querySelectorAll('.project-next__media-link');
    mediaLinks.forEach(link => {
      const img = link.querySelector('img');
      const caption = link.querySelector('.project-next__caption');
      
      if (img) {
        link.addEventListener('mouseenter', () => {
          gsap.to(img, {
            scale: 1.05,
            duration: 0.4,
            ease: 'power2.out'
          });
          if (caption) {
            gsap.to(caption, {
              y: -5,
              opacity: 1,
              duration: 0.3,
              ease: 'power2.out'
            });
          }
        });
        
        link.addEventListener('mouseleave', () => {
          gsap.to(img, {
            scale: 1,
            duration: 0.4,
            ease: 'power2.out'
          });
          if (caption) {
            gsap.to(caption, {
              y: 0,
              opacity: 0.8,
              duration: 0.3,
              ease: 'power2.out'
            });
          }
        });
      }
    });

    // Footer reveal
    const footer = document.querySelector('.project-footer');
    if (footer) {
      gsap.from(footer, {
        scrollTrigger: {
          trigger: footer,
          start: 'top 90%',
          toggleActions: 'play none none reverse'
        },
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out'
      });
    }

    // Smooth scroll for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          gsap.to(window, {
            duration: 1,
            scrollTo: {
              y: target,
              offsetY: 50
            },
            ease: 'power3.inOut'
          });
        }
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancedInteractions, { once: true });
  } else {
    initEnhancedInteractions();
  }

  // Re-initialize on page load for SPA compatibility
  window.addEventListener('page:ready', initEnhancedInteractions);

})();
