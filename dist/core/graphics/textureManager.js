import { Texture } from './texture';
import { TextureNode } from './textureNode';
export class TextureManager {
    constructor() { }
    static getTexture(name) {
        if (!TextureManager.textures[name]) {
            let texture = new Texture(name);
            TextureManager.textures[name] = new TextureNode(texture);
        }
        else {
            TextureManager.textures[name].count++;
        }
        return TextureManager.textures[name].texture;
    }
    static flushTexture(name) {
        if (!TextureManager.textures[name]) {
            console.log(`TextureManager::Texture ${name} does not exists and cannot be flushed.`);
        }
        else {
            TextureManager.textures[name].count--;
            if (TextureManager.textures[name].count < 1) {
                TextureManager.textures[name].texture.destructor();
                TextureManager.textures[name] = undefined;
                delete TextureManager.textures[name];
            }
        }
    }
}
TextureManager.textures = {};
//# sourceMappingURL=textureManager.js.map