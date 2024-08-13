namespace BdvEngine {
    export class Material {
        private name: string;
        private diffuseTextureName: string;
        private diffuseTexture: Texture;
        private color: Color;

        public constructor(name: string, diffuseTextureName: string, color: Color) {
            this.name = name;
            this.diffuseTextureName = diffuseTextureName;
            this.color = color;

            if (this.diffuseTextureName) {
                this.diffuseTexture = TextureManager.getTexture(this.diffuseTextureName);
            }
        }

        public get materialName(): string {
            return this.name;
        }

        public get diffTexture(): Texture {
            return this.diffuseTexture;
        }

        public get diffTextureName(): string {
            return this.diffuseTextureName;
        }

        public set diffTextureName(value: string) {
            if (this.diffuseTexture) {
                TextureManager.flushTexture(this.diffuseTextureName);
            }
            this.diffuseTextureName = value;

            if (this.diffuseTextureName) {
                this.diffuseTexture = TextureManager.getTexture(this.diffuseTextureName);
            }
        }

        public get diffColor() {
            return this.color;
        }

        public set diffColor(color: Color) {
            this.color = color;
        }

        public destructor(): void {
            TextureManager.flushTexture(this.diffuseTextureName);
            this.diffuseTexture = undefined;
        }
    }
}
