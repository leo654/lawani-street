/**
 * Pixel Block Overlay for Hero Video
 * Replicates lamalama.com's pixel block effect:
 * - White pixel blocks covering parts of the video
 * - Irregular cut-out openings where video shows through
 * - Interactive cursor reveal (pixels fade around pointer)
 */

class PixelOverlay {
  constructor(videoElement, containerElement, options = {}) {
    this.video = videoElement;
    this.container = containerElement;
    this.options = {
      pixelSize: options.pixelSize || 8, // Size of each pixel block
      blockOpacity: options.blockOpacity || 0.95, // Opacity of white blocks
      revealRadius: options.revealRadius || 100, // Cursor reveal radius
      coverage: options.coverage || 0.65, // How much of the screen is covered (0-1)
      ...options
    };

    this.canvas = null;
    this.ctx = null;
    this.pixels = [];
    this.isRunning = false;
    this.animationFrame = null;
    this.mouseX = -1000;
    this.mouseY = -1000;

    this.init();
  }

  init() {
    // Create canvas for pixel overlay
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'pixel-overlay';
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
    `;

    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    // Track mouse position for reveal effect
    document.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });

    // Track touch position for mobile
    document.addEventListener('touchmove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.touches[0].clientX - rect.left;
      this.mouseY = e.touches[0].clientY - rect.top;
    });

    // Reset mouse when leaving
    document.addEventListener('mouseleave', () => {
      this.mouseX = -1000;
      this.mouseY = -1000;
    });

    // Wait for video to be ready
    if (this.video.readyState >= 2) {
      this.start();
    } else {
      this.video.addEventListener('loadeddata', () => this.start());
    }

    // Handle resize
    window.addEventListener('resize', () => this.resize());
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.resize();
    this.generatePixelPattern();
    this.render();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.generatePixelPattern();
  }

  generatePixelPattern() {
    this.pixels = [];
    const cols = Math.ceil(this.canvas.width / this.options.pixelSize);
    const rows = Math.ceil(this.canvas.height / this.options.pixelSize);

    // Create irregular pattern using noise
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Use pseudo-random noise for irregular pattern
        const noise = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        const normalizedNoise = noise - Math.floor(noise);
        
        // Determine if this pixel should have a block
        const shouldBlock = normalizedNoise < this.options.coverage;
        
        if (shouldBlock) {
          this.pixels.push({
            x: x * this.options.pixelSize,
            y: y * this.options.pixelSize,
            opacity: this.options.blockOpacity * (0.8 + normalizedNoise * 0.4) // Slight opacity variation
          });
        }
      }
    }
  }

  render() {
    if (!this.isRunning) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw pixel blocks with cursor reveal
    this.pixels.forEach(pixel => {
      const centerX = pixel.x + this.options.pixelSize / 2;
      const centerY = pixel.y + this.options.pixelSize / 2;
      
      // Calculate distance from mouse
      const dx = centerX - this.mouseX;
      const dy = centerY - this.mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate opacity based on distance from cursor (reveal effect)
      let opacity = pixel.opacity;
      if (distance < this.options.revealRadius) {
        const revealFactor = distance / this.options.revealRadius;
        opacity = pixel.opacity * revealFactor;
      }

      // Draw white pixel block
      this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      this.ctx.fillRect(
        pixel.x,
        pixel.y,
        this.options.pixelSize,
        this.options.pixelSize
      );
    });

    // Continue animation loop
    this.animationFrame = requestAnimationFrame(() => this.render());
  }

  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.generatePixelPattern();
  }

  destroy() {
    this.stop();
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('mouseleave', this.handleMouseLeave);
    window.removeEventListener('resize', this.handleResize);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const video = document.querySelector('[data-ll-hero-video]');
  const mediaContainer = document.querySelector('.ll-home-hero__media');
  
  if (video && mediaContainer) {
    // Create pixel overlay matching lamalama.com's approach
    const pixelOverlay = new PixelOverlay(video, mediaContainer, {
      pixelSize: 6, // Size of pixel blocks
      blockOpacity: 0.9, // High opacity for white blocks
      revealRadius: 80, // Cursor reveal radius
      coverage: 0.7 // 70% of screen covered with blocks
    });

    // Expose to window for debugging/customization
    window.pixelOverlay = pixelOverlay;

    // Optional: Pause pixel overlay when video is not visible (performance)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          pixelOverlay.start();
        } else {
          pixelOverlay.stop();
        }
      });
    }, { threshold: 0.1 });

    observer.observe(mediaContainer);
  }
});
