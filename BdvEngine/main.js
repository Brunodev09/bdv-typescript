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
            let colorPosition = this.shader.getUniformLocation("u_color");
            BdvEngine.gl.uniform4f(colorPosition, 1, 0.5, 0, 1);
            this.buffer.bind();
            this.buffer.draw();
            requestAnimationFrame(this.loop.bind(this));
        }
        createBuffer() {
            this.buffer = new BdvEngine.glBuffer(3);
            let positionAttr = new BdvEngine.glAttrInfo();
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
        loadShaders() {
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
    class glAttrInfo {
    }
    BdvEngine.glAttrInfo = glAttrInfo;
    class glBuffer {
        constructor(elementSize, dataType = BdvEngine.gl.FLOAT, targetBufferType = BdvEngine.gl.ARRAY_BUFFER, mode = BdvEngine.gl.TRIANGLES) {
            this.hasAttrLocation = false;
            this.data = [];
            this.attrInfo = [];
            this.elementSize = elementSize;
            this.type = dataType;
            this.targetBufferType = targetBufferType;
            this.mode = mode;
            switch (this.type) {
                case BdvEngine.gl.UNSIGNED_INT:
                case BdvEngine.gl.INT:
                case BdvEngine.gl.FLOAT: {
                    this.typeSize = 4;
                    break;
                }
                case BdvEngine.gl.UNSIGNED_SHORT:
                case BdvEngine.gl.SHORT: {
                    this.typeSize = 2;
                    break;
                }
                case BdvEngine.gl.UNSIGNED_BYTE:
                case BdvEngine.gl.BYTE: {
                    this.typeSize = 1;
                    break;
                }
                default: {
                    throw new Error(`Unable to determine byte size for type ${this.type}.`);
                }
            }
            this.stride = this.elementSize * this.typeSize;
            this.buffer = BdvEngine.gl.createBuffer();
        }
        destroy() {
            BdvEngine.gl.deleteBuffer(this.buffer);
        }
        bind(normalized = false) {
            BdvEngine.gl.bindBuffer(this.targetBufferType, this.buffer);
            if (this.hasAttrLocation) {
                for (let attr of this.attrInfo) {
                    BdvEngine.gl.vertexAttribPointer(attr.location, attr.size, this.type, normalized, this.stride, attr.offset * this.typeSize);
                    BdvEngine.gl.enableVertexAttribArray(attr.location);
                }
            }
        }
        unbind() {
            for (let attr of this.attrInfo) {
                BdvEngine.gl.disableVertexAttribArray(attr.location);
            }
            BdvEngine.gl.bindBuffer(BdvEngine.gl.ARRAY_BUFFER, this.buffer);
        }
        addAttrLocation(info) {
            this.hasAttrLocation = true;
            this.attrInfo.push(info);
        }
        pushBack(data) {
            for (let each of data) {
                this.data.push(each);
            }
        }
        upload() {
            BdvEngine.gl.bindBuffer(this.targetBufferType, this.buffer);
            let bufferData;
            switch (this.type) {
                case BdvEngine.gl.FLOAT: {
                    bufferData = new Float32Array(this.data);
                    break;
                }
                case BdvEngine.gl.INT: {
                    bufferData = new Int32Array(this.data);
                    break;
                }
                case BdvEngine.gl.UNSIGNED_INT: {
                    bufferData = new Uint32Array(this.data);
                    break;
                }
                case BdvEngine.gl.SHORT: {
                    bufferData = new Int16Array(this.data);
                    break;
                }
                case BdvEngine.gl.UNSIGNED_SHORT: {
                    bufferData = new Uint16Array(this.data);
                    break;
                }
                case BdvEngine.gl.BYTE: {
                    bufferData = new Int8Array(this.data);
                    break;
                }
                case BdvEngine.gl.UNSIGNED_BYTE: {
                    bufferData = new Uint8Array(this.data);
                    break;
                }
                default: {
                    throw new Error(`Unable to determine byte size for type ${this.type}.`);
                }
            }
            BdvEngine.gl.bufferData(this.targetBufferType, bufferData, BdvEngine.gl.STATIC_DRAW);
        }
        draw() {
            if (this.targetBufferType === BdvEngine.gl.ARRAY_BUFFER) {
                BdvEngine.gl.drawArrays(this.mode, 0, this.data.length / this.elementSize);
            }
            else if (this.targetBufferType === BdvEngine.gl.ELEMENT_ARRAY_BUFFER) {
                BdvEngine.gl.drawElements(this.mode, this.data.length, this.type, 0);
            }
        }
    }
    BdvEngine.glBuffer = glBuffer;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class Shader {
        constructor(name, vertexSource, fragmentSource) {
            this.attributes = {};
            this.uniforms = {};
            this.shaderName = name;
            let vertexShader = this.loadShader(vertexSource, BdvEngine.gl.VERTEX_SHADER);
            let fragmentShader = this.loadShader(fragmentSource, BdvEngine.gl.FRAGMENT_SHADER);
            this.createProgram(vertexShader, fragmentShader);
            this.getAttributes();
            this.getUniforms();
        }
        get name() {
            return this.shaderName;
        }
        use() {
            BdvEngine.gl.useProgram(this.program);
        }
        getAttribLocation(name) {
            if (this.attributes[name] === null || this.attributes[name] === undefined)
                throw new Error(`Unable to fetch attr with name ${name} in shader ${this.shaderName}.`);
            return this.attributes[name];
        }
        getUniformLocation(name) {
            if (this.uniforms[name] === null || this.uniforms[name] === undefined)
                throw new Error(`Unable to fetch uniform with name ${name} in shader ${this.shaderName}.`);
            return this.uniforms[name];
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
        getAttributes() {
            let attrCount = BdvEngine.gl.getProgramParameter(this.program, BdvEngine.gl.ACTIVE_ATTRIBUTES);
            for (let i = 0; i < attrCount; i++) {
                let attrInfo = BdvEngine.gl.getActiveAttrib(this.program, i);
                if (!attrInfo)
                    break;
                this.attributes[attrInfo.name] = BdvEngine.gl.getAttribLocation(this.program, attrInfo.name);
            }
        }
        getUniforms() {
            let uniformCount = BdvEngine.gl.getProgramParameter(this.program, BdvEngine.gl.ACTIVE_UNIFORMS);
            for (let i = 0; i < uniformCount; i++) {
                let uniformInfo = BdvEngine.gl.getActiveUniform(this.program, i);
                if (!uniformInfo)
                    break;
                this.uniforms[uniformInfo.name] = BdvEngine.gl.getUniformLocation(this.program, uniformInfo.name);
            }
        }
    }
    BdvEngine.Shader = Shader;
})(BdvEngine || (BdvEngine = {}));
//# sourceMappingURL=main.js.map