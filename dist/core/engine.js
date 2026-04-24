import './registrations';
import { gl } from './gl/gl';
import { GLUTools } from './gl/gl';
import { DefaultShader } from './gl/shaders/defaultShader';
import { AssetManager } from './assets/assetManager';
import { InputManager } from './input/inputManager';
import { ZoneManager } from './world/zoneManager';
import { m4x4 } from './utils/m4x4';
import { MessageBus } from './com/messageBus';
import { Draw } from './graphics/draw';
import { SpriteBatcher } from './graphics/spriteBatcher';
export class Engine {
    constructor(canvas, game, config) {
        var _a, _b;
        this.previousTime = 0;
        this.accumulator = 0;
        this.frameCount = 0;
        this.fpsTimer = 0;
        this.currentFps = 0;
        this.fpsElement = null;
        this.canvas = canvas;
        this.game = game;
        this.targetFps = (_a = config === null || config === void 0 ? void 0 : config.targetFps) !== null && _a !== void 0 ? _a : 60;
        this.frameInterval = this.targetFps > 0 ? 1000 / this.targetFps : 0;
        this.showFps = (_b = config === null || config === void 0 ? void 0 : config.showFps) !== null && _b !== void 0 ? _b : false;
    }
    get fps() {
        return this.currentFps;
    }
    setTargetFps(fps) {
        this.targetFps = fps;
        this.frameInterval = fps > 0 ? 1000 / fps : 0;
    }
    start() {
        GLUTools.init(this.canvas);
        AssetManager.init();
        InputManager.initialize();
        ZoneManager.init();
        gl.clearColor(0, 0, 0.3, 1);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this.defaultShader = new DefaultShader();
        this.defaultShader.use();
        this.projectionMatrix = m4x4.ortho(0, this.canvas.width, this.canvas.height, 0, -100.0, 100.0);
        if (this.showFps) {
            this.createFpsOverlay();
        }
        this.game.init();
        this.resize();
        this.previousTime = performance.now();
        requestAnimationFrame(this.tick.bind(this));
    }
    getShader() {
        return this.defaultShader;
    }
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        this.projectionMatrix = m4x4.ortho(0, this.canvas.width, this.canvas.height, 0, -100.0, 100.0);
    }
    tick() {
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
            this.updateFpsCounter(delta);
            this.update(delta);
            this.render();
        }
        else {
            this.previousTime = now;
            this.updateFpsCounter(elapsed);
            this.update(elapsed);
            this.render();
        }
        requestAnimationFrame(this.tick.bind(this));
    }
    updateFpsCounter(delta) {
        this.frameCount++;
        this.fpsTimer += delta;
        if (this.fpsTimer >= 1000) {
            this.currentFps = this.frameCount;
            this.frameCount = 0;
            this.fpsTimer -= 1000;
            if (this.fpsElement) {
                this.fpsElement.textContent = `${this.currentFps} FPS`;
            }
        }
    }
    update(delta) {
        MessageBus.update(delta);
        this.game.update(delta);
        ZoneManager.update(delta);
    }
    render() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        let projectionPosition = this.defaultShader.getUniformLocation("u_proj");
        gl.uniformMatrix4fv(projectionPosition, false, new Float32Array(this.projectionMatrix.mData));
        Draw.setProjection(this.projectionMatrix);
        this.game.render(this.defaultShader);
        ZoneManager.render(this.defaultShader);
        SpriteBatcher.flush();
    }
    createFpsOverlay() {
        this.fpsElement = document.createElement("div");
        this.fpsElement.style.cssText =
            "position:fixed;top:4px;left:4px;color:#0f0;font:bold 14px monospace;" +
                "background:rgba(0,0,0,0.6);padding:2px 6px;pointer-events:none;z-index:9999;";
        this.fpsElement.textContent = "0 FPS";
        document.body.appendChild(this.fpsElement);
    }
}
//# sourceMappingURL=engine.js.map