import { IComponentData } from './IComponentData';
import { IComponentBuilder } from './IComponentBuilder';
import { IComponent } from './IComponents';
import { BaseComponent } from './baseComponent';
import { ComponentManager } from './componentManager';
import { AssetManager } from '../assets/assetManager';
import { AudioManager, AudioHandle } from '../audio/audioManager';

export class AudioComponentData implements IComponentData {
  public name!: string;
  public assetName!: string;
  public volume: number = 1;
  public loop: boolean = false;
  public autoplay: boolean = false;
  public channel: 'sfx' | 'music' = 'sfx';

  public setFromJson(json: any): void {
    if (json.name !== undefined) this.name = String(json.name);
    if (json.assetName !== undefined) this.assetName = String(json.assetName);
    if (json.volume !== undefined) this.volume = Number(json.volume);
    if (json.loop !== undefined) this.loop = Boolean(json.loop);
    if (json.autoplay !== undefined) this.autoplay = Boolean(json.autoplay);
    if (json.channel !== undefined) this.channel = json.channel === 'music' ? 'music' : 'sfx';
  }
}

export class AudioComponentBuilder implements IComponentBuilder {
  public get type(): string {
    return "audio";
  }

  public buildFromJson(json: any): IComponent {
    const data = new AudioComponentData();
    data.setFromJson(json);
    return new AudioComponent(data);
  }
}

/**
 * Plays a sound asset attached to a SimObject. Mirrors SpriteComponent's
 * shape (data + builder + registered with ComponentManager). Audio is loaded
 * through AssetManager just like images, so the same load lifecycle applies.
 */
export class AudioComponent extends BaseComponent {
  private assetName: string;
  private volume: number;
  private loop: boolean;
  private autoplay: boolean;
  private channel: 'sfx' | 'music';
  private handle: AudioHandle | null = null;

  public constructor(data: AudioComponentData) {
    super(data);
    this.assetName = data.assetName;
    this.volume = data.volume;
    this.loop = data.loop;
    this.autoplay = data.autoplay;
    this.channel = data.channel;
  }

  public load(): void {
    if (!AssetManager.isLoaded(this.assetName)) {
      AssetManager.loadAsset(this.assetName);
    }
    if (this.autoplay) this.play();
  }

  public unload(): void {
    this.stop();
  }

  public play(): AudioHandle | null {
    this.stop();
    this.handle = AudioManager.play(this.assetName, {
      volume: this.volume,
      loop: this.loop,
      channel: this.channel,
    });
    return this.handle;
  }

  public stop(): void {
    if (this.handle) {
      this.handle.stop();
      this.handle = null;
    }
  }

  public setVolume(v: number): void {
    this.volume = v;
    if (this.handle) this.handle.setVolume(v);
  }

  public get isPlaying(): boolean {
    return this.handle !== null && !this.handle.stopped;
  }
}

ComponentManager.registerBuilder(new AudioComponentBuilder());
