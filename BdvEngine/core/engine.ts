
namespace BdvEngine {

    export class Engine {

        private canvas: HTMLCanvasElement;
        private shader: Shader;
        private buffer: WebGLBuffer;

        public constructor(canvas: HTMLCanvasElement) {
            this.canvas = canvas;
        }

        public start(): void {
            GLUTools.init(this.canvas);
            gl.clearColor(0, 0, 0, 1);

            this.loadShaders();
            this.shader.use();

            this.createBuffer();

            this.resize();

            this.loop();
        }

        public resize(): void {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;

            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }

        private loop(): void {
            
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(0);
            gl.drawArrays(gl.TRIANGLES, 0, 3);

            requestAnimationFrame(this.loop.bind(this));
        }

        private createBuffer(): void {
            this.buffer = gl.createBuffer();
            
            let vertices = [
                0, 0, 0,
                0, 0.5, 0,
                0.5, 0.5, 0
            ];

            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
          
            gl.bindBuffer(gl.ARRAY_BUFFER, undefined);
            gl.disableVertexAttribArray(0);
        }

        private loadShaders(): void {
            let vertexSource = `
                attribute vec3 a_pos;
                void main() {
                    gl_Position = vec4(a_pos, 1.0);
                }
            `;
            let fragmentSource = `
                precision mediump float;
                void main() {
                    gl_FragColor = vec4(1.0);
                }
            `;

            this.shader = new Shader("primitiveShader", vertexSource, fragmentSource);
        }
    }
}
