import { gl } from '../gl/gl';
import { Message } from '../com/message';
import { MESSAGE_ASSET_LOADER_LOADED, AssetManager } from '../assets/assetManager';
const LEVEL = 0;
const BORDER = 0;
const TEMP_IMAGE_DATA = new Uint8Array([255, 255, 255, 255]);
export class Texture {
    constructor(name, width = 1, height = 1) {
        this.isLoaded = false;
        this.name = name;
        this.width = width;
        this.height = height;
        this.handle = gl.createTexture();
        Message.subscribe(`${MESSAGE_ASSET_LOADER_LOADED}::${this.name}`, this);
        this.bind();
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, LEVEL, gl.RGBA, 1, 1, BORDER, gl.RGBA, gl.UNSIGNED_BYTE, TEMP_IMAGE_DATA);
        let asset = AssetManager.get(this.name);
        if (asset) {
            this.loadTexture(asset);
        }
    }
    destructor() {
        gl.deleteTexture(this.handle);
    }
    get textureName() {
        return this.name;
    }
    get textureWidth() {
        return this.width;
    }
    get textureHeight() {
        return this.height;
    }
    get textureIsLoaded() {
        return this.isLoaded;
    }
    activate(textureUnit = 0) {
        gl.activeTexture(gl.TEXTURE0 + textureUnit);
        this.bind();
    }
    bind() {
        gl.bindTexture(gl.TEXTURE_2D, this.handle);
    }
    unbind() {
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    onMessage(message) {
        if (message.code === `${MESSAGE_ASSET_LOADER_LOADED}::${this.name}`) {
            this.loadTexture(message.context);
        }
    }
    loadTexture(asset) {
        this.width = asset.width;
        this.height = asset.height;
        this.bind();
        gl.texImage2D(gl.TEXTURE_2D, LEVEL, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, asset.data);
        if (this.isPow2()) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
        else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        this.isLoaded = true;
    }
    isPow2() {
        return this.isValPow2(this.width) && this.isValPow2(this.height);
    }
    isValPow2(value) {
        return (value & (value - 1)) == 0;
    }
}
//# sourceMappingURL=texture.js.map