import { Sprite } from './sprite';
import { Message } from '../com/message';
import { MESSAGE_ASSET_LOADER_LOADED, AssetManager } from '../assets/assetManager';
import { vec2 } from '../utils/vec2';
class UVInfo {
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }
}
export class AnimatedSprite extends Sprite {
    constructor(name, materialName, width = 100, height = 100, frameWidth = 10, frameHeight = 10, frameCount = 1, frameSequence = []) {
        super(name, materialName, width, height);
        this._frameTime = 333;
        this._frameUVs = [];
        this._currentFrame = 0;
        this._currentTime = 0;
        this._assetLoaded = false;
        this._assetWidth = 2;
        this._assetHeight = 2;
        this._frameWidth = frameWidth;
        this._frameHeight = frameHeight;
        this._frameCount = frameCount;
        this._frameSequence = frameSequence;
        Message.subscribe(`${MESSAGE_ASSET_LOADER_LOADED}::${this.material.diffTextureName}`, this);
        let asset = AssetManager.get(this.material.diffTextureName);
        if (asset) {
            this._assetLoaded = true;
            this._assetWidth = asset.width;
            this._assetHeight = asset.height;
            this.calculateUVs();
        }
    }
    destructor() {
        super.destructor();
    }
    onMessage(message) {
        if (message.code ===
            `${MESSAGE_ASSET_LOADER_LOADED}::${this.material.diffTextureName}`) {
            this._assetLoaded = true;
            let asset = message.context;
            this._assetHeight = asset.height;
            this._assetWidth = asset.width;
            this.calculateUVs();
        }
    }
    load() {
        super.load();
    }
    update(time) {
        if (!this._assetLoaded) {
            return;
        }
        this._currentTime += time;
        if (this._currentTime > this._frameTime) {
            this._currentFrame++;
            this._currentTime = 0;
            if (this._currentFrame >= this._frameSequence.length) {
                this._currentFrame = 0;
            }
            let frameUVs = this._frameSequence[this._currentFrame];
            this.vertices[0].texCoords.copyFrom(this._frameUVs[frameUVs].min);
            this.vertices[1].texCoords = new vec2(this._frameUVs[frameUVs].min.vx, this._frameUVs[frameUVs].max.vy);
            this.vertices[2].texCoords.copyFrom(this._frameUVs[frameUVs].max);
            this.vertices[3].texCoords.copyFrom(this._frameUVs[frameUVs].max);
            this.vertices[4].texCoords = new vec2(this._frameUVs[frameUVs].max.vx, this._frameUVs[frameUVs].min.vy);
            this.vertices[5].texCoords.copyFrom(this._frameUVs[frameUVs].min);
            this.buffer.clearData();
            for (let v of this.vertices) {
                this.buffer.pushBack(v.toArray());
            }
            this.buffer.upload();
            this.buffer.unbind();
        }
        super.update(time);
    }
    calculateUVs() {
        let totalWidth = 0;
        let yValue = 0;
        for (let i = 0; i < this._frameCount; ++i) {
            totalWidth += this._frameWidth;
            if (totalWidth > this._assetWidth) {
                yValue++;
                totalWidth = 0;
            }
            console.log("w/h", this._assetWidth, this._assetHeight);
            let u = (i * this._frameWidth) / this._assetWidth;
            let v = (yValue * this._frameHeight) / this._assetHeight;
            let min = new vec2(u, v);
            let uMax = (i * this._frameWidth + this._frameWidth) / this._assetWidth;
            let vMax = (yValue * this._frameHeight + this._frameHeight) / this._assetHeight;
            let max = new vec2(uMax, vMax);
            this._frameUVs.push(new UVInfo(min, max));
        }
    }
}
//# sourceMappingURL=animatedSprite.js.map