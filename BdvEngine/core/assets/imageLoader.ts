namespace BdvEngine {
  export class ImageLoader implements IAssetLoader {
    public get fileExt(): string[] {
      return ["png", "gif", "jpg"];
    }

    loadAsset(assetName: string): void {
      let img: HTMLImageElement = new Image();
      img.onload = this.onLoaded.bind(this, assetName, img);
      img.src = assetName;
    }

    private onLoaded(assetName: string, image: HTMLImageElement): void {
      console.log(
        `ImageLoader::onLoaded: assetName/image ${assetName}/${image}`
      );
      let asset = new ImageAsset(assetName, image);
      AssetManager.onLoaded(asset);
    }
  }
}
