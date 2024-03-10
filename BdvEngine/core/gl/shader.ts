
namespace BdvEngine {

    export class Shader {
        private shaderName: string;
        private program: WebGLProgram;
        private attributes: {[name: string]: number} = {};

        public constructor(name: string, vertexSource: string, fragmentSource: string) {
            this.shaderName = name;
            let vertexShader = this.loadShader(vertexSource, gl.VERTEX_SHADER);
            let fragmentShader = this.loadShader(fragmentSource, gl.FRAGMENT_SHADER);

            this.createProgram(vertexShader, fragmentShader);
        }

        public get name(): string {
            return this.shaderName;
        }

        public use(): void {
            gl.useProgram(this.program);
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
    }

}