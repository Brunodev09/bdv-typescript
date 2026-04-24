import { gl } from './gl';
export class Shader {
    constructor(name) {
        this.attributes = {};
        this.uniforms = {};
        this.shaderName = name;
    }
    get name() {
        return this.shaderName;
    }
    use() {
        gl.useProgram(this.program);
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
    load(vertexSource, fragmentSource) {
        let vertexShader = this.loadShader(vertexSource, gl.VERTEX_SHADER);
        let fragmentShader = this.loadShader(fragmentSource, gl.FRAGMENT_SHADER);
        this.createProgram(vertexShader, fragmentShader);
        this.getAttributes();
        this.getUniforms();
    }
    loadShader(source, shaderType) {
        let shader = gl.createShader(shaderType);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        let error = gl.getShaderInfoLog(shader);
        if (error !== "") {
            throw new Error(`Error while compiling shader program with name ${this.shaderName}: ${error}`);
        }
        return shader;
    }
    createProgram(vertexShader, fragmentShader) {
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        let error = gl.getProgramInfoLog(this.program);
        if (error !== "") {
            throw new Error(`Error linking shader with name ${this.shaderName}: ${error}`);
        }
    }
    getAttributes() {
        let attrCount = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < attrCount; i++) {
            let attrInfo = gl.getActiveAttrib(this.program, i);
            if (!attrInfo)
                break;
            this.attributes[attrInfo.name] = gl.getAttribLocation(this.program, attrInfo.name);
        }
    }
    getUniforms() {
        let uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
            let uniformInfo = gl.getActiveUniform(this.program, i);
            if (!uniformInfo)
                break;
            this.uniforms[uniformInfo.name] = gl.getUniformLocation(this.program, uniformInfo.name);
        }
    }
}
//# sourceMappingURL=shader.js.map