
namespace BdvEngine {

    export class Engine {

        private canvas: HTMLCanvasElement;
        private shader: Shader;
        private projectionMatrix: m4x4;

        private sprite: Sprite;

        public constructor(canvas: HTMLCanvasElement) {
            this.canvas = canvas;
        }

        public start(): void {
            GLUTools.init(this.canvas);
            gl.clearColor(0, 0, 0, 1);

            this.loadShaders();
            this.shader.use();

            this.projectionMatrix = m4x4.ortho(0, this.canvas.width, 0, this.canvas.height, -100.0, 100.0);

            this.sprite = new Sprite('test');
            this.sprite.load();
            this.sprite.position.vx = 200;

            this.resize();
            this.loop();
        }

        public resize(): void {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;

            gl.viewport(-1, 1, -1, 1);
        }

        private loop(): void {
            
            gl.clear(gl.COLOR_BUFFER_BIT);

            let colorPosition = this.shader.getUniformLocation("u_color");
            gl.uniform4f(colorPosition, 0, 1, 0, 1);

            let projectionPosition = this.shader.getUniformLocation("u_proj");
            gl.uniformMatrix4fv(projectionPosition, false, new Float32Array(this.projectionMatrix.mData));

            let transformLocation = this.shader.getUniformLocation("u_transf");
            gl.uniformMatrix4fv(transformLocation, false, new Float32Array(m4x4.translation(this.sprite.position).mData));

            this.sprite.render();

            requestAnimationFrame(this.loop.bind(this));
        }

        private loadShaders(): void {
            let vertexSource = `
                attribute vec3 a_pos;
                uniform mat4 u_proj;
                uniform mat4 u_transf;

                void main() {
                    gl_Position = u_proj * u_transf * vec4(a_pos, 1.0);
                }
            `;
            let fragmentSource = `
                precision mediump float;
                uniform vec4 u_color;

                void main() {
                    gl_FragColor = u_color;
                }
            `;

            this.shader = new Shader("primitiveShader", vertexSource, fragmentSource);
        }
    }
}
