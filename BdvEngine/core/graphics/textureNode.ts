namespace BdvEngine {
    export class TextureNode {
        public texture: Texture;
        public count: number = 1;

        public constructor(texture: Texture) {
            this.texture = texture;
        }
    }
}
