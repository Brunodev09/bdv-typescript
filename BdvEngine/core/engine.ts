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

            MaterialManager.register(new Material('block_mat', 'assets/block.png', new Color(0, 128, 255, 255)));

            this.projectionMatrix = m4x4.ortho(0, this.canvas.width, this.canvas.height, 0, -100.0, 100.0);

            this.sprite = new Sprite('block', 'block_mat', 32, 32);
            this.sprite.load();
            this.sprite.position.vx = 200;
            this.sprite.position.vy = 100;

            this.resize();
            this.loop();
        }

        public resize(): void {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;

            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            this.projectionMatrix = m4x4.ortho(0, this.canvas.width, this.canvas.height, 0, -100.0, 100.0);
        }

        private loop(): void {
            MessageBus.update(0);

            gl.clear(gl.COLOR_BUFFER_BIT);

            let projectionPosition = this.defaultShader.getUniformLocation('u_proj');
            gl.uniformMatrix4fv(projectionPosition, false, new Float32Array(this.projectionMatrix.mData));

            this.sprite.render(this.defaultShader);

            requestAnimationFrame(this.loop.bind(this));
        }
    }
}
