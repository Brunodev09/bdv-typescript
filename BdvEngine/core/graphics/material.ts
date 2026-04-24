import { gl } from '../gl/gl';
import { Color } from './color';
import { Texture } from './texture';
import { TextureManager } from './textureManager';
import { Shader } from '../gl/shader';

export type UniformValue = number | number[] | Float32Array;

export class Material {
  private name: string;
  private diffuseTextureName: string;
  private diffuseTexture!: Texture;
  private color: Color;
  private customShader: Shader | null;
  private uniforms: Map<string, UniformValue> = new Map();

  public constructor(
    name: string,
    diffuseTextureName: string,
    color: Color,
    shader?: Shader,
  ) {
    this.name = name;
    this.diffuseTextureName = diffuseTextureName;
    this.color = color;
    this.customShader = shader || null;

    if (this.diffuseTextureName) {
      this.diffuseTexture = TextureManager.getTexture(
        this.diffuseTextureName,
      );
    }
  }

  public get materialName(): string {
    return this.name;
  }

  public get diffTexture(): Texture {
    return this.diffuseTexture;
  }

  public get diffTextureName(): string {
    return this.diffuseTextureName;
  }

  public set diffTextureName(value: string) {
    if (this.diffuseTexture) {
      TextureManager.flushTexture(this.diffuseTextureName);
    }
    this.diffuseTextureName = value;

    if (this.diffuseTextureName) {
      this.diffuseTexture = TextureManager.getTexture(
        this.diffuseTextureName,
      );
    }
  }

  public get diffColor() {
    return this.color;
  }

  public set diffColor(color: Color) {
    this.color = color;
  }

  /** Whether this material uses a custom shader instead of the default. */
  public get hasCustomShader(): boolean {
    return this.customShader !== null;
  }

  /** The custom shader, or null to use the default. */
  public get shader(): Shader | null {
    return this.customShader;
  }

  /** Set a custom uniform value (float, vec, or matrix). */
  public setUniform(name: string, value: UniformValue): void {
    this.uniforms.set(name, value);
  }

  /** Get a previously set custom uniform value. */
  public getUniform(name: string): UniformValue | undefined {
    return this.uniforms.get(name);
  }

  /**
   * Apply all custom uniforms to the currently bound shader.
   * Called internally by Sprite.render — users don't need to call this.
   */
  public applyUniforms(shader: Shader): void {
    this.uniforms.forEach((value, name) => {
      let loc: WebGLUniformLocation;
      try {
        loc = shader.getUniformLocation(name);
      } catch {
        return; // uniform not active in this shader, skip
      }

      if (typeof value === 'number') {
        gl.uniform1f(loc, value);
      } else if (value instanceof Float32Array) {
        switch (value.length) {
          case 2:  gl.uniform2fv(loc, value); break;
          case 3:  gl.uniform3fv(loc, value); break;
          case 4:  gl.uniform4fv(loc, value); break;
          case 9:  gl.uniformMatrix3fv(loc, false, value); break;
          case 16: gl.uniformMatrix4fv(loc, false, value); break;
          default: gl.uniform1fv(loc, value); break;
        }
      } else if (Array.isArray(value)) {
        let arr = new Float32Array(value);
        switch (arr.length) {
          case 2:  gl.uniform2fv(loc, arr); break;
          case 3:  gl.uniform3fv(loc, arr); break;
          case 4:  gl.uniform4fv(loc, arr); break;
          case 9:  gl.uniformMatrix3fv(loc, false, arr); break;
          case 16: gl.uniformMatrix4fv(loc, false, arr); break;
          default: gl.uniform1fv(loc, arr); break;
        }
      }
    });
  }

  public destructor(): void {
    TextureManager.flushTexture(this.diffuseTextureName);
    this.diffuseTexture = undefined as any;
  }
}
