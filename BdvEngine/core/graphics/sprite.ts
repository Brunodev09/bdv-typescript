namespace BdvEngine {
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
      const transformLocation = shader.getUniformLocation("u_transf");
      gl.uniformMatrix4fv(
        transformLocation,
        false,
        modelMatrix.toFloat32Array(),
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
