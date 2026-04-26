import { Sprite } from './sprite';
import { IMessageHandler } from '../com/IMessageHandler';
import { Message } from '../com/message';
import { MESSAGE_ASSET_LOADER_LOADED, AssetManager } from '../assets/assetManager';
import { ImageAsset } from '../assets/imageAssetLoader';
import { vec2 } from '../utils/vec2';

class UVInfo {
  public min: vec2;
  public max: vec2;

  public constructor(min: vec2, max: vec2) {
    this.min = min;
    this.max = max;
  }
}

export class AnimatedSprite extends Sprite implements IMessageHandler {
  private _frameHeight: number;
  private _frameWidth: number;
  private _frameCount: number;
  private _frameSequence: number[];

  private _frameTime: number = 333;
  private _frameUVs: UVInfo[] = [];

  private _currentFrame: number = 0;
  private _currentTime: number = 0;
  private _assetLoaded: boolean = false;
  private _assetWidth: number = 2;
  private _assetHeight: number = 2;

  public constructor(
    name: string,
    materialName: string,
    width: number = 100,
    height: number = 100,
    frameWidth: number = 10,
    frameHeight: number = 10,
    frameCount: number = 1,
    frameSequence: number[] = [],
  ) {
    super(name, materialName, width, height);

    this._frameWidth = frameWidth;
    this._frameHeight = frameHeight;
    this._frameCount = frameCount;
    this._frameSequence = frameSequence;

    Message.subscribe(
      `${MESSAGE_ASSET_LOADER_LOADED}::${this.material.diffTextureName}`,
      this,
    );

    // If the image asset is already loaded we missed its message — pull it
    // from AssetManager directly so we don't get stuck waiting forever.
    let asset = AssetManager.get(
      this.material.diffTextureName,
    ) as ImageAsset;
    if (asset) {
      this._assetLoaded = true;
      this._assetWidth = asset.width;
      this._assetHeight = asset.height;
      this.calculateUVs();
    }
  }

  public destructor(): void {
    super.destructor();
  }

  public onMessage(message: Message): void {
    if (
      message.code ===
      `${MESSAGE_ASSET_LOADER_LOADED}::${this.material.diffTextureName}`
    ) {
      this._assetLoaded = true;
      let asset = message.context as ImageAsset;
      this._assetHeight = asset.height;
      this._assetWidth = asset.width;
      this.calculateUVs();
    }
  }

  /** Change the frame sequence at runtime. Only resets frame if sequence actually changed. */
  public setFrameSequence(sequence: number[]): void {
    // Skip if same sequence (avoid resetting animation mid-play)
    if (this._frameSequence.length === sequence.length &&
        this._frameSequence.every((v, i) => v === sequence[i])) return;
    this._frameSequence = sequence;
    this._currentFrame = 0;
    this._currentTime = 0;
  }

  /** Change ms per frame at runtime. */
  public setFrameTime(ms: number): void {
    this._frameTime = ms;
  }

  /** Get the current frame sequence. */
  public get frameSequence(): number[] {
    return this._frameSequence;
  }

  public load(): void {
    super.load();
  }

  public update(time: number): void {
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
      this.vertices[1].texCoords = new vec2(
        this._frameUVs[frameUVs].min.vx,
        this._frameUVs[frameUVs].max.vy,
      );
      this.vertices[2].texCoords.copyFrom(this._frameUVs[frameUVs].max);
      this.vertices[3].texCoords.copyFrom(this._frameUVs[frameUVs].max);
      this.vertices[4].texCoords = new vec2(
        this._frameUVs[frameUVs].max.vx,
        this._frameUVs[frameUVs].min.vy,
      );
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

  private calculateUVs(): void {
    let colsPerRow = Math.floor(this._assetWidth / this._frameWidth);
    for (let i = 0; i < this._frameCount; ++i) {
      let col = i % colsPerRow;
      let row = Math.floor(i / colsPerRow);

      let u = (col * this._frameWidth) / this._assetWidth;
      let v = (row * this._frameHeight) / this._assetHeight;
      let uMax = ((col + 1) * this._frameWidth) / this._assetWidth;
      let vMax = ((row + 1) * this._frameHeight) / this._assetHeight;

      this._frameUVs.push(new UVInfo(new vec2(u, v), new vec2(uMax, vMax)));
    }
  }
}
