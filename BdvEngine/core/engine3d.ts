import './registrations';
import { gl } from './gl/gl';
import { GLUTools } from './gl/gl';
import { AssetManager } from './assets/assetManager';
import { InputManager } from './input/inputManager';
import { ZoneManager } from './world/zoneManager';
import { m4x4 } from './utils/m4x4';
import { MessageBus } from './com/messageBus';
import { Game } from './game';
import { Camera } from './3d/camera';
import { LitShader } from './3d/litShader';
import { vec3 } from './utils/vec3';

export interface Engine3DConfig {
  targetFps?: number;
  showFps?: boolean;
  clearColor?: [number, number, number, number];
}

export class Engine3D {
  private canvas: HTMLCanvasElement;
  private litShader!: LitShader;
  private previousTime: number = 0;
  private game: Game;

  /** The camera — move it from your game code. */
  public camera: Camera;

  /** Directional light direction (points toward the light). */
  public lightDir: vec3 = new vec3(0.5, 1.0, 0.8);
  /** Light color (RGB 0-1). */
  public lightColor: vec3 = new vec3(1, 1, 1);
  /** Ambient color (RGB 0-1). */
  public ambientColor: vec3 = new vec3(0.15, 0.15, 0.2);

  // FPS
  private targetFps: number;
  private frameInterval: number;
  private accumulator: number = 0;
  private showFps: boolean;
  private frameCount: number = 0;
  private fpsTimer: number = 0;
  private currentFps: number = 0;
  private fpsElement: HTMLDivElement | null = null;

  constructor(canvas: HTMLCanvasElement, game: Game, config?: Engine3DConfig) {
    this.canvas = canvas;
    this.game = game;
    this.camera = new Camera();
    this.targetFps = config?.targetFps ?? 60;
    this.frameInterval = this.targetFps > 0 ? 1000 / this.targetFps : 0;
    this.showFps = config?.showFps ?? false;

    if (config?.clearColor) {
      this.clearColor = config.clearColor;
    }
  }

  private clearColor: [number, number, number, number] = [0.1, 0.1, 0.15, 1];

  public get fps(): number { return this.currentFps; }

  public setTargetFps(fps: number): void {
    this.targetFps = fps;
    this.frameInterval = fps > 0 ? 1000 / fps : 0;
  }

  public start(): void {
    GLUTools.init(this.canvas);

    AssetManager.init();
    InputManager.initialize();
    ZoneManager.init();

    gl.clearColor(...this.clearColor);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    this.litShader = new LitShader();

    if (this.showFps) {
      this.createFpsOverlay();
    }

    this.game.init();

    this.resize();
    this.previousTime = performance.now();
    requestAnimationFrame(this.tick.bind(this));
  }

  public getShader(): LitShader {
    return this.litShader;
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
      if (this.accumulator > this.frameInterval * 3) this.accumulator = 0;

      this.updateFpsCounter(delta);
      this.update(delta);
      this.render();
    } else {
      this.previousTime = now;
      this.updateFpsCounter(elapsed);
      this.update(elapsed);
      this.render();
    }

    requestAnimationFrame(this.tick.bind(this));
  }

  private updateFpsCounter(delta: number): void {
    this.frameCount++;
    this.fpsTimer += delta;
    if (this.fpsTimer >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer -= 1000;
      if (this.fpsElement) this.fpsElement.textContent = `${this.currentFps} FPS`;
    }
  }

  private update(delta: number): void {
    MessageBus.update(delta);
    this.game.update(delta);
    ZoneManager.update(delta);
  }

  private render(): void {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.litShader.use();

    let aspect = this.canvas.width / this.canvas.height;
    let proj = this.camera.getProjectionMatrix(aspect);
    let view = this.camera.getViewMatrix();

    gl.uniformMatrix4fv(this.litShader.getUniformLocation("u_proj"), false, proj.toFloat32Array());
    gl.uniformMatrix4fv(this.litShader.getUniformLocation("u_view"), false, view.toFloat32Array());

    // Lighting
    gl.uniform3f(this.litShader.getUniformLocation("u_lightDir"), this.lightDir.vx, this.lightDir.vy, this.lightDir.vz);
    gl.uniform3f(this.litShader.getUniformLocation("u_lightColor"), this.lightColor.vx, this.lightColor.vy, this.lightColor.vz);
    gl.uniform3f(this.litShader.getUniformLocation("u_ambientColor"), this.ambientColor.vx, this.ambientColor.vy, this.ambientColor.vz);
    gl.uniform3f(this.litShader.getUniformLocation("u_viewPos"), this.camera.position.vx, this.camera.position.vy, this.camera.position.vz);

    this.game.render(this.litShader);
    ZoneManager.render(this.litShader);
  }

  private createFpsOverlay(): void {
    this.fpsElement = document.createElement("div");
    this.fpsElement.style.cssText =
      "position:fixed;top:4px;left:4px;color:#0f0;font:bold 14px monospace;" +
      "background:rgba(0,0,0,0.6);padding:2px 6px;pointer-events:none;z-index:9999;";
    this.fpsElement.textContent = "0 FPS";
    document.body.appendChild(this.fpsElement);
  }
}
