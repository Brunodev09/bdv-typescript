let engine;
window.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.id = "mainFrame";
    document.body.appendChild(canvas);
    engine = new BdvEngine.Engine(canvas);
    engine.start();
};
window.onresize = () => {
    engine.resize();
};
var BdvEngine;
(function (BdvEngine) {
    class Engine {
        constructor(canvas) {
            this.canvas = canvas;
        }
        start() {
            BdvEngine.GLUTools.init(this.canvas);
            BdvEngine.gl.clearColor(0, 0, 0, 1);
            this.loadShaders();
            this.shader.use();
            this.createBuffer();
            this.resize();
            this.loop();
        }
        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            BdvEngine.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
        loop() {
            BdvEngine.gl.clear(BdvEngine.gl.COLOR_BUFFER_BIT);
            BdvEngine.gl.bindBuffer(BdvEngine.gl.ARRAY_BUFFER, this.buffer);
            BdvEngine.gl.vertexAttribPointer(0, 3, BdvEngine.gl.FLOAT, false, 0, 0);
            BdvEngine.gl.enableVertexAttribArray(0);
            BdvEngine.gl.drawArrays(BdvEngine.gl.TRIANGLES, 0, 3);
            requestAnimationFrame(this.loop.bind(this));
        }
        createBuffer() {
            this.buffer = BdvEngine.gl.createBuffer();
            let vertices = [
                0, 0, 0,
                0, 0.5, 0,
                0.5, 0.5, 0
            ];
            BdvEngine.gl.bindBuffer(BdvEngine.gl.ARRAY_BUFFER, this.buffer);
            BdvEngine.gl.bufferData(BdvEngine.gl.ARRAY_BUFFER, new Float32Array(vertices), BdvEngine.gl.STATIC_DRAW);
            BdvEngine.gl.bindBuffer(BdvEngine.gl.ARRAY_BUFFER, undefined);
            BdvEngine.gl.disableVertexAttribArray(0);
        }
        loadShaders() {
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
            this.shader = new BdvEngine.Shader("primitiveShader", vertexSource, fragmentSource);
        }
    }
    BdvEngine.Engine = Engine;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class GLUTools {
        static init(canvas) {
            BdvEngine.gl = canvas.getContext("webgl");
            if (!BdvEngine.gl)
                throw new Error(`Unable to initialize WebGL.`);
        }
    }
    BdvEngine.GLUTools = GLUTools;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class Shader {
        constructor(name, vertexSource, fragmentSource) {
            this.shaderName = name;
            let vertexShader = this.loadShader(vertexSource, BdvEngine.gl.VERTEX_SHADER);
            let fragmentShader = this.loadShader(fragmentSource, BdvEngine.gl.FRAGMENT_SHADER);
            this.createProgram(vertexShader, fragmentShader);
        }
        get name() {
            return this.shaderName;
        }
        use() {
            BdvEngine.gl.useProgram(this.program);
        }
        loadShader(source, shaderType) {
            let shader = BdvEngine.gl.createShader(shaderType);
            BdvEngine.gl.shaderSource(shader, source);
            BdvEngine.gl.compileShader(shader);
            let error = BdvEngine.gl.getShaderInfoLog(shader);
            if (error !== '') {
                throw new Error(`Error while compiling shader program with name ${this.shaderName}: ${error}`);
            }
            return shader;
        }
        createProgram(vertexShader, fragmentShader) {
            this.program = BdvEngine.gl.createProgram();
            BdvEngine.gl.attachShader(this.program, vertexShader);
            BdvEngine.gl.attachShader(this.program, fragmentShader);
            BdvEngine.gl.linkProgram(this.program);
            let error = BdvEngine.gl.getProgramInfoLog(this.program);
            if (error !== '') {
                throw new Error(`Error linking shader with name ${this.shaderName}: ${error}`);
            }
        }
    }
    BdvEngine.Shader = Shader;
})(BdvEngine || (BdvEngine = {}));
//# sourceMappingURL=main.js.map