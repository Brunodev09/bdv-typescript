namespace BdvEngine {
  export class ImageAsset implements IAsset {
    public readonly name: string;
    public readonly data: HTMLImageElement;

    public constructor(name: string, data: HTMLImageElement) {
      this.name = name;
      this.data = data;
    }

    public get width(): number {
      return this.data.width;
    }

    public get height(): number {
      return this.data.height;
    }
  }
}
