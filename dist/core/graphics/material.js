import { TextureManager } from './textureManager';
export class Material {
    constructor(name, diffuseTextureName, color) {
        this.name = name;
        this.diffuseTextureName = diffuseTextureName;
        this.color = color;
        if (this.diffuseTextureName) {
            this.diffuseTexture = TextureManager.getTexture(this.diffuseTextureName);
        }
    }
    get materialName() {
        return this.name;
    }
    get diffTexture() {
        return this.diffuseTexture;
    }
    get diffTextureName() {
        return this.diffuseTextureName;
    }
    set diffTextureName(value) {
        if (this.diffuseTexture) {
            TextureManager.flushTexture(this.diffuseTextureName);
        }
        this.diffuseTextureName = value;
        if (this.diffuseTextureName) {
            this.diffuseTexture = TextureManager.getTexture(this.diffuseTextureName);
        }
    }
    get diffColor() {
        return this.color;
    }
    set diffColor(color) {
        this.color = color;
    }
    destructor() {
        TextureManager.flushTexture(this.diffuseTextureName);
        this.diffuseTexture = undefined;
    }
}
//# sourceMappingURL=material.js.map