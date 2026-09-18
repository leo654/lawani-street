class AsciiVideoConverter {
  constructor(videoElement, canvasElement, options = {}) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    
    // Configuration
    this.options = {
      width: options.width || 100,
      height: options.height || 50,
      fontSize: options.fontSize || 12,
      fontFamily: options.fontFamily || 'monospace',
      inverted: options.inverted || false,
      cursorRadius: options.cursorRadius || 150,
      cursorIntensity: options.cursorIntensity || 0.8,
      ...options
    };
    
    // Cursor tracking
    this.cursor = { x: -1000, y: -1000 };
    this.targetCursor = { x: -1000, y: -1000 };
    this.isCursorActive = false;
    this.cursorSmoothing = 0.15; // Smooth cursor movement
    
    // Refined halftone character set for elegant effect
    this.asciiChars = this.options.inverted 
      ? ' ·•○●█'
      : '█●○•· ';
    
    this.isRunning = false;
    this.animationFrame = null;
    
    // Setup canvas
    this.setupCanvas();
    
    // Setup cursor tracking
    this.setupCursorTracking();
  }
  
  setupCanvas() {
    // Get parent dimensions
    const parent = this.canvas.parentElement;
    const parentWidth = parent.offsetWidth;
    const parentHeight = parent.offsetHeight;
    
    // Calculate appropriate canvas size
    this.canvas.width = parentWidth;
    this.canvas.height = parentHeight;
    
    // Use a more monospaced font for better halftone effect
    this.ctx.font = `${this.options.fontSize}px ${this.options.fontFamily}`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'center';
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
  }
  
  setupCursorTracking() {
    // Track mouse movement over the entire section
    const section = this.canvas.closest('.ll-capabilities');
    
    section.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.targetCursor.x = e.clientX - rect.left;
      this.targetCursor.y = e.clientY - rect.top;
      this.isCursorActive = true;
    });
    
    section.addEventListener('mouseleave', () => {
      this.isCursorActive = false;
      this.targetCursor.x = -1000;
      this.targetCursor.y = -1000;
    });
    
    // Track touch movement for mobile
    section.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.targetCursor.x = touch.clientX - rect.left;
      this.targetCursor.y = touch.clientY - rect.top;
      this.isCursorActive = true;
    }, { passive: false });
    
    section.addEventListener('touchend', () => {
      this.isCursorActive = false;
      this.targetCursor.x = -1000;
      this.targetCursor.y = -1000;
    });
  }
  
  grayToAscii(gray) {
    const charIndex = Math.floor((gray / 255) * (this.asciiChars.length - 1));
    return this.asciiChars[Math.max(0, Math.min(charIndex, this.asciiChars.length - 1))];
  }
  
  convertFrame() {
    // Smooth cursor movement (snap immediately if target is far away)
    const targetDistance = Math.sqrt(
      Math.pow(this.targetCursor.x - this.cursor.x, 2) + 
      Math.pow(this.targetCursor.y - this.cursor.y, 2)
    );
    
    if (targetDistance > 500) {
      // Snap immediately if target is far (cursor left section)
      this.cursor.x = this.targetCursor.x;
      this.cursor.y = this.targetCursor.y;
    } else {
      // Smooth cursor movement during normal interaction
      this.cursor.x += (this.targetCursor.x - this.cursor.x) * this.cursorSmoothing;
      this.cursor.y += (this.targetCursor.y - this.cursor.y) * this.cursorSmoothing;
    }
    
    // Create temporary canvas for video frame processing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = this.options.width;
    tempCanvas.height = this.options.height;
    
    // Draw video frame to temp canvas (scaled down)
    tempCtx.drawImage(this.video, 0, 0, this.options.width, this.options.height);
    
    // Get image data
    const imageData = tempCtx.getImageData(0, 0, this.options.width, this.options.height);
    const pixels = imageData.data;
    
    // Clear main canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Set fill style based on theme
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
    this.ctx.fillStyle = isDarkTheme ? '#f4f2ec' : '#1a1a1a';
    
    // Calculate grid dimensions for elegant halftone effect
    const gridSize = this.options.fontSize * 1.5; // More spacing for elegant effect
    const cols = Math.floor(this.canvas.width / gridSize);
    const rows = Math.floor(this.canvas.height / gridSize);
    
    // Calculate centering
    const totalWidth = cols * gridSize;
    const totalHeight = rows * gridSize;
    const offsetX = (this.canvas.width - totalWidth) / 2;
    const offsetY = (this.canvas.height - totalHeight) / 2;
    
    // Create elegant halftone pattern with circular dots and cursor interaction
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Map grid position to video frame
        const videoX = Math.floor((x / cols) * this.options.width);
        const videoY = Math.floor((y / rows) * this.options.height);
        
        // Get pixel data
        const i = (videoY * this.options.width + videoX) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        // Convert to grayscale
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Calculate dot size based on brightness (larger dots for darker areas)
        const normalizedGray = gray / 255;
        let dotSize = (gridSize * 0.8) * (1 - normalizedGray);
        
        // Calculate cursor influence
        const posX = offsetX + x * gridSize + gridSize / 2;
        const posY = offsetY + y * gridSize + gridSize / 2;
        
        let cursorMultiplier = 1;
        if (this.isCursorActive) {
          const distance = Math.sqrt(
            Math.pow(posX - this.cursor.x, 2) + 
            Math.pow(posY - this.cursor.y, 2)
          );
          
          // Calculate influence based on distance (closer = more influence)
          // Use smooth easing for more natural interaction
          const influence = Math.max(0, 1 - distance / this.options.cursorRadius);
          const easedInfluence = influence * influence * (3 - 2 * influence); // Smooth step
          cursorMultiplier = 1 + (easedInfluence * this.options.cursorIntensity);
        }
        
        // Apply cursor influence to dot size
        dotSize *= cursorMultiplier;
        
        // Only draw if dot is visible
        if (dotSize > 0.5) {
          this.ctx.beginPath();
          this.ctx.arc(posX, posY, dotSize / 2, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    const render = () => {
      if (!this.isRunning) return;
      
      if (this.video.readyState >= 2) {
        this.convertFrame();
      }
      
      this.animationFrame = requestAnimationFrame(render);
    };
    
    render();
  }
  
  stop() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.setupCanvas();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const videoElement = document.getElementById('services-video');
  const asciiCanvas = document.getElementById('ascii-video-canvas');
  
  if (videoElement && asciiCanvas) {
    const asciiConverter = new AsciiVideoConverter(videoElement, asciiCanvas, {
      width: 200,
      height: 100,
      fontSize: 3,
      fontFamily: 'monospace',
      inverted: false,
      cursorRadius: 200,
      cursorIntensity: 1.5
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      asciiConverter.setupCanvas();
    });
    
    // Handle theme changes
    const themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          // Theme changed, next frame will use new colors
        }
      });
    });
    
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    
    // Start conversion when video is playing
    videoElement.addEventListener('play', () => {
      asciiConverter.start();
    });
    
    videoElement.addEventListener('pause', () => {
      asciiConverter.stop();
    });
    
    // Auto-start if video is already playing
    if (!videoElement.paused) {
      asciiConverter.start();
    }
    
    // Start the video if it's not already playing
    if (videoElement.paused) {
      videoElement.play().then(() => {
        asciiConverter.start();
      }).catch(err => {
        console.log('Video autoplay prevented:', err);
      });
    }
  }
});