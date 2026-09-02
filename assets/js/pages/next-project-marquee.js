/* Next Project Marquee Slider */
(function() {
  'use strict';

  function initMarquee() {
    const marquees = document.querySelectorAll('.next-project-marquee');
    
    marquees.forEach(marquee => {
      const track = marquee.querySelector('.next-project-marquee__track');
      if (!track) return;

      // Check if already initialized
      if (track.dataset.marqueeInitialized === '1') return;
      track.dataset.marqueeInitialized = '1';

      // Clone sets for seamless loop if needed
      const sets = track.querySelectorAll('.next-project-marquee__set');
      if (sets.length === 1) {
        const clone = sets[0].cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      }

      // Use GSAP if available, otherwise CSS animation
      if (window.gsap && typeof window.gsap.to === 'function') {
        const trackWidth = track.scrollWidth;
        const speed = 60; // seconds for full loop
        
        // Register Draggable if available
        if (window.Draggable) {
          gsap.registerPlugin(Draggable);
          
          // Create the continuous animation
          const animation = gsap.to(track, {
            x: -trackWidth / 2,
            duration: speed,
            repeat: -1,
            ease: 'none',
            paused: false
          });

          // Create drag cursor elements
          const dragCursor = document.createElement('div');
          dragCursor.className = 'drag-cursor';
          dragCursor.innerHTML = `
            <div class="drag-cursor-dot drag-cursor-dot-left"></div>
            <div class="drag-cursor-dot drag-cursor-dot-right"></div>
          `;
          document.body.appendChild(dragCursor);

          // Create draggable instance
          Draggable.create(track, {
            type: 'x',
            bounds: {
              minX: -trackWidth / 2,
              maxX: 0
            },
            inertia: true,
            edgeResistance: 0.8,
            throwResistance: 2000,
            onDragStart: function() {
              animation.pause();
              track.style.cursor = 'grabbing';
              marquee.style.cursor = 'grabbing';
              dragCursor.classList.add('dragging');
              
              // Hide default cursor ring during drag
              const cursorRing = document.getElementById('cursorRing');
              if (cursorRing) cursorRing.style.opacity = '0';
            },
            onDrag: function() {
              // Update animation progress based on current position
              const currentX = this.x;
              const progress = (currentX / (-trackWidth / 2)) % 1;
              animation.progress(progress < 0 ? 1 + progress : progress);
              
              // Update drag cursor position
              dragCursor.style.left = this.pointerX + 'px';
              dragCursor.style.top = this.pointerY + 'px';
            },
            onDragEnd: function() {
              track.style.cursor = 'grab';
              marquee.style.cursor = 'grab';
              dragCursor.classList.remove('dragging');
              
              // Show default cursor ring again
              const cursorRing = document.getElementById('cursorRing');
              if (cursorRing) cursorRing.style.opacity = '1';
              
              // Resume animation from new position
              const currentX = this.x;
              const progress = (currentX / (-trackWidth / 2)) % 1;
              animation.progress(progress < 0 ? 1 + progress : progress);
              animation.resume();
            },
            onPress: function() {
              track.style.cursor = 'grabbing';
              marquee.style.cursor = 'grabbing';
              dragCursor.classList.add('dragging');
            },
            onRelease: function() {
              track.style.cursor = 'grab';
              marquee.style.cursor = 'grab';
              dragCursor.classList.remove('dragging');
            }
          });

          // Show drag cursor on hover
          marquee.addEventListener('mouseenter', () => {
            dragCursor.style.opacity = '1';
            marquee.style.cursor = 'grab';
          });

          marquee.addEventListener('mouseleave', () => {
            dragCursor.style.opacity = '0';
          });

          marquee.addEventListener('mousemove', (e) => {
            dragCursor.style.left = e.clientX + 'px';
            dragCursor.style.top = e.clientY + 'px';
          });

          // Set cursor style
          marquee.style.cursor = 'grab';
          track.style.cursor = 'grab';
        } else {
          // Fallback to manual drag implementation without Draggable
          const animation = gsap.to(track, {
            x: -trackWidth / 2,
            duration: speed,
            repeat: -1,
            ease: 'none',
            paused: false
          });

          // Create drag cursor elements
          const dragCursor = document.createElement('div');
          dragCursor.className = 'drag-cursor';
          dragCursor.innerHTML = `
            <div class="drag-cursor-dot drag-cursor-dot-left"></div>
            <div class="drag-cursor-dot drag-cursor-dot-right"></div>
          `;
          document.body.appendChild(dragCursor);

          let isDragging = false;
          let startX = 0;
          let currentX = 0;

          // Show drag cursor on hover
          marquee.addEventListener('mouseenter', () => {
            dragCursor.style.opacity = '1';
            marquee.style.cursor = 'grab';
          });

          marquee.addEventListener('mouseleave', () => {
            dragCursor.style.opacity = '0';
          });

          marquee.addEventListener('mousemove', (e) => {
            dragCursor.style.left = e.clientX + 'px';
            dragCursor.style.top = e.clientY + 'px';
          });

          // Mouse events
          marquee.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            currentX = gsap.getProperty(track, 'x');
            animation.pause();
            track.style.cursor = 'grabbing';
            marquee.style.cursor = 'grabbing';
            dragCursor.classList.add('dragging');
            
            const cursorRing = document.getElementById('cursorRing');
            if (cursorRing) cursorRing.style.opacity = '0';
          });

          window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - startX;
            const newX = currentX + deltaX;
            // Clamp to bounds
            const clampedX = Math.max(-trackWidth / 2, Math.min(0, newX));
            gsap.set(track, { x: clampedX });
            
            dragCursor.style.left = e.clientX + 'px';
            dragCursor.style.top = e.clientY + 'px';
          });

          window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            track.style.cursor = 'grab';
            marquee.style.cursor = 'grab';
            dragCursor.classList.remove('dragging');
            
            const cursorRing = document.getElementById('cursorRing');
            if (cursorRing) cursorRing.style.opacity = '1';
            
            // Resume animation from new position
            const newX = gsap.getProperty(track, 'x');
            const newProgress = (newX / (-trackWidth / 2)) % 1;
            animation.progress(newProgress < 0 ? 1 + newProgress : newProgress);
            animation.resume();
          });

          // Touch events
          marquee.addEventListener('touchstart', (e) => {
            isDragging = true;
            startX = e.touches[0].clientX;
            currentX = gsap.getProperty(track, 'x');
            animation.pause();
            dragCursor.classList.add('dragging');
          });

          window.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const deltaX = e.touches[0].clientX - startX;
            const newX = currentX + deltaX;
            const clampedX = Math.max(-trackWidth / 2, Math.min(0, newX));
            gsap.set(track, { x: clampedX });
          });

          window.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            dragCursor.classList.remove('dragging');
            
            const newX = gsap.getProperty(track, 'x');
            const newProgress = (newX / (-trackWidth / 2)) % 1;
            animation.progress(newProgress < 0 ? 1 + newProgress : newProgress);
            animation.resume();
          });

          marquee.style.cursor = 'grab';
          track.style.cursor = 'grab';
        }
      } else {
        // Fallback to CSS animation
        track.style.animation = 'marquee 60s linear infinite';
      }
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMarquee, { once: true });
  } else {
    initMarquee();
  }

  // Re-initialize on page load (for SPA compatibility)
  window.addEventListener('page:ready', initMarquee);

})();
