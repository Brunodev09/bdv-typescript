
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
            
            AssetManager.init();

            gl.clearColor(0, 0, 0, 1);

            this.loadShaders();
            this.shader.use();

            this.projectionMatrix = m4x4.ortho(0, this.canvas.width, 0, this.canvas.height, -100.0, 100.0);

            this.sprite = new Sprite("block", "assets/block.png", 16, 16);
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

            MessageBus.update(0);
            
            gl.clear(gl.COLOR_BUFFER_BIT);

            let colorPosition = this.shader.getUniformLocation("u_color");
            gl.uniform4f(colorPosition, 1, 1, 1, 1);

            let projectionPosition = this.shader.getUniformLocation("u_proj");
            gl.uniformMatrix4fv(projectionPosition, false, new Float32Array(this.projectionMatrix.mData));

            let transformLocation = this.shader.getUniformLocation("u_transf");
            gl.uniformMatrix4fv(transformLocation, false, new Float32Array(m4x4.translation(this.sprite.position).mData));

            this.sprite.render(this.shader);

            requestAnimationFrame(this.loop.bind(this));
        }

        // Fragment shader doesn't have access to attributes, that is why we need to copy the reference of
        // a_textCoord to the type of 'varying' which will give the Fragment shader access to it.
        private loadShaders(): void {
            let vertexSource = `
                attribute vec3 a_pos;
                attribute vec2 a_textCoord;

                uniform mat4 u_proj;
                uniform mat4 u_transf;

                varying vec2 v_textCoord;

                void main() {
                    gl_Position = u_proj * u_transf * vec4(a_pos, 1.0);
                    v_textCoord = a_textCoord;
                }
            `;
            // Retrieving the color information of a texture is called sampling
            // That is why we're using 'sampler2D' type on the 'u_diffuse' uniform
            // texture(): vec4
            let fragmentSource = `
                precision mediump float;
                uniform vec4 u_color;
                uniform sampler2D u_diffuse;

                varying vec2 v_textCoord;

                void main() {
                    gl_FragColor = u_color * texture2D(u_diffuse, v_textCoord);
                }
            `;

            this.shader = new Shader("primitiveShader", vertexSource, fragmentSource);
        }
    }
}
