/*
 * Spinning line-art coffee cup.
 *
 * A small software 3D renderer on a 2D canvas: the cup is a surface of revolution
 * (profile -> lathe quads), projected with a gentle perspective, flat toon-shaded
 * and outlined in the site's ink colour so it stays crisp at any size and matches the
 * hand-drawn reference. No dependencies, no WebGL context, no textures to download.
 *
 * Markup:  <div data-cup-3d data-cup-sleeve="Buy me|Coffee"><canvas></canvas></div>   ("|" starts a new line)
 * Colours: `color` of the element is the ink, `--cup-paper` is the fill (see cup-3d.css).
 *
 * Interaction (see mount()): drag the cup to spin it with the pointer (mouse, touch or pen) and a flick keeps
 * turning before easing back to the idle spin; with a mouse the cup turns slower while hovered; scrolling the page
 * speeds the spin up (and reverses it when scrolling up). The cup always stands upright (MAX_LEAN in mount() is 0).
 * With reduced motion the cup stays still, can still be dragged, and does not coast or follow scroll.
 */

var TAU = Math.PI * 2;
var SEGMENTS = 72;            // quads around the cup
var PITCH = 17 * Math.PI / 180;  // camera looks down at the cup
var CAMERA_DISTANCE = 7.5;    // in cup heights; small = stronger perspective
var LIGHT_H = [-0.62, 0.78];  // horizontal light direction (x, z), from the front-left
var SPIN_SECONDS = 11;        // one full turn
var SILHOUETTE = 2.4;         // outline weight relative to the base line width
var W_RING = 2.4;             // arcs round the cup (sleeve edges): same weight as the outline
var W_FINE = 0.8;             // small details
var SHADING = 0;              // 0 = flat line art, 1 = soft toon shading on the right-hand side
var HEIGHT_SCALE = 1.12;      // stretches the whole cup upwards; profile heights are scaled by this once, below
var TOP_Y = HEIGHT_SCALE;     // height of the lid top

function norm3(x, y, z) {
  var l = Math.sqrt(x * x + y * y + z * z) || 1;
  return [x / l, y / l, z / l];
}

/* ---------------------------------------------------------------------
   Geometry
   profile vertices: [radius, height, crease]  (crease = draw a ring line here)
   --------------------------------------------------------------------- */
/* A polyline whose corners are replaced by true tangent arcs. Each point is [r, h, radius, flag]: radius 0 keeps a
   sharp corner (or a plain point on a straight run); the flag goes on the first vertex generated for the point.
   A final point flagged "drop" only gives the last corner its outgoing direction and is removed afterwards. */
function roundPoly(pts, stepDeg) {
  var out = [], n = pts.length, i, k;
  var step = (stepDeg || 6) * Math.PI / 180;
  for (i = 0; i < n; i++) {
    var P = pts[i], rho = P[2] || 0, flag = P[3] || 0;
    if (i === 0 || i === n - 1 || rho <= 0) { out.push([P[0], P[1], flag]); continue; }
    var A = pts[i - 1], B = pts[i + 1];
    var l1 = Math.hypot(P[0] - A[0], P[1] - A[1]), l2 = Math.hypot(B[0] - P[0], B[1] - P[1]);
    var d1 = [(P[0] - A[0]) / l1, (P[1] - A[1]) / l1], d2 = [(B[0] - P[0]) / l2, (B[1] - P[1]) / l2];
    var cross = d1[0] * d2[1] - d1[1] * d2[0], dot = d1[0] * d2[0] + d1[1] * d2[1];
    var turn = Math.atan2(Math.abs(cross), dot);
    if (turn < 1e-4) { out.push([P[0], P[1], flag]); continue; }
    var t = rho * Math.tan(turn / 2), tmax = 0.5 * Math.min(l1, l2);
    if (t > tmax) { t = tmax; rho = t / Math.tan(turn / 2); }
    var sgn = cross > 0 ? 1 : -1;
    var sx = P[0] - d1[0] * t, sy = P[1] - d1[1] * t;
    var nx = -d1[1] * sgn, ny = d1[0] * sgn;                // from the start of the arc towards its centre
    var cx = sx + nx * rho, cy = sy + ny * rho;
    var a0 = Math.atan2(sy - cy, sx - cx), steps = Math.max(2, Math.ceil(turn / step));
    for (k = 0; k <= steps; k++) {
      var ang = a0 + sgn * turn * k / steps;
      out.push([cx + rho * Math.cos(ang), cy + rho * Math.sin(ang), k === 0 ? flag : 0]);
    }
  }
  if (out.length && out[out.length - 1][2] === "drop") out.pop();
  return out;
}

var LID_R = 0.35;               // radius of the flat top of the lid (set from the profile)

function buildProfile() {
  function wall(h) { return 0.296 + 0.1266 * h; }        // one straight taper from base to lid (stocky, like a real cup)
  var SB = 0.21, ST = 0.592;                            // sleeve bottom and top (design units): about 46% of the cup, low-centre
  var PROUD = 0.010, BEVEL = 0.056, SR = 0.12;          // sleeve stands PROUD off the wall; its edges ease over BEVEL
  var LEAN = 0.3217;                                    // the flange side leans in this much per unit of height
  var FB = 0.41 + LEAN * (0.895 - 0.8225);              // where the flange side meets its underside

  var pts = [
    [0, 0, 0],
    [wall(0), 0, 0.06],                                 // base: flat underside, generous rounded corner
    // sleeve: eased in and out, so the outline flows from wall to sleeve in one swell. The arcs round the
    // cup are drawn on the middle of each easing.
    [wall(SB), SB, SR],
    [wall(SB + BEVEL / 2) + PROUD / 2, SB + BEVEL / 2, 0, W_RING],
    [wall(SB + BEVEL) + PROUD, SB + BEVEL, SR],
    [wall(ST) + PROUD, ST, SR],
    [wall(ST + BEVEL / 2) + PROUD / 2, ST + BEVEL / 2, 0, W_RING],
    [wall(ST + BEVEL), ST + BEVEL, SR],
    [wall(0.8225), 0.8225, 0],                          // top of the wall, under the lid
    // lid: flange leaning in towards the top, then the collar, then the rim. (-1 marks where the lid starts.)
    [FB, 0.8225, 0.020, -1],
    [0.4100, 0.895, 0.012],                             // outer top edge of the flange
    [0.3880, 0.903, 0.012],                             // where the flange meets the collar
    [0.3640, 1.0, 0.020],                               // lid rim
    [0.3000, 1.0, 0, "drop"]
  ];
  var p = roundPoly(pts, 6);
  LID_R = p[p.length - 1][0];
  p.forEach(function (v) { v[1] *= HEIGHT_SCALE; });
  return p;
}

