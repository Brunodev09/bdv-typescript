
namespace BdvEngine {

    export class Engine {

        private canvas: HTMLCanvasElement;
        private shader: Shader;
        private buffer: glBuffer;

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

            let colorPosition = this.shader.getUniformLocation("u_color");
            gl.uniform4f(colorPosition, 1, 0.5, 0, 1);

            this.buffer.bind();
            this.buffer.draw();

            requestAnimationFrame(this.loop.bind(this));
        }

        private createBuffer(): void {
            this.buffer = new glBuffer(3);

            let positionAttr = new glAttrInfo();
            positionAttr.location = this.shader.getAttribLocation("a_pos");
            positionAttr.offset = 0;
            positionAttr.size = 3;

            this.buffer.addAttrLocation(positionAttr);
            
            let vertices = [
                0, 0, 0,
                0, 0.5, 0,
                0.5, 0.5, 0
            ];

            this.buffer.pushBack(vertices);
            this.buffer.upload();
            this.buffer.unbind();
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
                uniform vec4 u_color;
                void main() {
                    gl_FragColor = u_color;
                }
            `;

            this.shader = new Shader("primitiveShader", vertexSource, fragmentSource);
        }
    }
}
