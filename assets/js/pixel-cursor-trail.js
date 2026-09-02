(function() {
  'use strict';

  var canvas = document.getElementById('pixelCanvas');
  var cursorRing = document.getElementById('cursorRing');
  var cursorDot = document.getElementById('cursorDot');

  if (!canvas || !cursorRing || !cursorDot || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var width = canvas.width = window.innerWidth;
  var height = canvas.height = window.innerHeight;
  var mouse = { x: width / 2, y: height / 2, lastX: width / 2, lastY: height / 2 };
  var ringSmooth = { x: width / 2, y: height / 2 };
  var pixelSize = 8;
  var smoothness = 0.12;
  var trailDensity = 8;
  var elements = [];

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function HeavyPixelBlock(x, y, vx, vy, mouseSpeed) {
    this.x = x;
    this.y = y;
    this.vx = vx + (Math.random() - 0.5) * 6;
    this.vy = vy + (Math.random() - 0.5) * 6;
    this.initialSize = Math.min(Math.random() * mouseSpeed + 20, 64);
    this.size = this.initialSize;
    this.life = 1;
    this.decay = Math.random() * 0.015 + 0.015;
  }

  HeavyPixelBlock.prototype.update = function() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.96;
    this.vy *= 0.96;
    this.size *= 0.97;
    this.life -= this.decay;
  };

  HeavyPixelBlock.prototype.draw = function() {
    if (this.life <= 0) return;

    var snapX = Math.round(this.x / pixelSize) * pixelSize;
    var snapY = Math.round(this.y / pixelSize) * pixelSize;
    var snapSize = Math.max(pixelSize, Math.round(this.size / pixelSize) * pixelSize);
    var radiusOffset = snapSize / 2;

    ctx.fillStyle = 'rgba(255, 74, 59, ' + (this.life * 0.85) + ')';

    for (var offsetX = -radiusOffset; offsetX < radiusOffset; offsetX += pixelSize) {
      for (var offsetY = -radiusOffset; offsetY < radiusOffset; offsetY += pixelSize) {
        if (offsetX * offsetX + offsetY * offsetY <= radiusOffset * radiusOffset) {
          ctx.fillRect(snapX + offsetX, snapY + offsetY, pixelSize - 1, pixelSize - 1);
        }
      }
    }
  };

  function addBurst(count, baseSpeed) {
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = Math.random() * baseSpeed + 5;
      elements.push(new HeavyPixelBlock(
        mouse.x,
        mouse.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        30
      ));
    }
  }

  function handleMouseMove(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;

    var dx = mouse.x - mouse.lastX;
    var dy = mouse.y - mouse.lastY;
    var moveSpeed = Math.sqrt(dx * dx + dy * dy);

    if (moveSpeed > 1) {
      for (var i = 0; i < trailDensity; i++) {
        elements.push(new HeavyPixelBlock(mouse.x, mouse.y, dx * 0.15, dy * 0.15, moveSpeed));
      }
    }

    mouse.lastX = mouse.x;
    mouse.lastY = mouse.y;
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);

    elements = elements.filter(function(element) {
      return element.life > 0;
    });

    elements.forEach(function(element) {
      element.update();
      element.draw();
    });

    cursorDot.style.transform = 'translate3d(' + mouse.x + 'px, ' + mouse.y + 'px, 0) translate(-50%, -50%)';

    ringSmooth.x += (mouse.x - ringSmooth.x) * smoothness;
    ringSmooth.y += (mouse.y - ringSmooth.y) * smoothness;
    cursorRing.style.transform = 'translate3d(' + ringSmooth.x + 'px, ' + ringSmooth.y + 'px, 0) translate(-50%, -50%)';

    window.requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mousedown', function() {
    cursorRing.classList.add('active');
    addBurst(40, 15);
  });
  window.addEventListener('mouseup', function() {
    cursorRing.classList.remove('active');
  });

  loop();
})();
