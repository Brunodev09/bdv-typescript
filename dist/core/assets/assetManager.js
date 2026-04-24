import { Message } from '../com/message';
import { ImageAssetLoader } from './imageAssetLoader';
import { JsonAssetLoader } from './jsonAssetLoader';
export const MESSAGE_ASSET_LOADER_LOADED = "MESSAGE_ASSET_LOADER_LOADED";
export class AssetManager {
    constructor() { }
    static init() {
        AssetManager.loaders.push(new ImageAssetLoader());
        AssetManager.loaders.push(new JsonAssetLoader());
    }
    static register(loader) {
        AssetManager.loaders.push(loader);
    }
    static onLoaded(asset) {
        AssetManager.assetsPool[asset.name] = asset;
        Message.send(`${MESSAGE_ASSET_LOADER_LOADED}::${asset.name}`, this, asset);
    }
    static loadAsset(assetName) {
        let ext = assetName.split(".").pop().toLowerCase();
        for (let loader of AssetManager.loaders) {
            if (loader.supportedExtensions.indexOf(ext) !== -1) {
                loader.loadAsset(assetName);
                return;
            }
        }
        console.log(`AssetManager::Unable to load asset with the defined extension ${ext}.`);
    }
    static isLoaded(assetName) {
        return !!AssetManager.assetsPool[assetName];
    }
    static get(assetName) {
        if (AssetManager.assetsPool[assetName] !== undefined) {
            return AssetManager.assetsPool[assetName];
        }
        else
            AssetManager.loadAsset(assetName);
        return undefined;
    }
}
AssetManager.loaders = [];
AssetManager.assetsPool = {};
//# sourceMappingURL=assetManager.js.map