/* Smooth outline data. The mesh the fills use is coarse; the outline is traced along a dense centripetal
   Catmull-Rom curve through the same profile vertices so corners and tapers come out as smooth curves.
   Camera and profile never change, so the contour azimuths are worked out once. */
function crSample(raw, step) {
  // long straight stretches get evenly spaced points first, so the spline cannot bow out of them
  var pts = [raw[0]], n, i, k;
  for (i = 1; i < raw.length; i++) {
    var gap = Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]), parts = Math.max(1, Math.ceil(gap / 0.02));
    for (k = 1; k <= parts; k++) pts.push([raw[i - 1][0] + (raw[i][0] - raw[i - 1][0]) * k / parts, raw[i - 1][1] + (raw[i][1] - raw[i - 1][1]) * k / parts]);
  }
  n = pts.length;
  var out = [];
  function g(i) {
    if (i < 0) return [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]];
    if (i >= n) return [2 * pts[n - 1][0] - pts[n - 2][0], 2 * pts[n - 1][1] - pts[n - 2][1]];
    return pts[i];
  }
  function dist(a, b) { return Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]) + 1e-9, 0.5); }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  for (i = 0; i < n - 1; i++) {
    var p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    var t0 = 0, t1 = t0 + dist(p0, p1), t2 = t1 + dist(p1, p2), t3 = t2 + dist(p2, p3);
    var len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    function turn(u, v, w) {                         // how sharply the path bends from u->v to v->w
      var a1 = Math.atan2(v[1] - u[1], v[0] - u[0]), a2 = Math.atan2(w[1] - v[1], w[0] - v[0]), d = Math.abs(a2 - a1);
      return d > Math.PI ? 2 * Math.PI - d : d;
    }
    var bend = Math.max(turn(p0, p1, p2), turn(p1, p2, p3));
    var m = Math.max(1, Math.ceil(len / step), Math.ceil(bend / 0.04));
    for (k = 0; k < m; k++) {
      var t = t1 + (t2 - t1) * k / m;
      var a1 = lerp(p0, p1, (t - t0) / (t1 - t0)), a2 = lerp(p1, p2, (t - t1) / (t2 - t1)), a3 = lerp(p2, p3, (t - t2) / (t3 - t2));
      var b1 = lerp(a1, a2, (t - t0) / (t2 - t0)), b2 = lerp(a2, a3, (t - t1) / (t3 - t1));
      out.push(lerp(b1, b2, (t - t1) / (t2 - t1)));
    }
  }
  out.push(pts[n - 1].slice(0, 2));
  return out;
}
function contourAngles(D, lidFrom) {
  // Below the lid the contour never goes further round than the screen edge (cos 0.03). On the lid, rows
  // that face upwards are edge-on on the far side, so there the contour runs on round to the back.
  var DM = D.length - 1, segs = [], C = [], i, DsP = CAMERA_DISTANCE * SIN_P, DcP = CAMERA_DISTANCE * COS_P;
  for (i = 0; i < DM; i++) {
    var dr = D[i + 1][0] - D[i][0], dh = D[i + 1][1] - D[i][1], len = Math.sqrt(dr * dr + dh * dh) || 1;
    segs.push([dh / len, -dr / len]);
  }
  for (i = 0; i <= DM; i++) {
    var a0 = segs[Math.max(i - 1, 0)], a1 = segs[Math.min(i, DM - 1)];
    var vnr = a0[0] + a1[0], vnh = a0[1] + a1[1], vl = Math.sqrt(vnr * vnr + vnh * vnh) || 1, cv;
    vnr /= vl; vnh /= vl;
    var lo = lidFrom >= 0 && i >= lidFrom ? -1 : 0.03;
    if (vnr < 0.02) cv = vnh > 0 ? lo : 9;
    else cv = (vnr * D[i][0] + vnh * (D[i][1] - DsP)) / (vnr * DcP);
    C.push(cv > 0.995 ? null : Math.acos(Math.max(cv, lo)));
  }
  return C;
}
function buildOutline(P) {
  var M = P.length - 1, i, flange = -1;
  for (i = 0; i <= M; i++) if (P[i][2] === -1) flange = i;
  var wallPts = [], lidPts = [];
  for (i = 0; i <= M; i++) (flange >= 0 && i < flange ? wallPts : lidPts).push([P[i][0], P[i][1]]);
  var D = crSample(wallPts, 0.004);
  var flangeIdx = flange >= 0 ? D.length : -1;
  D = D.concat(crSample(lidPts, 0.004));
  var C0 = contourAngles(D, flangeIdx), nd = [], nc = [], k, n;
  // A small bend in the profile can sweep the contour a long way round the cup (at the rounded corners of
  // the flange and base). Where neighbours are far apart in azimuth, add points in between (radius, height
  // and azimuth all interpolated), so the outline is traced in short steps there instead of long chords.
  var newFlange = -1;
  for (i = 0; i < D.length; i++) {
    if (i === flangeIdx) newFlange = nd.length;
    nd.push(D[i]); nc.push(C0[i]);
    if (i === D.length - 1 || i + 1 === flangeIdx) continue;
    if (C0[i] !== null && C0[i + 1] !== null) {
      n = Math.ceil(Math.abs(C0[i + 1] - C0[i]) / 0.02);
      for (k = 1; k < n; k++) {
        var f = k / n;
        nd.push([D[i][0] + (D[i + 1][0] - D[i][0]) * f, D[i][1] + (D[i + 1][1] - D[i][1]) * f]);
        nc.push(C0[i] + (C0[i + 1] - C0[i]) * f);
      }
    }
  }
  var DM = nd.length - 1, widest = -1;
  if (newFlange >= 0) for (i = newFlange; i <= DM; i++) if (widest < 0 || nd[i][0] > nd[widest][0]) widest = i;
  return { D: nd, C: nc, M: DM, flange: newFlange, widest: widest };
}

