/**
 * Hero Video Effects
 * 1. Grayscale to Color - Video starts in grayscale, color reveals on hover/scroll
 * 2. Film Grain Overlay - Cinematic film grain texture
 */

class HeroVideoEffects {
  constructor(videoElement, containerElement) {
    this.video = videoElement;
    this.container = containerElement;
    
    this.initGrayscaleEffect();
    this.initFilmGrain();
  }

  initGrayscaleEffect() {
    // Start with grayscale
    this.video.style.filter = 'grayscale(100%)';
    this.video.style.transition = 'filter 0.8s ease-out';
    
    // Reveal color on hover
    this.container.addEventListener('mouseenter', () => {
      this.video.style.filter = 'grayscale(0%)';
    });
    
    this.container.addEventListener('mouseleave', () => {
      this.video.style.filter = 'grayscale(100%)';
    });

    // Also reveal on scroll (when hero is in view)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Gradually reveal color based on scroll position
          window.addEventListener('scroll', this.handleScroll);
        } else {
          window.removeEventListener('scroll', this.handleScroll);
        }
      });
    }, { threshold: 0.1 });

    observer.observe(this.container);

    this.handleScroll = () => {
      const rect = this.container.getBoundingClientRect();
      const scrollProgress = 1 - (rect.top / window.innerHeight);
      
      if (scrollProgress > 0 && scrollProgress < 1) {
        const grayscaleAmount = Math.max(0, 100 - (scrollProgress * 100));
        this.video.style.filter = `grayscale(${grayscaleAmount}%)`;
      }
    };
  }

  initFilmGrain() {
    // Create grain canvas
    this.grainCanvas = document.createElement('canvas');
    this.grainCanvas.className = 'film-grain';
    this.grainCanvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 5;
      opacity: 0.2;
      mix-blend-mode: overlay;
    `;

    this.grainCtx = this.grainCanvas.getContext('2d');
    this.container.appendChild(this.grainCanvas);

    // Set canvas size
    this.resizeGrain();
    window.addEventListener('resize', () => this.resizeGrain());

    // Animate grain
    this.animateGrain();
  }

  resizeGrain() {
    const rect = this.container.getBoundingClientRect();
    this.grainCanvas.width = rect.width;
    this.grainCanvas.height = rect.height;
  }

  animateGrain() {
    const width = this.grainCanvas.width;
    const height = this.grainCanvas.height;
    
    // Generate noise
    const imageData = this.grainCtx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255;
      data[i] = value;     // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
      data[i + 3] = 255;   // A
    }

    this.grainCtx.putImageData(imageData, 0, 0);

    // Continue animation
    requestAnimationFrame(() => this.animateGrain());
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const video = document.querySelector('[data-ll-hero-video]');
  const mediaContainer = document.querySelector('.ll-home-hero__media');
  
  if (video && mediaContainer) {
    const heroEffects = new HeroVideoEffects(video, mediaContainer);
    
    // Expose to window for debugging
    window.heroEffects = heroEffects;
  }
});
