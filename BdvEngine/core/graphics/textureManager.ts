namespace BdvEngine {
    export class TextureManager {
        private static textures: {[name: string]: TextureNode} = {};

        private constructor() {}

        public static getTexture(name: string): Texture {
            if (!TextureManager.textures[name]) {
                let texture = new Texture(name);
                TextureManager.textures[name] = new TextureNode(texture);
            } else {
                TextureManager.textures[name].count++;
            }
            return TextureManager.textures[name].texture;
        }

        public static flushTexture(name: string): void {
            if (!TextureManager.textures[name]) {
                console.log(`TextureManager::Texture ${name} does not exists and cannot be flushed.`);
            } else {
                TextureManager.textures[name].count--;
                if (TextureManager.textures[name].count < 1) {
                    TextureManager.textures[name].texture.destructor();
                    TextureManager.textures[name] = undefined;
                    delete TextureManager.textures[name];
                }
            }
        }
    }
}
