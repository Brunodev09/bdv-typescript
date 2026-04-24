import { gl } from '../gl/gl';
import { glBuffer, glAttrInfo } from '../gl/glBuffer';
import { Vertex } from './vertex';
import { Shader } from '../gl/shader';
import { Material } from './material';
import { MaterialManager } from './materialManager';
import { m4x4 } from '../utils/m4x4';
import { Draw } from './draw';

export class Sprite {
  protected name: string;
  protected width: number;
  protected height: number;

  protected buffer!: glBuffer;

  protected materialName: string;
  protected material: Material;
  protected vertices: Vertex[] = [];

  public constructor(
    name: string,
    materialName: string,
    width: number = 100,
    height: number = 100,
  ) {
    this.name = name;
    this.width = width;
    this.height = height;
    this.materialName = materialName;
    this.material = MaterialManager.get(this.materialName);
  }

  public destructor(): void {
    this.buffer.destroy();
    MaterialManager.flush(this.materialName);
    this.material = undefined as any;
    this.materialName = undefined as any;
  }

  public get getName(): string {
    return this.name;
  }

  public load(): void {
    this.buffer = new glBuffer();

    let positionAttr = new glAttrInfo();
    positionAttr.location = 0;
    positionAttr.size = 3;
    this.buffer.addAttrLocation(positionAttr);

    let textCoordAttr = new glAttrInfo();
    textCoordAttr.location = 1;
    textCoordAttr.size = 2;
    this.buffer.addAttrLocation(textCoordAttr);

    this.vertices =
      // xyz, u,v
      [
        new Vertex(0, 0, 0, 0, 0),
        new Vertex(0, this.height, 0, 0, 1.0),
        new Vertex(this.width, this.height, 0, 1.0, 1.0),
        new Vertex(this.width, this.height, 0, 1.0, 1.0),
        new Vertex(this.width, 0, 0, 1.0, 0),
        new Vertex(0, 0, 0, 0, 0),
      ];

    for (let v of this.vertices) {
      this.buffer.pushBack(v.toArray());
    }

    this.buffer.upload();
    this.buffer.unbind();
  }

  public update(tick: number): void {}

  public render(shader: Shader, modelMatrix: m4x4): void {
    // If the material has a custom shader, switch to it and set projection
    let activeShader = shader;
    if (this.material.hasCustomShader) {
      activeShader = this.material.shader!;
      activeShader.use();

      // Set projection on the custom shader
      const projLoc = activeShader.getUniformLocation("u_proj");
      gl.uniformMatrix4fv(projLoc, false, new Float32Array(Draw.getProjection().mData));
    }

    // Set transform
    const transformLocation = activeShader.getUniformLocation("u_transf");
    gl.uniformMatrix4fv(
      transformLocation,
      false,
      modelMatrix.toFloat32Array(),
    );

    // Set color
    const colorLocation = activeShader.getUniformLocation("u_color");
    gl.uniform4fv(colorLocation, this.material.diffColor.toArrayFloat32());

    // Bind texture
    if (this.material.diffTexture) {
      this.material.diffTexture.activate(0);
      const diffuseLocation = activeShader.getUniformLocation("u_diffuse");
      gl.uniform1i(diffuseLocation, 0);
    }

    // Apply custom uniforms from the material
    this.material.applyUniforms(activeShader);

    this.buffer.bind();
    this.buffer.draw();

    // Restore the default shader if we switched
    if (this.material.hasCustomShader) {
      shader.use();
    }
  }
}
