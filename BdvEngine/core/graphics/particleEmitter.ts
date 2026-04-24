import { Color } from './color';
import { Draw } from './draw';

export type ParticleShape = 'rect' | 'circle';

export interface ParticleConfig {
  /** Max particles alive at once. Default: 200 */
  maxParticles?: number;

  /** Particles spawned per second. Default: 50 */
  spawnRate?: number;

  /** Lifetime range in ms. Default: [500, 1500] */
  lifetimeMin?: number;
  lifetimeMax?: number;

  /** Speed range in pixels/ms. Default: [0.05, 0.2] */
  speedMin?: number;
  speedMax?: number;

  /** Direction in radians. 0 = right. Default: -PI/2 (up) */
  direction?: number;

  /** Spread angle in radians. Particles fan out ±spread/2 from direction. Default: PI (half circle) */
  spread?: number;

  /** Size range in pixels. Default: [2, 6] */
  sizeMin?: number;
  sizeMax?: number;

  /** Start and end colors. Particles lerp between them over lifetime. */
  colorStart?: Color;
  colorEnd?: Color;

  /** Start and end alpha (0-255). Particles fade. Default: [255, 0] */
  alphaStart?: number;
  alphaEnd?: number;

  /** Gravity in pixels/ms². Applied to Y velocity. Default: 0 */
  gravity?: number;

  /** Shape of each particle. Default: 'rect' */
  shape?: ParticleShape;

  /** Whether emitter spawns continuously. Default: true */
  emitting?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  age: number;
  lifetime: number;
  alive: boolean;
}

export class ParticleEmitter {
  public x: number;
  public y: number;
  public emitting: boolean;

  private config: Required<ParticleConfig>;
  private particles: Particle[];
  private spawnAccumulator: number = 0;

  constructor(x: number, y: number, config?: ParticleConfig) {
    this.x = x;
    this.y = y;

    this.config = {
      maxParticles: config?.maxParticles ?? 200,
      spawnRate: config?.spawnRate ?? 50,
      lifetimeMin: config?.lifetimeMin ?? 500,
      lifetimeMax: config?.lifetimeMax ?? 1500,
      speedMin: config?.speedMin ?? 0.05,
      speedMax: config?.speedMax ?? 0.2,
      direction: config?.direction ?? -Math.PI / 2,
      spread: config?.spread ?? Math.PI,
      sizeMin: config?.sizeMin ?? 2,
      sizeMax: config?.sizeMax ?? 6,
      colorStart: config?.colorStart ?? new Color(255, 200, 50, 255),
      colorEnd: config?.colorEnd ?? new Color(255, 50, 0, 255),
      alphaStart: config?.alphaStart ?? 255,
      alphaEnd: config?.alphaEnd ?? 0,
      gravity: config?.gravity ?? 0,
      shape: config?.shape ?? 'rect',
      emitting: config?.emitting ?? true,
    };

    this.emitting = this.config.emitting;
    this.particles = [];
  }

  /** Spawn a one-shot burst of particles. */
  burst(count: number): void {
    for (let i = 0; i < count; i++) {
      this.spawn();
    }
  }

  update(deltaTime: number): void {
    let cfg = this.config;

    // Spawn
    if (this.emitting) {
      this.spawnAccumulator += deltaTime;
      let interval = 1000 / cfg.spawnRate;
      while (this.spawnAccumulator >= interval) {
        this.spawnAccumulator -= interval;
        this.spawn();
      }
    }

    // Update alive particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.age += deltaTime;

      if (p.age >= p.lifetime) {
        // Swap-remove for O(1)
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
        continue;
      }

      p.vy += cfg.gravity * deltaTime;
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
    }
  }

  /** Queue all particles into the Draw batch. Call Draw.flush() after. */
  render(): void {
    let cfg = this.config;

    for (let p of this.particles) {
      let t = p.age / p.lifetime; // 0..1

      // Lerp color
      let cs = cfg.colorStart, ce = cfg.colorEnd;
      let r = cs.r + (ce.r - cs.r) * t;
      let g = cs.g + (ce.g - cs.g) * t;
      let b = cs.b + (ce.b - cs.b) * t;
      let a = cfg.alphaStart + (cfg.alphaEnd - cfg.alphaStart) * t;

      let color = new Color(r, g, b, a);
      let half = p.size / 2;

      if (cfg.shape === 'circle') {
        Draw.circle(p.x, p.y, half, color, 8);
      } else {
        Draw.rect(p.x - half, p.y - half, p.size, p.size, color);
      }
    }
  }

  /** Current live particle count. */
  get count(): number {
    return this.particles.length;
  }

  private spawn(): void {
    if (this.particles.length >= this.config.maxParticles) return;

    let cfg = this.config;
    let angle = cfg.direction + (Math.random() - 0.5) * cfg.spread;
    let speed = rand(cfg.speedMin, cfg.speedMax);

    this.particles.push({
      x: this.x,
      y: this.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: rand(cfg.sizeMin, cfg.sizeMax),
      age: 0,
      lifetime: rand(cfg.lifetimeMin, cfg.lifetimeMax),
      alive: true,
    });
  }
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
