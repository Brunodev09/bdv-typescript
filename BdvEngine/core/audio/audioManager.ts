import { AudioAsset } from './audioAssetLoader';
import { AssetManager } from '../assets/assetManager';

export interface PlayOptions {
  /** Per-instance volume scaler 0..1. Combined with the channel and master gain. */
  volume?: number;
  /** Loop the sound until stopped. */
  loop?: boolean;
  /** Playback rate. 1.0 = normal pitch/speed. */
  rate?: number;
  /** Stereo pan -1 (left) .. 1 (right). */
  pan?: number;
  /** Routing channel — sfx and music can be muted/scaled independently. */
  channel?: 'sfx' | 'music';
}

/**
 * Handle to a playing sound. Returned from AudioManager.play. Allows the
 * caller to stop or adjust the sound after it has started.
 */
export class AudioHandle {
  public readonly source: AudioBufferSourceNode;
  public readonly gain: GainNode;
  public readonly pan: StereoPannerNode | null;
  public stopped: boolean = false;

  public constructor(source: AudioBufferSourceNode, gain: GainNode, pan: StereoPannerNode | null) {
    this.source = source;
    this.gain = gain;
    this.pan = pan;
  }

  public stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    try { this.source.stop(); } catch (e) { /* already stopped */ }
  }

  public setVolume(v: number): void {
    this.gain.gain.value = Math.max(0, v);
  }

  public setPan(p: number): void {
    if (this.pan) this.pan.pan.value = Math.max(-1, Math.min(1, p));
  }

  public setRate(r: number): void {
    this.source.playbackRate.value = Math.max(0.01, r);
  }
}

/**
 * Web Audio backed mixer. Initialized lazily — you can call play() directly
 * and the AudioContext will be created on demand. Most browsers require a
 * user gesture before audio actually starts; init() also wires one-shot
 * listeners that resume() the context on the first click/keydown/touch.
 */
export class AudioManager {
  private static _context: AudioContext | null = null;
  private static masterGain: GainNode;
  private static sfxGain: GainNode;
  private static musicGain: GainNode;
  private static activeHandles: AudioHandle[] = [];
  private static currentMusic: AudioHandle | null = null;
  private static initialized: boolean = false;

  private constructor() {}

  public static init(): void {
    if (AudioManager.initialized) return;
    const Ctx: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) {
      console.warn("AudioManager::Web Audio API not supported in this browser.");
      return;
    }
    AudioManager._context = new Ctx();
    AudioManager.masterGain = AudioManager._context.createGain();
    AudioManager.sfxGain = AudioManager._context.createGain();
    AudioManager.musicGain = AudioManager._context.createGain();
    AudioManager.sfxGain.connect(AudioManager.masterGain);
    AudioManager.musicGain.connect(AudioManager.masterGain);
    AudioManager.masterGain.connect(AudioManager._context.destination);
    AudioManager.initialized = true;

    const resume = () => {
      if (AudioManager._context && AudioManager._context.state === 'suspended') {
        AudioManager._context.resume();
      }
      window.removeEventListener('click', resume);
      window.removeEventListener('keydown', resume);
      window.removeEventListener('touchstart', resume);
    };
    window.addEventListener('click', resume);
    window.addEventListener('keydown', resume);
    window.addEventListener('touchstart', resume);
  }

  public static get context(): AudioContext {
    if (!AudioManager._context) AudioManager.init();
    return AudioManager._context!;
  }

  public static setMasterVolume(v: number): void {
    AudioManager.init();
    AudioManager.masterGain.gain.value = Math.max(0, v);
  }

  public static setSfxVolume(v: number): void {
    AudioManager.init();
    AudioManager.sfxGain.gain.value = Math.max(0, v);
  }

  public static setMusicVolume(v: number): void {
    AudioManager.init();
    AudioManager.musicGain.gain.value = Math.max(0, v);
  }

  /**
   * Play a previously-loaded audio asset. If the asset is not yet loaded the
   * call is a no-op (returns null) — load it via AssetManager.loadAsset first
   * and listen for MESSAGE_ASSET_LOADER_LOADED, or call after load completes.
   */
  public static play(assetName: string, options: PlayOptions = {}): AudioHandle | null {
    AudioManager.init();
    const asset = AssetManager.get(assetName) as AudioAsset | undefined;
    if (!asset || !(asset.data instanceof AudioBuffer)) return null;

    const ctx = AudioManager._context!;
    const source = ctx.createBufferSource();
    source.buffer = asset.data;
    source.loop = options.loop ?? false;
    source.playbackRate.value = options.rate ?? 1;

    const gain = ctx.createGain();
    gain.gain.value = options.volume ?? 1;

    let panNode: StereoPannerNode | null = null;
    let head: AudioNode = source;
    if (options.pan !== undefined && typeof ctx.createStereoPanner === 'function') {
      panNode = ctx.createStereoPanner();
      panNode.pan.value = Math.max(-1, Math.min(1, options.pan));
      source.connect(panNode);
      head = panNode;
    }

    head.connect(gain);
    const channelGain = options.channel === 'music' ? AudioManager.musicGain : AudioManager.sfxGain;
    gain.connect(channelGain);
    source.start();

    const handle = new AudioHandle(source, gain, panNode);
    AudioManager.activeHandles.push(handle);
    source.onended = () => {
      handle.stopped = true;
      const idx = AudioManager.activeHandles.indexOf(handle);
      if (idx !== -1) AudioManager.activeHandles.splice(idx, 1);
      if (AudioManager.currentMusic === handle) AudioManager.currentMusic = null;
    };
    return handle;
  }

  /**
   * Convenience: stop any currently playing music, then play a looping music
   * track on the music channel.
   */
  public static playMusic(assetName: string, volume: number = 1): AudioHandle | null {
    if (AudioManager.currentMusic) AudioManager.currentMusic.stop();
    const handle = AudioManager.play(assetName, { loop: true, volume, channel: 'music' });
    AudioManager.currentMusic = handle;
    return handle;
  }

  public static stopMusic(): void {
    if (AudioManager.currentMusic) {
      AudioManager.currentMusic.stop();
      AudioManager.currentMusic = null;
    }
  }

  public static stopAll(): void {
    for (const h of AudioManager.activeHandles.slice()) h.stop();
    AudioManager.activeHandles = [];
    AudioManager.currentMusic = null;
  }
}
