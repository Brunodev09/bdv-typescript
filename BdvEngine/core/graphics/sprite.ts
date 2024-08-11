namespace BdvEngine {
  export class Sprite {
    private name: string;
    private width: number;
    private height: number;

    private buffer: glBuffer;

    private materialName: string;
    private material: Material;

    public position: vec3 = new vec3();

    public constructor(
      name: string,
      materialName: string,
      width: number = 100,
      height: number = 100
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
      this.material = undefined;
      this.materialName = undefined;
    }

    public get getName(): string {
      return this.name;
    }

    public load(): void {
      this.buffer = new glBuffer(5);

      let positionAttr = new glAttrInfo();
      positionAttr.location = 0;
      positionAttr.offset = 0;
      positionAttr.size = 3;
      this.buffer.addAttrLocation(positionAttr);

      let textCoordAttr = new glAttrInfo();
      textCoordAttr.location = 1;
      textCoordAttr.offset = 3;
      textCoordAttr.size = 2;
      this.buffer.addAttrLocation(textCoordAttr);

      let vertices = [
        // xyz, u,v
        0,
        0,
        0,
        0,
        0,
        0,
        this.height,
        0,
        0,
        1.0,
        this.width,
        this.height,
        0,
        1.0,
        1.0,

        this.width,
        this.height,
        0,
        1.0,
        1.0,
        this.width,
        0,
        0,
        1.0,
        0,
        0,
        0,
        0,
        0,
        0,
      ];

      this.buffer.pushBack(vertices);
      this.buffer.upload();
      this.buffer.unbind();
    }

    public update(tick: number): void {}

    public render(shader: Shader): void {
      const transformLocation = shader.getUniformLocation("u_transf");
      gl.uniformMatrix4fv(
        transformLocation,
        false,
        new Float32Array(m4x4.translation(this.position).mData)
      );

      const colorLocation = shader.getUniformLocation("u_color");

      gl.uniform4fv(colorLocation, this.material.diffColor.toArrayFloat32());

      if (this.material.diffTexture) {
        this.material.diffTexture.activate(0);
        const diffuseLocation = shader.getUniformLocation("u_diffuse");
        gl.uniform1i(diffuseLocation, 0);
      }

      this.buffer.bind();
      this.buffer.draw();
    }
  }
}
