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
export class Engine {
    constructor(canvas, game) {
        this.previousTime = 0;
        this.canvas = canvas;
        this.game = game;
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
        this.game.init();
        this.resize();
        this.loop();
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
    loop() {
        this.update();
        this.render();
    }
    update() {
        let delta = performance.now() - this.previousTime;
        MessageBus.update(delta);
        this.game.update(delta);
        ZoneManager.update(delta);
        this.previousTime = performance.now();
    }
    render() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        let projectionPosition = this.defaultShader.getUniformLocation("u_proj");
        gl.uniformMatrix4fv(projectionPosition, false, new Float32Array(this.projectionMatrix.mData));
        Draw.setProjection(this.projectionMatrix);
        this.game.render(this.defaultShader);
        ZoneManager.render(this.defaultShader);
        requestAnimationFrame(this.loop.bind(this));
    }
}
//# sourceMappingURL=engine.js.map