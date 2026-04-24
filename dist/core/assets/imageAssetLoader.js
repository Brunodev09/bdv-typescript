import { AssetManager } from './assetManager';
export class ImageAsset {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }
    get width() {
        return this.data.width;
    }
    get height() {
        return this.data.height;
    }
}
export class ImageAssetLoader {
    get supportedExtensions() {
        return ["png", "gif", "jpg"];
    }
    loadAsset(assetName) {
        let image = new Image();
        image.onload = this.onImageLoaded.bind(this, assetName, image);
        image.src = assetName;
    }
    onImageLoaded(assetName, image) {
        console.log("onImageLoaded: assetName/image", assetName, image);
        let asset = new ImageAsset(assetName, image);
        AssetManager.onLoaded(asset);
    }
}
//# sourceMappingURL=imageAssetLoader.js.map