import { AssetManager } from './assetManager';
export class JsonAsset {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }
}
export class JsonAssetLoader {
    get supportedExtensions() {
        return ["json"];
    }
    loadAsset(assetName) {
        let request = new XMLHttpRequest();
        request.open("GET", assetName);
        request.addEventListener("load", this.onJsonLoaded.bind(this, assetName, request));
        request.send();
    }
    onJsonLoaded(assetName, request) {
        console.log("onJsonLoaded: assetName/request", assetName, request);
        if (request.readyState === request.DONE) {
            let json = JSON.parse(request.responseText);
            let asset = new JsonAsset(assetName, json);
            AssetManager.onLoaded(asset);
        }
    }
}
//# sourceMappingURL=jsonAssetLoader.js.map