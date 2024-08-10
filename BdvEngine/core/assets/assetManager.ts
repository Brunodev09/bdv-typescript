namespace BdvEngine {
  export const MESSAGE_ASSET_LOADER_LOADED = "MESSAGE_ASSET_LOADER_LOADED";

  export class AssetManager {
    private static loaders: IAssetLoader[] = [];
    private static assetsPool: { [name: string]: IAsset } = {};

    private constructor() {}

    public static init(): void {
      AssetManager.loaders.push(new ImageLoader());
    }

    public static register(loader: IAssetLoader): void {
      AssetManager.loaders.push(loader);
    }

    public static onLoaded(asset: IAsset): void {
      AssetManager.assetsPool[asset.name] = asset;
      Message.send(
        `${MESSAGE_ASSET_LOADER_LOADED}::${asset.name}`,
        this,
        asset
      );
    }

    public static loadAsset(assetName: string): void {
      let ext = assetName.split(".").pop().toLowerCase();
      for (let loader of AssetManager.loaders) {
        if (loader.fileExt.indexOf(ext) !== -1) {
          loader.loadAsset(assetName);
          return;
        }
      }
      console.log(
        `AssetManager::Unable to load asset with the defined extension ${ext}.`
      );
    }

    public static isLoaded(assetName: string): boolean {
      return !!AssetManager.assetsPool[assetName];
    }

    public static get(assetName: string): IAsset {
      if (AssetManager.assetsPool[assetName] !== undefined) {
        return AssetManager.assetsPool[assetName];
      } else AssetManager.loadAsset(assetName);

      return undefined;
    }
  }
}
