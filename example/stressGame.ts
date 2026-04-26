import {
  Game,
  Shader,
  Draw,
  Color,
  UI,
  InputManager,
  Keys,
} from '../BdvEngine';

/**
 * Struct-of-arrays particle storage for maximum performance.
 * No per-particle objects, no GC pressure, tight typed-array loops.
 */
class ParticlePool {
  capacity: number;
  count: number = 0;

  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  r: Float32Array; // red 0-1
  g: Float32Array;
  b: Float32Array;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.x  = new Float32Array(capacity);
    this.y  = new Float32Array(capacity);
    this.vx = new Float32Array(capacity);
    this.vy = new Float32Array(capacity);
    this.r  = new Float32Array(capacity);
    this.g  = new Float32Array(capacity);
    this.b  = new Float32Array(capacity);
  }

  grow(newCap: number): void {
    if (newCap <= this.capacity) return;
    let old = this;
    this.capacity = newCap;
    this.x  = new Float32Array(newCap); this.x.set(old.x);
    this.y  = new Float32Array(newCap); this.y.set(old.y);
    this.vx = new Float32Array(newCap); this.vx.set(old.vx);
    this.vy = new Float32Array(newCap); this.vy.set(old.vy);
    this.r  = new Float32Array(newCap); this.r.set(old.r);
    this.g  = new Float32Array(newCap); this.g.set(old.g);
    this.b  = new Float32Array(newCap); this.b.set(old.b);
  }

  add(px: number, py: number, pvx: number, pvy: number, pr: number, pg: number, pb: number): void {
    if (this.count >= this.capacity) this.grow(this.capacity * 2);
    let i = this.count++;
    this.x[i] = px; this.y[i] = py;
    this.vx[i] = pvx; this.vy[i] = pvy;
    this.r[i] = pr; this.g[i] = pg; this.b[i] = pb;
  }
}

export class StressGame extends Game {
  private pool = new ParticlePool(1024);
  private targetCount = 500;
  private gravity = 0.0004;
  private bounceDamping = 0.7;
  private particleSize = 3;
  private useCircles = false;
  private paused = false;

  private countText!: HTMLDivElement;
  private fpsText!: HTMLDivElement;
  private lastFps = 0;
  private frameCount = 0;
  private fpsTimer = 0;

  private formatNum(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return Math.floor(n).toLocaleString();
    return String(n);
  }

  init(): void {
    let panel = UI.panel(10, 10, {
      width: "300px", padding: "10px",
      background: "rgba(0,0,0,0.8)", borderRadius: "6px",
    });

    UI.heading(panel, "Stress Test", { color: "#4af" });

    UI.slider(panel, "Particles", 100, 1000000, this.targetCount, (val) => {
      this.targetCount = val;
    });

    UI.slider(panel, "Size", 1, 20, this.particleSize, (val) => {
      this.particleSize = val;
    });

    UI.slider(panel, "Gravity", 0, 20, 4, (val) => {
      this.gravity = val / 10000;
    });

    UI.slider(panel, "Bounce", 0, 100, 70, (val) => {
      this.bounceDamping = val / 100;
    });

    UI.spacer(panel);

    UI.checkbox(panel, "Use circles (slower)", this.useCircles, (val) => {
      this.useCircles = val;
    });

    UI.checkbox(panel, "Paused", this.paused, (val) => {
      this.paused = val;
    });

    UI.spacer(panel);

    UI.button(panel, "Clear All", () => {
      this.pool.count = 0;
    });

    UI.button(panel, "Explode!", () => {
      let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      let p = this.pool;
      for (let i = 0; i < p.count; i++) {
        let dx = p.x[i] - cx, dy = p.y[i] - cy;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        p.vx[i] += (dx / dist) * 0.5;
        p.vy[i] += (dy / dist) * 0.5;
      }
    });

    UI.spacer(panel);
    this.countText = UI.text(panel, "", { fontSize: "14px", fontFamily: "monospace" });
    this.fpsText = UI.text(panel, "", { fontSize: "14px", fontFamily: "monospace", color: "#0f0" });
  }

  update(deltaTime: number): void {
    this.frameCount++;
    this.fpsTimer += deltaTime;
    if (this.fpsTimer >= 500) {
      this.lastFps = Math.round(this.frameCount * 1000 / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    let sw = window.innerWidth, sh = window.innerHeight;
    let p = this.pool;

    // Spawn to match target
    while (p.count < this.targetCount) {
      p.add(
        Math.random() * sw,
        Math.random() * sh * 0.3,
        (Math.random() - 0.5) * 0.2,
        Math.random() * 0.1,
        0.2 + Math.random() * 0.8,
        0.2 + Math.random() * 0.8,
        0.2 + Math.random() * 0.8,
      );
    }
    // Trim
    if (p.count > this.targetCount) p.count = this.targetCount;

    if (this.paused) {
      UI.setText(this.countText, `Particles: ${this.formatNum(p.count)} (paused)`);
      UI.setText(this.fpsText, `${this.lastFps} FPS`);
      return;
    }

    // Physics update — tight typed array loop, no object access
    let grav = this.gravity * deltaTime;
    let floor = sh - 20;
    let bounce = -this.bounceDamping;
    let friction = 0.99;
    let px = p.x, py = p.y, pvx = p.vx, pvy = p.vy;
    let n = p.count;

    for (let i = 0; i < n; i++) {
      pvy[i] += grav;
      px[i] += pvx[i] * deltaTime;
      py[i] += pvy[i] * deltaTime;

      // Floor
      if (py[i] > floor) { py[i] = floor; pvy[i] *= bounce; pvx[i] *= friction; }
      // Walls
      if (px[i] < 0) { px[i] = 0; pvx[i] *= bounce; }
      else if (px[i] > sw) { px[i] = sw; pvx[i] *= bounce; }
      // Ceiling
      if (py[i] < 0) { py[i] = 0; pvy[i] *= bounce; }
    }

    UI.setText(this.countText, `Particles: ${this.formatNum(p.count)}`);
    let fpsColor = this.lastFps >= 55 ? "#0f0" : this.lastFps >= 30 ? "#ff0" : "#f00";
    this.fpsText.style.color = fpsColor;
    UI.setText(this.fpsText, `${this.lastFps} FPS`);
  }

  render(shader: Shader): void {
    let p = this.pool;
    let n = p.count;
    let size = this.particleSize;

    // Floor
    Draw.rect(0, window.innerHeight - 20, window.innerWidth, 20, new Color(60, 60, 60, 255));

    if (this.useCircles) {
      // Circles — more vertices per particle
      let color = new Color(255, 255, 255, 255);
      for (let i = 0; i < n; i++) {
        color.r = Math.round(p.r[i] * 255);
        color.g = Math.round(p.g[i] * 255);
        color.b = Math.round(p.b[i] * 255);
        Draw.circle(p.x[i], p.y[i], size, color, 6);
      }
    } else {
      // Rects — fastest path, 6 verts per particle
      // Direct write to Draw's internal buffer for maximum speed
      let color = new Color(255, 255, 255, 255);
      for (let i = 0; i < n; i++) {
        color.r = Math.round(p.r[i] * 255);
        color.g = Math.round(p.g[i] * 255);
        color.b = Math.round(p.b[i] * 255);
        Draw.rect(p.x[i] - size, p.y[i] - size, size * 2, size * 2, color);
      }
    }
  }
}
