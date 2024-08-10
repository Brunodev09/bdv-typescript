namespace BdvEngine {
  const LEVEL: number = 0;
  const BORDER: number = 0;
  const TEMP_IMAGE_DATA: Uint8Array = new Uint8Array([255, 255, 255, 255]);

  export class Texture implements IMessageHandler {
    private name: string;
    private handle: WebGLTexture;
    private isLoaded: boolean = false;
    private width: number;
    private height: number;

    public constructor(name: string, width: number = 1, height: number = 1) {
      this.name = name;
      this.width = width;
      this.height = height;

      this.handle = gl.createTexture();

      Message.subscribe(`${MESSAGE_ASSET_LOADER_LOADED}::${this.name}`, this);

      this.bind();

      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(
        gl.TEXTURE_2D,
        LEVEL,
        gl.RGBA,
        1,
        1,
        BORDER,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        TEMP_IMAGE_DATA
      );

      let asset = AssetManager.get(this.name) as ImageAsset;

      if (asset) {
        this.loadTexture(asset);
      }
    }

    public destructor(): void {
      gl.deleteTexture(this.handle);
    }

    public get textureName(): string {
      return this.name;
    }

    public get textureWidth(): number {
      return this.width;
    }

    public get textureHeight(): number {
      return this.height;
    }

    public get textureIsLoaded(): boolean {
      return this.isLoaded;
    }

    public activate(textureUnit: number = 0): void {
      // 32 channels to activate the sampled texture in the shader
      // gl.TEXTURE0 -> 0
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
      this.bind();
    }

    public bind(): void {
      gl.bindTexture(gl.TEXTURE_2D, this.handle);
    }

    public unbind(): void {
      gl.bindTexture(gl.TEXTURE_2D, undefined);
    }

    public onMessage(message: Message): void {
      if (message.code === `${MESSAGE_ASSET_LOADER_LOADED}::${this.name}`) {
        this.loadTexture(message.context as ImageAsset);
      }
    }

    private loadTexture(asset: ImageAsset): void {
      this.width = asset.width;
      this.height = asset.height;

      this.bind();

      gl.texImage2D(
        gl.TEXTURE_2D,
        LEVEL,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        asset.data
      );

      if (this.isPow2()) {
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        // For some reason in WebGL if a value is *NOT* ^2
        // If its not a pow2 we simply can't tile it (clap wrapping to edge)
        // Also for some reason WeGL names U,V coords as S and T. Go figure.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }

      this.isLoaded = true;
    }

    private isPow2(): boolean {
      return this.isValPow2(this.width) && this.isValPow2(this.height);
    }

    private isValPow2(value: number): boolean {
      return (value & (value - 1)) == 0;
    }
  }
}
