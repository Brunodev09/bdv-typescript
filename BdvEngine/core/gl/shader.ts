
namespace BdvEngine {

    export class Shader {
        private shaderName: string;
        private program: WebGLProgram;
        private attributes: {[name: string]: number} = {};
        private uniforms: {[name: string]: WebGLUniformLocation} = {};

        public constructor(name: string, vertexSource: string, fragmentSource: string) {
            this.shaderName = name;
            let vertexShader = this.loadShader(vertexSource, gl.VERTEX_SHADER);
            let fragmentShader = this.loadShader(fragmentSource, gl.FRAGMENT_SHADER);

            this.createProgram(vertexShader, fragmentShader);
            this.getAttributes();
            this.getUniforms();
        }

        public get name(): string {
            return this.shaderName;
        }

        public use(): void {
            gl.useProgram(this.program);
        }

        public getAttribLocation(name: string): number {
            if (this.attributes[name] === null || this.attributes[name] === undefined) throw new Error(`Unable to fetch attr with name ${name} in shader ${this.shaderName}.`);
            return this.attributes[name];
        }

        public getUniformLocation(name: string): WebGLUniformLocation {
            if (this.uniforms[name] === null || this.uniforms[name] === undefined) throw new Error(`Unable to fetch uniform with name ${name} in shader ${this.shaderName}.`);
            return this.uniforms[name];
        }

        private loadShader(source: string, shaderType: number): WebGLShader {
            let shader: WebGLShader = gl.createShader(shaderType);

            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            let error = gl.getShaderInfoLog(shader);

            if (error !== '') {
                throw new Error(`Error while compiling shader program with name ${this.shaderName}: ${error}`);
            }

            return shader;
        }

        private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): void {
            this.program = gl.createProgram();

            gl.attachShader(this.program, vertexShader);
            gl.attachShader(this.program, fragmentShader);
            gl.linkProgram(this.program);
            let error = gl.getProgramInfoLog(this.program);

            if (error !== '') {
                throw new Error(`Error linking shader with name ${this.shaderName}: ${error}`);
            }
        }

        private getAttributes(): void {
            let attrCount = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
            for (let i = 0; i < attrCount; i++) {
                let attrInfo: WebGLActiveInfo = gl.getActiveAttrib(this.program, i);
                if (!attrInfo) break;
                this.attributes[attrInfo.name] = gl.getAttribLocation(this.program, attrInfo.name);
            }
        }

        private getUniforms(): void {
            let uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
            for (let i = 0; i < uniformCount; i++) {
                let uniformInfo: WebGLActiveInfo = gl.getActiveUniform(this.program, i);
                if (!uniformInfo) break;
                this.uniforms[uniformInfo.name] = gl.getUniformLocation(this.program, uniformInfo.name);
            }
        }
    }

}