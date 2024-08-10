namespace BdvEngine {
  export class Sprite {
    private name: string;
    private width: number;
    private height: number;

    private buffer: glBuffer;

    private texture: Texture;
    private textureName: string;

    public position: vec3 = new vec3();

    public constructor(
      name: string,
      textureName: string,
      width: number = 100,
      height: number = 100
    ) {
      this.name = name;
      this.width = width;
      this.height = height;
      this.textureName = textureName;
      this.texture = TextureManager.getTexture(textureName);
    }

    public destructor(): void {
      this.buffer.destroy();
      TextureManager.flushTexture(this.textureName);
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
      this.texture.activate(0);
      let diffuseLocation = shader.getUniformLocation("u_diffuse");
      gl.uniform1i(diffuseLocation, 0);

      this.buffer.bind();
      this.buffer.draw();
    }
  }
}
