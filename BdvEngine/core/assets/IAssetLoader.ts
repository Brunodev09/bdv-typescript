namespace BdvEngine {

    export interface IAssetLoader {
        readonly fileExt: string[];
        
        loadAsset(assetName: string): void;
    }
}