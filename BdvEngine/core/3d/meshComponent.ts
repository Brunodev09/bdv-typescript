import { gl } from '../gl/gl';
import { Shader } from '../gl/shader';
import { BaseComponent } from '../components/baseComponent';
import { IComponentData } from '../components/IComponentData';
import { Mesh } from './mesh';
import { Material } from '../graphics/material';
import { MaterialManager } from '../graphics/materialManager';
import { m4x4 } from '../utils/m4x4';

export class MeshComponentData implements IComponentData {
  public name: string = '';
  public materialName: string = '';

  public setFromJson(json: any): void {
    if (json.name !== undefined) this.name = String(json.name);
    if (json.materialName !== undefined) this.materialName = String(json.materialName);
  }
}

export class MeshComponent extends BaseComponent {
  private mesh: Mesh;
  private material: Material;

  constructor(mesh: Mesh, materialName: string) {
    let data = new MeshComponentData();
    data.name = 'mesh';
    data.materialName = materialName;
    super(data);
    this.mesh = mesh;
    this.material = MaterialManager.get(materialName);
  }

  public render(shader: Shader): void {
    let activeShader = shader;

    if (this.material.hasCustomShader) {
      activeShader = this.material.shader!;
      activeShader.use();
    }

    // Model matrix
    let model = this.owner!.getWorldMatrix;
    let modelLoc = activeShader.getUniformLocation("u_model");
    gl.uniformMatrix4fv(modelLoc, false, model.toFloat32Array());

    // Normal matrix (transpose of inverse of model)
    // For uniform scale, the model matrix itself works; for non-uniform we'd need
    // the actual inverse-transpose. This is a good-enough approximation for now.
    let normalMatLoc = activeShader.getUniformLocation("u_normalMatrix");
    gl.uniformMatrix4fv(normalMatLoc, false, model.toFloat32Array());

    // Color
    let colorLoc = activeShader.getUniformLocation("u_color");
    gl.uniform4fv(colorLoc, this.material.diffColor.toArrayFloat32());

    // Texture
    if (this.material.diffTexture) {
      this.material.diffTexture.activate(0);
      let diffLoc = activeShader.getUniformLocation("u_diffuse");
      gl.uniform1i(diffLoc, 0);
    }

    // Custom uniforms
    this.material.applyUniforms(activeShader);

    // Draw
    let posLoc = activeShader.getAttribLocation("a_pos");
    let normalLoc = activeShader.getAttribLocation("a_normal");
    let texLoc = activeShader.getAttribLocation("a_textCoord");

    this.mesh.bind(posLoc, normalLoc, texLoc);
    this.mesh.draw();
    this.mesh.unbind(posLoc, normalLoc, texLoc);

    if (this.material.hasCustomShader) {
      shader.use();
    }
  }
}
