import './registrations';
import { gl } from './gl/gl';
import { GLUTools } from './gl/gl';
import { GLStats } from './gl/glStats';
import { DefaultShader } from './gl/shaders/defaultShader';
import { AssetManager } from './assets/assetManager';
import { InputManager } from './input/inputManager';
import { ZoneManager } from './world/zoneManager';
import { m4x4 } from './utils/m4x4';
import { MessageBus } from './com/messageBus';
import { Game } from './game';
import { Draw } from './graphics/draw';
import { SpriteBatcher } from './graphics/spriteBatcher';
import { Camera2D } from './camera2d';
import { RigidBodyBehavior } from './behaviors/rigidBodyBehavior';

export interface EngineConfig {
  /** Target FPS cap. 0 = uncapped (requestAnimationFrame only). Default: 60 */
  targetFps?: number;
  /** Show built-in FPS/stats overlay. Default: false */
  showStats?: boolean;
  /** @deprecated Use showStats instead */
  showFps?: boolean;
}

export class Engine {
  private canvas: HTMLCanvasElement;
  private defaultShader!: DefaultShader;
  private previousTime: number = 0;
  private game: Game;

  /** The 2D camera. Set position/zoom from your game code. */
  public camera: Camera2D = new Camera2D();

  // FPS limiting
  private targetFps: number;
  private frameInterval: number;
  private accumulator: number = 0;

  // Stats tracking
  private showStats: boolean;
  private frameCount: number = 0;
  private fpsTimer: number = 0;
  private currentFps: number = 0;
  private currentDrawCalls: number = 0;
  private statsElement: HTMLDivElement | null = null;

  public constructor(canvas: HTMLCanvasElement, game: Game, config?: EngineConfig) {
    this.canvas = canvas;
    this.game = game;
    this.targetFps = config?.targetFps ?? 60;
    this.frameInterval = this.targetFps > 0 ? 1000 / this.targetFps : 0;
    this.showStats = config?.showStats ?? config?.showFps ?? false;
  }

  /** Current measured FPS. */
  public get fps(): number {
    return this.currentFps;
  }

  /** Draw calls in the last frame. */
  public get drawCalls(): number {
    return this.currentDrawCalls;
  }

  /** Change FPS cap at runtime. 0 = uncapped. */
  public setTargetFps(fps: number): void {
    this.targetFps = fps;
    this.frameInterval = fps > 0 ? 1000 / fps : 0;
  }

  public start(): void {
    GLUTools.init(this.canvas);
    GLStats.install();

    AssetManager.init();
    InputManager.initialize();
    ZoneManager.init();

    gl.clearColor(0, 0, 0.3, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.defaultShader = new DefaultShader();
    this.defaultShader.use();

    if (this.showStats) {
      this.createStatsOverlay();
    }

    this.game.camera = this.camera;
    this.game.init();

    this.resize();
    this.previousTime = performance.now();
    requestAnimationFrame(this.tick.bind(this));
  }

  public getShader(): DefaultShader {
    return this.defaultShader;
  }

  public resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  private tick(): void {
    let now = performance.now();
    let elapsed = now - this.previousTime;

    if (this.frameInterval > 0) {
      this.accumulator += elapsed;
      this.previousTime = now;

      if (this.accumulator < this.frameInterval) {
        requestAnimationFrame(this.tick.bind(this));
        return;
      }

      let delta = this.frameInterval;
      this.accumulator -= this.frameInterval;
      if (this.accumulator > this.frameInterval * 3) {
        this.accumulator = 0;
      }

      this.updateStats(delta);
      this.update(delta);
      this.render();
    } else {
      this.previousTime = now;
      this.updateStats(elapsed);
      this.update(elapsed);
      this.render();
    }

    requestAnimationFrame(this.tick.bind(this));
  }

  private updateStats(delta: number): void {
    this.frameCount++;
    this.fpsTimer += delta;
    if (this.fpsTimer >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer -= 1000;
      if (this.statsElement) {
        this.statsElement.textContent =
          `${this.currentFps} FPS | ${this.currentDrawCalls} draw calls`;
      }
    }
  }

  private update(delta: number): void {
    RigidBodyBehavior.beginFrame();
    MessageBus.update(delta);
    this.game.update(delta);
    ZoneManager.update(delta);
  }

  private render(): void {
    GLStats.reset();

    gl.clear(gl.COLOR_BUFFER_BIT);

    // Compute camera projection — maps world coords to screen
    let proj = this.camera.getProjection(this.canvas.width, this.canvas.height);

    // Set projection on default shader
    this.defaultShader.use();
    let projLoc = this.defaultShader.getUniformLocation("u_proj");
    gl.uniformMatrix4fv(projLoc, false, proj.toFloat32Array());

    // Make projection available to Draw and SpriteBatcher
    Draw.setProjection(proj);

    this.game.render(this.defaultShader);
    ZoneManager.render(this.defaultShader);

    SpriteBatcher.flush();
    Draw.flush(this.defaultShader);

    this.currentDrawCalls = GLStats.drawCalls;
  }

  private createStatsOverlay(): void {
    this.statsElement = document.createElement("div");
    this.statsElement.style.cssText =
      "position:fixed;top:4px;left:4px;color:#0f0;font:bold 14px monospace;" +
      "background:rgba(0,0,0,0.6);padding:2px 6px;pointer-events:none;z-index:9999;";
    this.statsElement.textContent = "0 FPS | 0 draw calls";
    document.body.appendChild(this.statsElement);
  }
}