function mix(a, b, t) {
  return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
}
function css(c) { return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"; }

function parseColour(value, fallback) {
  var m = /rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/i.exec(value || "");
  if (m) return [Math.round(+m[1]), Math.round(+m[2]), Math.round(+m[3])];
  return fallback;
}

/* ---------------------------------------------------------------------
   Cup
   --------------------------------------------------------------------- */
function Cup(root, canvas) {
  this.root = root;
  this.canvas = canvas;
  this.ctx = canvas.getContext("2d");
  this.profile = buildProfile();
  this.outline = buildOutline(this.profile);
  this.sleeveText = (root.getAttribute("data-cup-sleeve") || "").trim();
  this.sleeveSeg = -1;
  var i;
  // The sleeve is the longest straight stretch of wall below the lid (between its two eased edges).
  var longest = 0, lidAt = this.profile.length;
  for (i = 0; i < this.profile.length; i++) if (this.profile[i][2] === -1) { lidAt = i; break; }
  for (i = 0; i < lidAt - 1; i++) {
    var a = this.profile[i], b = this.profile[i + 1], sl = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (sl > longest && b[1] > a[1]) { longest = sl; this.sleeveSeg = i; }
  }
  this.W = 0; this.H = 0; this.dpr = 1;
  this.lean = 0; this._lc = 1; this._ls = 0; this.px = 0; this.py = 0;   // lean: roll about the base, set by the pointer
  this.ink = [20, 20, 20];
  this.paper = [239, 238, 232];
  this.texture = null;
  this.theta = -0.55;
  this.readColours();
}

Cup.prototype.readColours = function () {
  var probe = document.createElement("i");
  probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
  probe.style.color = "var(--cup-paper, #efeee8)";
  this.root.appendChild(probe);
  this.paper = parseColour(getComputedStyle(probe).color, this.paper);
  this.root.removeChild(probe);
  this.ink = parseColour(getComputedStyle(this.root).color, this.ink);
  this.tones = [
    css(this.paper),
    css(mix(this.paper, this.ink, 0.055 * SHADING)),
    css(mix(this.paper, this.ink, 0.11 * SHADING)),
    css(mix(this.paper, this.ink, 0.17 * SHADING))
  ];
  this.inkCss = css(this.ink);
  this.texture = null;
};

Cup.prototype.buildTexture = function () {
  if (!this.sleeveText || this.sleeveSeg < 0) return null;
  // texture pixels per unit are the same along and across the sleeve, so the lettering is never stretched
  var sa = this.profile[this.sleeveSeg], sb = this.profile[this.sleeveSeg + 1];
  var tw = 2048, th = Math.round((sb[1] - sa[1]) * tw / (TAU * (sa[0] + sb[0]) / 2));
  var c = document.createElement("canvas");
  c.width = tw; c.height = th;
  var g = c.getContext("2d");
  g.fillStyle = this.inkCss;
  g.textAlign = "center";
  g.textBaseline = "middle";
  var family = getComputedStyle(this.root).getPropertyValue("--cup-font").trim() || '"Gridlite", monospace';
  // The text is printed twice, half a turn apart, so one copy owns half of the texture. A "|" in the text starts a
  // new line ("Buy me|Coffee"). The type starts at 150px and shrinks only if the widest line would run past its
  // half of the sleeve, or the lines would run past the sleeve's height, so any wording fits.
  var lines = this.sleeveText.toUpperCase().split("|").map(function (s) { return s.trim(); }).filter(Boolean);
  if (!lines.length) return null;
  function setType(px) {
    g.font = "700 " + px + "px " + family;
    if ("letterSpacing" in g) g.letterSpacing = Math.round(px * 0.04) + "px";
  }
  function inkWidth(s) {
    var m = g.measureText(s);
    return (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || m.width);
  }
  var size = 150, LEADING = 1.12;
  setType(size);
  var widest = 0, n;
  for (n = 0; n < lines.length; n++) widest = Math.max(widest, inkWidth(lines[n]));
  var cap = g.measureText("H").actualBoundingBoxAscent || size * 0.7;
  var stack = cap + (lines.length - 1) * size * LEADING;          // ink height of all the lines at this size
  var fit = Math.min(1, (tw * 0.5 * 0.94) / (widest || 1), (th * 0.74) / stack);
  if (fit < 1) { size = Math.floor(size * fit); setType(size); }
  var pitch = size * LEADING, y0 = th * 0.52 - pitch * (lines.length - 1) / 2;
  for (n = 0; n < lines.length; n++) {
    g.fillText(lines[n], tw * 0.25, y0 + n * pitch);
    g.fillText(lines[n], tw * 0.75, y0 + n * pitch);
  }
  return c;
};

Cup.prototype.resize = function () {
  var rect = this.root.getBoundingClientRect();
  var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  var w = Math.max(40, Math.round(rect.width * dpr));
  var h = Math.max(40, Math.round(rect.height * dpr));
  if (w === this.W && h === this.H) return false;
  this.W = w; this.H = h; this.dpr = dpr;
  this.canvas.width = w;
  this.canvas.height = h;
  this.fit();
  return true;
};

/* camera ---------------------------------------------------------------- */
Cup.prototype.project = function (r, h, phi, out) {
  var x = r * Math.sin(phi), z = r * Math.cos(phi), y = h;
  return this.projectXYZ(x, y, z, out);
};

var COS_P = Math.cos(PITCH), SIN_P = Math.sin(PITCH);
Cup.prototype.projectXYZ = function (x, y, z, out) {
  var y2 = y * COS_P - z * SIN_P;
  var z2 = y * SIN_P + z * COS_P;
  var s = CAMERA_DISTANCE / (CAMERA_DISTANCE - z2);
  out[0] = this.cx + x * s * this.scale;
  out[1] = this.cy - (y2 - 0.5 * COS_P) * s * this.scale;
  if (this.lean) {                                   // roll the whole cup about the middle of its base
    var ddx = out[0] - this.px, ddy = out[1] - this.py;
    out[0] = this.px + ddx * this._lc - ddy * this._ls;
    out[1] = this.py + ddx * this._ls + ddy * this._lc;
  }
  out[2] = z2;
  out[3] = x; out[4] = y2;
  return out;
};

Cup.prototype.setLean = function (a) {
  this.lean = a; this._lc = Math.cos(a); this._ls = Math.sin(a);
};

Cup.prototype.fit = function () {
  var keepLean = this.lean;
  this.setLean(0);
  // Fit the (rotation-independent) silhouette into the canvas.
  this.cx = this.W / 2; this.cy = this.H / 2; this.scale = 1;
  var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, t = [0, 0, 0, 0, 0];
  var self = this;
  this.profile.forEach(function (v) {
    for (var k = 0; k < 24; k++) {
      self.project(v[0], v[1], k / 24 * TAU, t);
      if (t[0] < minX) minX = t[0]; if (t[0] > maxX) maxX = t[0];
      if (t[1] < minY) minY = t[1]; if (t[1] > maxY) maxY = t[1];
    }
  });
  var bw = maxX - minX, bh = maxY - minY;
  var pad = 0.07;
  this.scale = Math.min(this.W * (1 - pad * 2) / bw, this.H * (1 - pad * 2) / bh);
  this.cx = this.W / 2; this.cy = this.H / 2;
  // recentre
  this.project(0, 0.5, 0, t);
  var midY = 0;
  var tmp = [0, 0, 0, 0, 0], lo = 1e9, hi = -1e9;
  this.profile.forEach(function (v) {
    for (var k = 0; k < 24; k++) {
      self.project(v[0], v[1], k / 24 * TAU, tmp);
      if (tmp[1] < lo) lo = tmp[1]; if (tmp[1] > hi) hi = tmp[1];
    }
  });
  midY = (lo + hi) / 2;
  this.cy += this.H / 2 - midY;
  this.line = Math.max(1.4 * this.dpr, bw * this.scale * 0.0085);
  var pv = [0, 0, 0, 0, 0];
  this.project(0, 0, 0, pv);
  this.px = pv[0]; this.py = pv[1];
  this.setLean(keepLean);
};

/* frame ----------------------------------------------------------------- */
Cup.prototype.render = function (theta) {
  if (!this.W) return;
  this.theta = theta;
  var ctx = this.ctx, P = this.profile, M = P.length - 1, N = SEGMENTS;
  var tones = this.tones, ink = this.inkCss, lw = this.line;
  var i, j;

  // Buffers and per-row constants are built once and reused, so drawing a frame allocates nothing, and the sine
  // and cosine of each angle round the cup are worked out once per frame instead of once per row.
  var G = this._grid;
  if (!G || G.M !== M || G.N !== N) {
    G = this._grid = {
      M: M, N: N, sx: [], sy: [], sz: [], front: [], shade: [], segN: [], rm: [], hm: [],
      sinV: new Float64Array(N + 1), cosV: new Float64Array(N + 1), sinC: new Float64Array(N), cosC: new Float64Array(N)
    };
    for (i = 0; i <= M; i++) { G.sx.push(new Float32Array(N + 1)); G.sy.push(new Float32Array(N + 1)); G.sz.push(new Float32Array(N + 1)); }
    for (i = 0; i < M; i++) {
      G.front.push(new Uint8Array(N)); G.shade.push(new Uint8Array(N));
      var dr0 = P[i + 1][0] - P[i][0], dh0 = P[i + 1][1] - P[i][1], len0 = Math.sqrt(dr0 * dr0 + dh0 * dh0) || 1;
      G.segN.push([dh0 / len0, -dr0 / len0]);
      G.rm.push((P[i][0] + P[i + 1][0]) / 2); G.hm.push((P[i][1] + P[i + 1][1]) / 2);
    }
  }
  var sx = G.sx, sy = G.sy, sz = G.sz, front = G.front, shade = G.shade, segN = G.segN;
  var sinV = G.sinV, cosV = G.cosV, sinC = G.sinC, cosC = G.cosC;
  for (j = 0; j <= N; j++) { var av = j / N * TAU + theta; sinV[j] = Math.sin(av); cosV[j] = Math.cos(av); }
  for (j = 0; j < N; j++) { var ac = (j + 0.5) / N * TAU + theta; sinC[j] = Math.sin(ac); cosC[j] = Math.cos(ac); }

  // vertex grid in screen + camera space (the camera projection, written out for speed)
  var lean = this.lean, lc = this._lc, ls = this._ls, px0 = this.px, py0 = this.py, gcx = this.cx, gcy = this.cy, gsc = this.scale;
  for (i = 0; i <= M; i++) {
    var rowX = sx[i], rowY = sy[i], rowZ = sz[i], rr = P[i][0], yh = P[i][1] * COS_P, zh = P[i][1] * SIN_P;
    for (j = 0; j <= N; j++) {
      var gz = rr * cosV[j], gy2 = yh - gz * SIN_P, gz2 = zh + gz * COS_P, gs = CAMERA_DISTANCE / (CAMERA_DISTANCE - gz2);
      var gX = gcx + rr * sinV[j] * gs * gsc, gY = gcy - (gy2 - 0.5 * COS_P) * gs * gsc;
      if (lean) { var gdx = gX - px0, gdy = gY - py0; gX = px0 + gdx * lc - gdy * ls; gY = py0 + gdx * ls + gdy * lc; }
      rowX[j] = gX; rowY[j] = gY; rowZ[j] = gz2;
    }
  }

  // per-quad facing + shade
  var camPos = CAMERA_DISTANCE;
  for (i = 0; i < M; i++) {
    var fr = front[i], sh = shade[i], nr = segN[i][0], nh = segN[i][1], rmI = G.rm[i], hmI = G.hm[i];
    var ny2b = nh * COS_P, nz2b = nh * SIN_P;
    for (j = 0; j < N; j++) {
      var sp = sinC[j], cp = cosC[j];
      var nz = nr * cp, ny2 = ny2b - nz * SIN_P, nz2 = nz2b + nz * COS_P;
      var ppx = rmI * sp, ppz = rmI * cp, py2 = hmI * COS_P - ppz * SIN_P, pz2 = hmI * SIN_P + ppz * COS_P;
      fr[j] = (nr * sp * ppx + ny2 * py2 + nz2 * (pz2 - camPos)) < 0 ? 1 : 0;
      // Clean vertical bands: walls are lit by the horizontal part of the light only.
      var l = nr * (sp * LIGHT_H[0] + cp * LIGHT_H[1]);
      sh[j] = nh > 0.6 ? 0 : (l > 0.22 ? 0 : (l > -0.25 ? 1 : (l > -0.65 ? 2 : 3)));
    }
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, this.W, this.H);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = ink;
  ctx.imageSmoothingEnabled = true;
  if ("imageSmoothingQuality" in ctx) ctx.imageSmoothingQuality = "high";

  if (!this.texture && this.sleeveText) this.texture = this.buildTexture();
  var tex = this.texture, sleeveSeg = this.sleeveSeg;

  function line(i0, j0, i1, j1) {
    ctx.moveTo(sx[i0][j0], sy[i0][j0]);
    ctx.lineTo(sx[i1][j1], sy[i1][j1]);
  }

  var ringWeights = [];
  P.forEach(function (v) { if (v[2] > 0 && ringWeights.indexOf(v[2]) < 0) ringWeights.push(v[2]); });

  var flat = tones[0] === tones[1] && tones[1] === tones[2] && tones[2] === tones[3];
  if (flat) {
    // Every wall quad is the same paper colour, so each ring of the cup is painted as one polygon per run of
    // front-facing quads (two fills per ring instead of one per quad). The 1px same-colour stroke closes the
    // hairline seams between rings. One large path of all the quads is far slower to rasterise than these.
    ctx.fillStyle = tones[0];
    ctx.strokeStyle = tones[0];
    ctx.lineWidth = 1;
    for (i = 0; i < M; i++) {
      var fr2 = front[i], rowA = sx[i], rowAy = sy[i], rowB = sx[i + 1], rowBy = sy[i + 1];
      j = 0;
      while (j < N) {
        if (!fr2[j]) { j++; continue; }
        var j0 = j;
        while (j < N && fr2[j]) j++;
        ctx.beginPath();
        ctx.moveTo(rowA[j0], rowAy[j0]);
        for (var k = j0 + 1; k <= j; k++) ctx.lineTo(rowA[k], rowAy[k]);
        for (var k2 = j; k2 >= j0; k2--) ctx.lineTo(rowB[k2], rowBy[k2]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.strokeStyle = ink;
  } else {
    // shaded: strips are painted farthest first, each in its own tone
    var order = [];
    for (j = 0; j < N; j++) order.push([cosC[j], j]);
    order.sort(function (a, b) { return a[0] - b[0]; });
    for (var o = 0; o < N; o++) {
      j = order[o][1];
      var jn = j + 1;
      for (i = 0; i < M; i++) {
        if (!front[i][j]) continue;
        ctx.beginPath();
        ctx.moveTo(sx[i][j], sy[i][j]);
        ctx.lineTo(sx[i][jn], sy[i][jn]);
        ctx.lineTo(sx[i + 1][jn], sy[i + 1][jn]);
        ctx.lineTo(sx[i + 1][j], sy[i + 1][j]);
        ctx.closePath();
        var fc = tones[shade[i][j]];
        ctx.fillStyle = fc;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = fc;
        ctx.stroke();
        ctx.strokeStyle = ink;
      }
    }
  }

  // sleeve lettering, after every fill so no neighbouring strip can paint over it
  if (tex && sleeveSeg >= 0) {
    i = sleeveSeg;
    for (j = 0; j < N; j++) {
      if (!front[i][j]) continue;
      // sleeve lettering: each strip is cut into thin slices that follow the true projection, so the
      // letters bend smoothly round the cup. Slices overlap a hair so no seams show between them.
      var du = tex.width / N, u0 = ((j / N) % 1) * tex.width, K = 4, eps = 0.05, kk;
      var tTop = this.__tt || (this.__tt = [0, 0, 0, 0, 0]), tBot = this.__tb || (this.__tb = [0, 0, 0, 0, 0]);
      var pTop = this.__pt || (this.__pt = [0, 0, 0, 0, 0]), pBot = this.__pb || (this.__pb = [0, 0, 0, 0, 0]);
      this.project(P[i + 1][0], P[i + 1][1], j / N * TAU + theta, pTop);
      this.project(P[i][0], P[i][1], j / N * TAU + theta, pBot);
      for (kk = 0; kk < K; kk++) {
        var phi1 = (j + (kk + 1) / K) / N * TAU + theta;
        this.project(P[i + 1][0], P[i + 1][1], phi1, tTop);
        this.project(P[i][0], P[i][1], phi1, tBot);
        ctx.save();
        ctx.setTransform(tTop[0] - pTop[0], tTop[1] - pTop[1], pBot[0] - pTop[0], pBot[1] - pTop[1], pTop[0], pTop[1]);
        ctx.drawImage(tex, u0 + du * kk / K - du / K * eps, 0, du / K * (1 + 2 * eps), tex.height, -eps, 0, 1 + 2 * eps, 1);
        ctx.restore();
        pTop[0] = tTop[0]; pTop[1] = tTop[1]; pBot[0] = tBot[0]; pBot[1] = tBot[1];
      }
    }
  }

  // Ring lines (every outline ring is flagged in the profile, with a weight), after all the fills.
  // Each ring is one continuous path over the camera-facing half, so there are no joins or caps to see;
  // it stops where the outline (see below) takes over.
  var DsP = CAMERA_DISTANCE * SIN_P, DcP = CAMERA_DISTANCE * COS_P;
  var contour = [];
  for (i = 0; i <= M; i++) {
    var a0 = segN[Math.max(i - 1, 0)], a1 = segN[Math.min(i, M - 1)];
    var vnr = a0[0] + a1[0], vnh = a0[1] + a1[1], vl = Math.sqrt(vnr * vnr + vnh * vnh) || 1;
    vnr /= vl; vnh /= vl;
    var cv;
    if (vnr < 0.02) cv = vnh > 0 ? 0.03 : 9;
    else cv = (vnr * P[i][0] + vnh * (P[i][1] - DsP)) / (vnr * DcP);
    contour.push(cv > 0.995 ? null : Math.acos(Math.max(cv, 0.03)));
  }
  ctx.lineCap = "butt";
  // walk the strips starting at the back of the cup: a ring is only ever drawn on the front half, so none of
  // them is split where the strip numbering wraps round
  var jStart = (((Math.round((Math.PI - theta) / TAU * N - 0.5)) % N) + N) % N;
  for (var w = 0; w < ringWeights.length; w++) {
    var wt = ringWeights[w];
    ctx.lineWidth = lw * wt;
    ctx.beginPath();
    for (i = 1; i < M; i++) {
      if (P[i][2] !== wt) continue;
      var openRing = false, lim = contour[i] === null ? 9 : contour[i] + 0.04;
      for (var jk = 0; jk < N; jk++) {
        j = (jStart + jk) % N;
        var a = ((j / N * TAU + theta + Math.PI) % TAU + TAU) % TAU - Math.PI;
        var b = (((j + 1) / N * TAU + theta + Math.PI) % TAU + TAU) % TAU - Math.PI;
        var phiR = (j + 0.5) / N * TAU + theta;
        if (Math.cos(phiR) > -0.12 && Math.abs(a) <= lim && Math.abs(b) <= lim && (front[i - 1][j] || front[i][j])) {
          if (!openRing) { ctx.moveTo(sx[i][j], sy[i][j]); openRing = true; }
          ctx.lineTo(sx[i][j + 1], sy[i][j + 1]);
        } else openRing = false;
      }
    }
    ctx.stroke();
  }
  ctx.lineCap = "round";

  // Outline. For every vertex of the dense profile the surface turns edge-on to the camera at one azimuth
  // on each side (the contour); joining those points gives a smooth left and right outline whatever the
  // mesh resolution. Rows facing straight up have no contour and use the screen-extreme azimuth.
  // Vertices below the flange form the wall run; the flange and lid form the lid run.
  var O = this.outline, D = O.D, C = O.C, DM = O.M, flangeStart = O.flange, widest = O.widest;
  var cup = this;
  function runStart(wallRows) {
    for (var q = 0; q <= DM; q++) {
      var isWall = flangeStart >= 0 && q < flangeStart;
      if (isWall === wallRows && C[q] !== null) return q;
    }
    return -1;
  }
  function limbPath(sign, wallRows) {
    var q0 = runStart(wallRows), pt = [0, 0, 0, 0, 0];
    if (q0 < 0) return;
    ctx.beginPath();
    // both sides meet along the front arc of the lowest ring that has an outline
    for (var st = 0; st <= 48; st++) {
      cup.project(D[q0][0], D[q0][1], sign * C[q0] * st / 48, pt);
      if (st) ctx.lineTo(pt[0], pt[1]); else ctx.moveTo(pt[0], pt[1]);
    }
    for (var q = q0 + 1; q <= DM; q++) {
      var isWall = flangeStart >= 0 && q < flangeStart;
      if (isWall !== wallRows) break;
      if (C[q] === null) continue;                       // never edge-on here (an underside): bridge straight across
      cup.project(D[q][0], D[q][1], sign * C[q], pt);
      ctx.lineTo(pt[0], pt[1]);
    }
    ctx.stroke();
  }
  // The lid is one solid shape filled from the smooth outline (not from the strips, whose edges are
  // only as fine as the mesh): front arc along the bottom of the flange, up the right limb, across, and
  // down the left limb.
  var lq0 = runStart(false);
  if (lq0 >= 0) {
    var lp = [0, 0, 0, 0, 0], lq;
    ctx.beginPath();
    for (var ls = 0; ls <= 48; ls++) {
      cup.project(D[lq0][0], D[lq0][1], -C[lq0] + 2 * C[lq0] * ls / 48, lp);
      if (ls) ctx.lineTo(lp[0], lp[1]); else ctx.moveTo(lp[0], lp[1]);
    }
    for (lq = lq0 + 1; lq <= DM; lq++) { if (C[lq] === null) continue; cup.project(D[lq][0], D[lq][1], C[lq], lp); ctx.lineTo(lp[0], lp[1]); }
    for (lq = DM; lq > lq0; lq--) { if (C[lq] === null) continue; cup.project(D[lq][0], D[lq][1], -C[lq], lp); ctx.lineTo(lp[0], lp[1]); }
    ctx.closePath();
    ctx.fillStyle = ink;
    ctx.fill();

    // the thin white arc under the lid: the flange's top face between its outer edge and the collar.
    // Seen from above it is widest at the front and runs out to nothing at the sides.
    var fi = -1, bi = -1, bj = -1;
    for (i = 0; i <= M; i++) if (P[i][2] === -1) fi = i;
    for (i = fi; fi >= 0 && i < M; i++) {
      if (segN[i][1] > 0.5) { if (bi < 0) bi = i; bj = i + 1; }
      else if (bi >= 0) break;
    }
    if (bi > 0) {
      var edge = function (v, na, nb) {
        var nr = na[0] + nb[0], nh = na[1] + nb[1], nl = Math.sqrt(nr * nr + nh * nh) || 1;
        nr /= nl; nh /= nl;
        var cv = (nr * v[0] + nh * (v[1] - DsP)) / (nr * DcP);
        return cv >= 1 ? 0 : Math.acos(Math.max(cv, 0.03));
      };
      var ca = edge(P[bi], segN[bi - 1], segN[bi]), cb = edge(P[bj], segN[bj - 1], segN[Math.min(bj, M - 1)]);
      // The arc is cut off where the outline meets it, so it is thinned to a point towards both ends instead:
      // each pair of points (outer edge, inner edge) is pulled in towards its midpoint by a smooth taper.
      var BS = 72, bs, bp = [0, 0, 0, 0, 0], bq = [0, 0, 0, 0, 0], outer = [], inner = [];
      for (bs = 0; bs <= BS; bs++) {
        var bu = 2 * bs / BS - 1, tp = Math.min(1, (1 - Math.abs(bu)) / 0.6);
        tp = tp * tp * (3 - 2 * tp);
        cup.project(P[bi][0], P[bi][1], ca * bu, bp);
        cup.project(P[bj][0], P[bj][1], cb * bu, bq);
        var bmx = (bp[0] + bq[0]) / 2, bmy = (bp[1] + bq[1]) / 2;
        outer.push([bmx + (bp[0] - bmx) * tp, bmy + (bp[1] - bmy) * tp]);
        inner.push([bmx + (bq[0] - bmx) * tp, bmy + (bq[1] - bmy) * tp]);
      }
      ctx.beginPath();
      for (bs = 0; bs <= BS; bs++) { if (bs) ctx.lineTo(outer[bs][0], outer[bs][1]); else ctx.moveTo(outer[0][0], outer[0][1]); }
      for (bs = BS; bs >= 0; bs--) ctx.lineTo(inner[bs][0], inner[bs][1]);
      ctx.closePath();
      ctx.fillStyle = tones[0];
      ctx.fill();
    }
  }
  ctx.lineWidth = lw * SILHOUETTE;
  // the lid and flange: nothing can hide them
  limbPath(-1, false); limbPath(1, false);
  // the wall only shows below the flange's lower outline
  var qb = runStart(false);
  if (flangeStart > 0 && qb >= 0) {
    ctx.save();
    var pt2 = [0, 0, 0, 0, 0], k2;
    ctx.beginPath();
    cup.project(D[widest][0], D[widest][1], -C[widest], pt2);
    var xl = pt2[0];
    ctx.moveTo(pt2[0], pt2[1]);
    for (k2 = widest - 1; k2 > qb; k2--) {
      if (C[k2] === null) continue;
      cup.project(D[k2][0], D[k2][1], -C[k2], pt2); ctx.lineTo(pt2[0], pt2[1]);
    }
    for (var st2 = 0; st2 <= 48; st2++) {
      cup.project(D[qb][0], D[qb][1], -C[qb] + 2 * C[qb] * st2 / 48, pt2); ctx.lineTo(pt2[0], pt2[1]);
    }
    for (k2 = qb + 1; k2 <= widest; k2++) {
      if (C[k2] === null) continue;
      cup.project(D[k2][0], D[k2][1], C[k2], pt2); ctx.lineTo(pt2[0], pt2[1]);
    }
    ctx.lineTo(pt2[0], this.H); ctx.lineTo(xl, this.H);
    ctx.closePath();
    ctx.clip();
    limbPath(-1, true); limbPath(1, true);
    ctx.restore();
  } else {
    limbPath(-1, true); limbPath(1, true);
  }

  this.drawLidTop(ctx, theta, lw);
};

/* lid top: disc, sip well, flap, vent ------------------------------------- */
Cup.prototype.lidPoint = function (X, Z, theta, out, y) {
  var c = Math.cos(theta), s = Math.sin(theta);
  var x = X * c + Z * s, z = Z * c - X * s;
  return this.projectXYZ(x, y === undefined ? TOP_Y : y, z, out);
};

Cup.prototype.drawLidTop = function (ctx, theta, lw) {
  var self = this, t = [0, 0, 0, 0, 0], k;
  var R = LID_R;            // lid top radius (from the profile)
  var WELL_Z = -0.004;      // sip opening, a hair towards the back of the lid (local z)
  var WELL_R = 0.278;       // opening
  var DEPTH = 0.032;        // how far the inner step is sunk: shows as the white crescent on the far side
  var ink = this.inkCss;
  function poly(points, close, y) {
    ctx.beginPath();
    points.forEach(function (p, idx) {
      self.lidPoint(p[0], p[1], theta, t, y);
      if (idx) ctx.lineTo(t[0], t[1]); else ctx.moveTo(t[0], t[1]);
    });
    if (close) ctx.closePath();
  }
  function circle(cx, cz, r, n) {
    var pts = [];
    for (k = 0; k < n; k++) { var a = k / n * TAU; pts.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]); }
    return pts;
  }
  function quad(p0, p1, p2, n) {
    var pts = [];
    for (k = 0; k <= n; k++) {
      var u = k / n, a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
      pts.push([a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]]);
    }
    return pts;
  }
  // rounded slot: two half circles joined by straight sides, long axis along `rot`
  function pill(cx, cz, half, rad, rot) {
    var pts = [], co = Math.cos(rot), si = Math.sin(rot), n = 10, a, ex, ez, side;
    for (side = 0; side < 2; side++) {
      for (k = 0; k <= n; k++) {
        a = (side ? Math.PI / 2 : -Math.PI / 2) + k / n * Math.PI;
        ex = (side ? -1 : 1) * (half - rad) + rad * Math.cos(a);
        ez = rad * Math.sin(a);
        pts.push([cx + ex * co - ez * si, cz + ex * si + ez * co]);
      }
    }
    return pts;
  }

  ctx.lineCap = "round"; ctx.lineJoin = "round";

  // the lid is solid ink
  poly(circle(0, 0, R, 96), true);
  ctx.fillStyle = this.inkCss;
  ctx.fill();
  ctx.lineWidth = lw * SILHOUETTE;
  ctx.strokeStyle = this.inkCss;
  ctx.stroke();

  // sip opening: white, with one dark arc across it (the far edge of the sunken step), so it reads as a
  // white crescent on the far side and a lens on the near side
  var well = circle(0, WELL_Z, WELL_R, 96);
  poly(well, true);
  ctx.fillStyle = this.tones[0];
  ctx.fill();
  ctx.save();
  poly(well, true);
  ctx.clip();
  poly(circle(0, WELL_Z, WELL_R, 96), true, TOP_Y - DEPTH);
  ctx.fillStyle = this.tones[0];
  ctx.fill();
  ctx.lineWidth = lw * SILHOUETTE;
  ctx.stroke();
  ctx.restore();

  // vent: a small white slot beside the opening, slanted along the rim. It is part of the lid, so it turns
  // with the cup and goes all the way round; at the back it is just seen at a shallow angle.
  var va = 0.58, vr = WELL_R + 0.056;
  poly(pill(vr * Math.cos(va), vr * Math.sin(va), 0.055, 0.0115, va + Math.PI / 2), true);
  ctx.fillStyle = this.tones[0];
  ctx.fill();
};

/* ---------------------------------------------------------------------
   Mounting
   --------------------------------------------------------------------- */
function mount(root) {
  if (root.__cup) return root.__cup;
  var canvas = root.querySelector("canvas");
  if (!canvas) { canvas = document.createElement("canvas"); root.appendChild(canvas); }
  var cup = new Cup(root, canvas);
  root.__cup = cup;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var visible = true, leaving = false, raf = 0, last = 0, running = false;

  // Motion state. `omega` is the cup's own turning speed (it eases back to the slow idle spin after a fling);
  // scrolling the page adds to it for as long as the page is moving.
  var BASE = TAU / SPIN_SECONDS;      // idle speed, rad/s
  var theta = -0.55, omega = BASE;
  var HOVER_SLOW = 0.3;               // idle speed while the pointer is on the cup, so the lettering can be read
  var SETTLE = 1.1;                   // seconds for a fling to ease back to the idle speed
  var MAX_LEAN = 0;                   // the cup stays upright: it turns, it never tilts (set to a few degrees to lean towards the pointer)
  var hovering = false, dragging = false, dragId = -1, dragX = 0, dragT = 0, dragVel = 0;
  var scrollVel = 0, scrollBoost = 0, scrollY = window.scrollY, scrollT = performance.now();
  var pointer = { x: 0, y: 0, on: false }, rect = null, rectAt = 0, rectScroll = 0, leanTarget = 0;

  // Where the cup is on screen matters only for leaning towards the pointer, to within a few pixels. It is measured
  // now and then and moved along with the scroll position, rather than read again (a forced layout) on every
     // frame of a scroll.
  function measure() { rect = root.getBoundingClientRect(); rectAt = performance.now(); rectScroll = scrollY; }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  // advance the motion by dt seconds
  function step(dt) {
    var k;
    if (!dragging) {
      k = 1 - Math.exp(-dt / SETTLE);
      omega += (BASE * (hovering ? HOVER_SLOW : 1) - omega) * k;
    }
    scrollVel *= Math.exp(-dt / 0.12);                            // reads zero again once the page stops moving
    scrollBoost += (clamp(scrollVel * 0.0022, -7, 7) - scrollBoost) * (1 - Math.exp(-dt / 0.12));
    if (!dragging) theta += (omega + scrollBoost) * dt;

    // lean towards the pointer: full strength within about a cup's width, fading out by two and a half
    leanTarget = 0;
    if (MAX_LEAN && pointer.on && fine.matches) {
      if (!rect || performance.now() - rectAt > 1500) measure();
      var shift = scrollY - rectScroll;
      var dx = (pointer.x - (rect.left + rect.width / 2)) / rect.width;
      var dy = (pointer.y - (rect.top - shift + rect.height / 2)) / rect.height;
      var fade = clamp((Math.hypot(dx, dy) - 1) / 1.5, 0, 1);
      fade = 1 - fade * fade * (3 - 2 * fade);
      leanTarget = clamp(dx * 1.3, -1, 1) * MAX_LEAN * fade;
    }
    if (MAX_LEAN || cup.lean) cup.setLean(cup.lean + (leanTarget - cup.lean) * (1 - Math.exp(-dt / 0.22)));
  }

  function frame(now) {
    raf = 0;
    if (!running) return;
    step(last ? Math.min((now - last) / 1000, 0.05) : 0);
    last = now;
    cup.render(theta);
    raf = requestAnimationFrame(frame);
  }
  function update() {
    var should = visible && !leaving && !document.hidden && !reduce.matches;
    if (should && !running) { running = true; last = 0; scrollVel = 0; scrollBoost = 0; rect = null; raf = requestAnimationFrame(frame); }
    if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    if (!should && !leaving) { if (cup.lean) cup.setLean(0); cup.render(theta); }
  }
  // Leaving the page: the curtain is closing over everything, so stop spending frames on the cup
  // (and do no work at all in the click that starts the transition).
  window.addEventListener("ll:page-leave", function () { leaving = true; update(); });
  window.addEventListener("pageshow", function (e) { if (e.persisted && leaving) { leaving = false; update(); } });
  function relayout() { cup.resize(); cup.render(theta); }

  // drag to spin: the surface under the pointer follows it, and a flick keeps turning, then settles
  root.setAttribute("data-cup-interactive", "");
  if (fine.matches) root.setAttribute("data-cursor", "Spin");
  function release(e) {
    if (!dragging || (e && e.pointerId !== dragId)) return;
    dragging = false;
    root.classList.remove("is-dragging");
    try { root.releasePointerCapture(dragId); } catch (err) { /* already released */ }
    var held = performance.now() - dragT > 90;                    // held still before letting go: no fling
    omega = held || reduce.matches ? 0 : clamp(dragVel, -14, 14);
    if (!running) cup.render(theta);
  }
  root.addEventListener("pointerdown", function (e) {
    if (dragging || (e.pointerType === "mouse" && e.button !== 0)) return;
    dragging = true; dragId = e.pointerId; dragX = e.clientX; dragT = performance.now(); dragVel = 0; omega = 0;
    root.classList.add("is-dragging");
    try { root.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
  });
  root.addEventListener("pointermove", function (e) {
    if (!dragging || e.pointerId !== dragId) return;
    var now = performance.now(), dtm = Math.max(now - dragT, 1) / 1000;
    var d = (e.clientX - dragX) * cup.dpr / (0.375 * cup.scale);   // radians: 1:1 with the front of the cup
    theta += d;
    dragVel += (d / dtm - dragVel) * 0.35;
    dragX = e.clientX; dragT = now;
    if (!running) cup.render(theta);
  });
  root.addEventListener("pointerup", release);
  root.addEventListener("pointercancel", release);
  root.addEventListener("lostpointercapture", release);
  root.addEventListener("dragstart", function (e) { e.preventDefault(); });
  root.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") hovering = true; });
  root.addEventListener("pointerleave", function () { hovering = false; });

  // pointer and page scroll feed the motion above (only while it is running, and only for people who have not
  // asked for reduced motion)
  window.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.on = true;
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", function () { pointer.on = false; });
  window.addEventListener("blur", function () { pointer.on = false; });
  window.addEventListener("scroll", function () {
    if (!running) { rect = null; return; }
    var now = performance.now(), y = window.scrollY, dts = Math.max(now - scrollT, 8) / 1000;
    scrollVel += ((y - scrollY) / dts - scrollVel) * 0.4;
    scrollY = y; scrollT = now;
  }, { passive: true });

  relayout();
  if ("ResizeObserver" in window) new ResizeObserver(function () { rect = null; if (cup.resize()) cup.render(theta); }).observe(root);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; update(); }, { rootMargin: "120px 0px" }).observe(root);
  }
  document.addEventListener("visibilitychange", update);
  if (reduce.addEventListener) reduce.addEventListener("change", update);
  // Re-read the colours only when the theme really changed. The root element's class list changes all the time
  // (motion-kit flags, the page transition), and every re-read costs a forced style pass, a texture rebuild and a
  // full redraw: that landed in the click that starts a page transition and stalled the first frames of it.
  function themeSignature() {
    var html = document.documentElement;
    return (html.getAttribute("data-theme") || "") + "|" + (html.className.match(/(?:^|\s)(?:dark|light|(?:ll-)?theme-\S+)(?=\s|$)/g) || []).join(",");
  }
  var themeSeen = themeSignature();
  new MutationObserver(function () {
    var now = themeSignature();
    if (now === themeSeen) return;
    themeSeen = now;
    cup.readColours();
    cup.render(theta);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  if (document.fonts && document.fonts.load) {
    document.fonts.load('700 40px "Gridlite"').then(function () { cup.texture = null; cup.render(theta); }).catch(function () {});
  }
  update();
  return cup;
}

export function initCups(scope) {
  Array.prototype.forEach.call((scope || document).querySelectorAll("[data-cup-3d]"), mount);
}

initCups();
