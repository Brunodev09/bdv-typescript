import { gl } from '../gl/gl';
import { TextureManager } from './textureManager';
export class Material {
    constructor(name, diffuseTextureName, color, shader) {
        this.uniforms = new Map();
        this.name = name;
        this.diffuseTextureName = diffuseTextureName;
        this.color = color;
        this.customShader = shader || null;
        if (this.diffuseTextureName) {
            this.diffuseTexture = TextureManager.getTexture(this.diffuseTextureName);
        }
    }
    get materialName() {
        return this.name;
    }
    get diffTexture() {
        return this.diffuseTexture;
    }
    get diffTextureName() {
        return this.diffuseTextureName;
    }
    set diffTextureName(value) {
        if (this.diffuseTexture) {
            TextureManager.flushTexture(this.diffuseTextureName);
        }
        this.diffuseTextureName = value;
        if (this.diffuseTextureName) {
            this.diffuseTexture = TextureManager.getTexture(this.diffuseTextureName);
        }
    }
    get diffColor() {
        return this.color;
    }
    set diffColor(color) {
        this.color = color;
    }
    get hasCustomShader() {
        return this.customShader !== null;
    }
    get shader() {
        return this.customShader;
    }
    setUniform(name, value) {
        this.uniforms.set(name, value);
    }
    getUniform(name) {
        return this.uniforms.get(name);
    }
    applyUniforms(shader) {
        this.uniforms.forEach((value, name) => {
            let loc;
            try {
                loc = shader.getUniformLocation(name);
            }
            catch (_a) {
                return;
            }
            if (typeof value === 'number') {
                gl.uniform1f(loc, value);
            }
            else if (value instanceof Float32Array) {
                switch (value.length) {
                    case 2:
                        gl.uniform2fv(loc, value);
                        break;
                    case 3:
                        gl.uniform3fv(loc, value);
                        break;
                    case 4:
                        gl.uniform4fv(loc, value);
                        break;
                    case 9:
                        gl.uniformMatrix3fv(loc, false, value);
                        break;
                    case 16:
                        gl.uniformMatrix4fv(loc, false, value);
                        break;
                    default:
                        gl.uniform1fv(loc, value);
                        break;
                }
            }
            else if (Array.isArray(value)) {
                let arr = new Float32Array(value);
                switch (arr.length) {
                    case 2:
                        gl.uniform2fv(loc, arr);
                        break;
                    case 3:
                        gl.uniform3fv(loc, arr);
                        break;
                    case 4:
                        gl.uniform4fv(loc, arr);
                        break;
                    case 9:
                        gl.uniformMatrix3fv(loc, false, arr);
                        break;
                    case 16:
                        gl.uniformMatrix4fv(loc, false, arr);
                        break;
                    default:
                        gl.uniform1fv(loc, arr);
                        break;
                }
            }
        });
    }
    destructor() {
        TextureManager.flushTexture(this.diffuseTextureName);
        this.diffuseTexture = undefined;
    }
}
//# sourceMappingURL=material.js.map