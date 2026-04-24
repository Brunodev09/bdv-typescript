import './registrations';
import { gl } from './gl/gl';
import { GLUTools } from './gl/gl';
import { DefaultShader } from './gl/shaders/defaultShader';
import { AssetManager } from './assets/assetManager';
import { InputManager, MouseContext } from './input/inputManager';
import { ZoneManager } from './world/zoneManager';
import { Material } from './graphics/material';
import { MaterialManager } from './graphics/materialManager';
import { Color } from './graphics/color';
import { m4x4 } from './utils/m4x4';
import { Message } from './com/message';
import { IMessageHandler } from './com/IMessageHandler';
import { MessageBus } from './com/messageBus';

export class Engine implements IMessageHandler {
  private canvas: HTMLCanvasElement;
  private defaultShader!: DefaultShader;
  private projectionMatrix!: m4x4;
  private previousTime: number = 0;

  public constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  public start(): void {
    GLUTools.init(this.canvas);

    AssetManager.init();
    InputManager.initialize();
    ZoneManager.init();

    //gl.clearColor(0, 0, 0, 1);
    Message.subscribe("MOUSE_UP", this);

    gl.clearColor(0, 0, 0.3, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.defaultShader = new DefaultShader();
    this.defaultShader.use();

    // MaterialManager.register(
    //   new Material(
    //     "block_mat",
    //     "assets/textures/block.png",
    //     new Color(0, 128, 255, 255),
    //   ),
    // );
    MaterialManager.register(
      new Material("block", "assets/textures/block.png", Color.white()),
    );
    MaterialManager.register(
      new Material("duck", "assets/textures/duck.png", Color.white()),
    );

    this.projectionMatrix = m4x4.ortho(
      0,
      this.canvas.width,
      this.canvas.height,
      0,
      -100.0,
      100.0,
    );

    ZoneManager.changeZone(0);

    this.resize();
    this.loop();
  }

  public onMessage(message: Message): void {
    if (message.code === "MOUSE_UP") {
      let context = message.context as MouseContext;
      document.title = `Pos: [${context.position.vx},${context.position.vy}]`;
    }
  }

  public resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    this.projectionMatrix = m4x4.ortho(
      0,
      this.canvas.width,
      this.canvas.height,
      0,
      -100.0,
      100.0,
    );
  }

  private loop(): void {
    this.update();
    this.render();
  }

  private update(): void {
    let delta = performance.now() - this.previousTime;

    gl.clear(gl.COLOR_BUFFER_BIT);
    MessageBus.update(delta);
    ZoneManager.update(delta);

    this.previousTime = performance.now();
  }

  private render(): void {
    gl.clear(gl.COLOR_BUFFER_BIT);

    ZoneManager.render(this.defaultShader);

    let projectionPosition = this.defaultShader.getUniformLocation("u_proj");
    gl.uniformMatrix4fv(
      projectionPosition,
      false,
      new Float32Array(this.projectionMatrix.mData),
    );

    requestAnimationFrame(this.loop.bind(this));
  }
}
