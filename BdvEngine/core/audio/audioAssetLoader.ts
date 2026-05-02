import { IAsset } from '../assets/IAsset';
import { IAssetLoader } from '../assets/IAssetLoader';
import { AssetManager } from '../assets/assetManager';
import { AudioManager } from './audioManager';

export class AudioAsset implements IAsset {
  public readonly name: string;
  public readonly data: AudioBuffer;

  public constructor(name: string, data: AudioBuffer) {
    this.name = name;
    this.data = data;
  }

  public get duration(): number {
    return this.data.duration;
  }
}

export class AudioAssetLoader implements IAssetLoader {
  public get supportedExtensions(): string[] {
    return ["mp3", "wav", "ogg", "m4a"];
  }

  public loadAsset(assetName: string): void {
    const request = new XMLHttpRequest();
    request.open("GET", assetName, true);
    request.responseType = "arraybuffer";
    request.addEventListener("load", () => this.onArrayBufferLoaded(assetName, request));
    request.addEventListener("error", () => {
      console.error(`AudioAssetLoader::Failed to fetch ${assetName}`);
    });
    request.send();
  }

  private onArrayBufferLoaded(assetName: string, request: XMLHttpRequest): void {
    if (request.status !== 0 && (request.status < 200 || request.status >= 300)) {
      console.error(`AudioAssetLoader::HTTP ${request.status} for ${assetName}`);
      return;
    }
    AudioManager.context.decodeAudioData(
      request.response,
      (buffer) => {
        AssetManager.onLoaded(new AudioAsset(assetName, buffer));
      },
      (err) => {
        console.error(`AudioAssetLoader::Decode failed for ${assetName}`, err);
      },
    );
  }
}
