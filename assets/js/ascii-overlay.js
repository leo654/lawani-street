/**
 * ASCII Art Overlay for Hero Video
 * Converts video frames to ASCII characters in real-time
 */

class AsciiOverlay {
  constructor(videoElement, containerElement, options = {}) {
    this.video = videoElement;
    this.container = containerElement;
    this.options = {
      resolution: options.resolution || 0.15, // Scale down for performance
      fontSize: options.fontSize || 8,
      fontFamily: options.fontFamily || 'monospace',
      contrast: options.contrast || 1.2,
      brightness: options.brightness || 1.0,
      ...options
    };

    this.canvas = null;
    this.ctx = null;
    this.asciiContainer = null;
    this.isRunning = false;
    this.animationFrame = null;

    // ASCII character set from dark to light
    this.asciiChars = ' .:-=+*#%@';

    this.init();
  }

  init() {
    // Create canvas for video frame capture
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    // Create ASCII container
    this.asciiContainer = document.createElement('pre');
    this.asciiContainer.className = 'ascii-overlay';
    this.asciiContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      font-family: ${this.options.fontFamily};
      font-size: ${this.options.fontSize}px;
      line-height: ${this.options.fontSize}px;
      white-space: pre;
      overflow: hidden;
      pointer-events: none;
      opacity: 0.4;
      color: #ffffff;
      text-shadow: 0 0 2px rgba(0,0,0,0.5);
    `;

    this.container.appendChild(this.asciiContainer);

    // Wait for video to be ready
    if (this.video.readyState >= 2) {
      this.start();
    } else {
      this.video.addEventListener('loadeddata', () => this.start());
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.resize();
    this.render();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  resize() {
    const width = Math.floor(this.video.videoWidth * this.options.resolution);
    const height = Math.floor(this.video.videoHeight * this.options.resolution);
    
    this.canvas.width = width;
    this.canvas.height = height;
  }

  getAsciiChar(brightness) {
    const index = Math.floor(brightness * (this.asciiChars.length - 1));
    return this.asciiChars[Math.min(index, this.asciiChars.length - 1)];
  }

  render() {
    if (!this.isRunning) return;

    // Draw current video frame to canvas
    this.ctx.drawImage(
      this.video,
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    // Get pixel data
    const imageData = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    const pixels = imageData.data;

    let ascii = '';

    // Convert pixels to ASCII
    for (let y = 0; y < this.canvas.height; y++) {
      for (let x = 0; x < this.canvas.width; x++) {
        const i = (y * this.canvas.width + x) * 4;
        
        // Calculate brightness
        let r = pixels[i];
        let g = pixels[i + 1];
        let b = pixels[i + 2];
        
        // Apply contrast and brightness
        r = ((r / 255 - 0.5) * this.options.contrast + 0.5) * 255 * this.options.brightness;
        g = ((g / 255 - 0.5) * this.options.contrast + 0.5) * 255 * this.options.brightness;
        b = ((b / 255 - 0.5) * this.options.contrast + 0.5) * 255 * this.options.brightness;
        
        // Clamp values
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        
        const brightness = (r + g + b) / 3 / 255;
        ascii += this.getAsciiChar(brightness);
      }
      ascii += '\n';
    }

    // Update ASCII display
    this.asciiContainer.textContent = ascii;

    // Continue animation loop
    this.animationFrame = requestAnimationFrame(() => this.render());
  }

  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.asciiContainer.style.fontSize = `${this.options.fontSize}px`;
    this.asciiContainer.style.lineHeight = `${this.options.fontSize}px`;
    this.resize();
  }

  destroy() {
    this.stop();
    if (this.asciiContainer && this.asciiContainer.parentNode) {
      this.asciiContainer.parentNode.removeChild(this.asciiContainer);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const video = document.querySelector('[data-ll-hero-video]');
  const mediaContainer = document.querySelector('.ll-home-hero__media');
  
  if (video && mediaContainer) {
    // Create ASCII overlay with customizable options
    const asciiOverlay = new AsciiOverlay(video, mediaContainer, {
      resolution: 0.08, // Lower resolution = more pixelated
      fontSize: 10, // Larger font = more obvious
      fontFamily: 'Courier New, monospace',
      contrast: 1.5, // Higher contrast = more distinct grayscale
      brightness: 1.2
    });

    // Expose to window for debugging/customization
    window.asciiOverlay = asciiOverlay;

    // Optional: Pause ASCII when video is not visible (performance)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          asciiOverlay.start();
        } else {
          asciiOverlay.stop();
        }
      });
    }, { threshold: 0.1 });

    observer.observe(mediaContainer);
  }
});
