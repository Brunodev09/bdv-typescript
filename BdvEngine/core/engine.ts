namespace BdvEngine {
  export class Engine {
    private canvas: HTMLCanvasElement;
    private defaultShader: DefaultShader;
    private projectionMatrix: m4x4;

    private sprite: Sprite;

    public constructor(canvas: HTMLCanvasElement) {
      this.canvas = canvas;
    }

    public start(): void {
      GLUTools.init(this.canvas);

      AssetManager.init();

      gl.clearColor(0, 0, 0, 1);

      this.defaultShader = new DefaultShader();
      this.defaultShader.use();

      this.projectionMatrix = m4x4.ortho(
        0,
        this.canvas.width,
        0,
        this.canvas.height,
        -100.0,
        100.0
      );

      this.sprite = new Sprite("block", "assets/block.png", 32, 32);
      this.sprite.load();
      this.sprite.position.vx = 200;

      this.resize();
      this.loop();
    }

    public resize(): void {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      this.projectionMatrix = m4x4.ortho(
        0,
        this.canvas.width,
        0,
        this.canvas.height,
        -100.0,
        100.0
      );
    }

    private loop(): void {
      MessageBus.update(0);

      gl.clear(gl.COLOR_BUFFER_BIT);

      let colorPosition = this.defaultShader.getUniformLocation("u_color");
      gl.uniform4f(colorPosition, 1, 1, 1, 1);

      let projectionPosition = this.defaultShader.getUniformLocation("u_proj");
      gl.uniformMatrix4fv(
        projectionPosition,
        false,
        new Float32Array(this.projectionMatrix.mData)
      );

      let transformLocation = this.defaultShader.getUniformLocation("u_transf");
      gl.uniformMatrix4fv(
        transformLocation,
        false,
        new Float32Array(m4x4.translation(this.sprite.position).mData)
      );

      this.sprite.render(this.defaultShader);

      requestAnimationFrame(this.loop.bind(this));
    }
  }
}
