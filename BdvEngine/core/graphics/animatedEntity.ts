import { Material } from './material';
import { SpriteBatcher } from './spriteBatcher';
import { Color } from './color';

/**
 * State-based animated sprite entity.
 *
 * Define animation states (idle, walk_right, walk_left, etc.),
 * each mapping to a row + frame range in a spritesheet grid.
 * The current state determines which frames play.
 *
 * Usage:
 *   let entity = new AnimatedEntity("human_mat", 8, 2, 50, 96);
 *   entity.addState("idle", 0, 0, 0);              // row 0, frame 0 only
 *   entity.addState("walk_right", 0, 1, 7);         // row 0, frames 1-7
 *   entity.addState("walk_left", 1, 1, 7);          // row 1, frames 1-7
 *   entity.setState("idle");
 *
 *   // In update:
 *   entity.update(deltaTime);
 *   if (movingRight) entity.setState("walk_right");
 *   else if (movingLeft) entity.setState("walk_left");
 *   else entity.setState("idle");
 *
 *   // In render:
 *   entity.render(screenX, screenY, width, height);
 */

interface AnimState {
  row: number;
  startFrame: number;
  endFrame: number;
}

export class AnimatedEntity {
  private materialName: string;
  private gridCols: number;
  private gridRows: number;
  private frameWidth: number;
  private frameHeight: number;

  private states: Map<string, AnimState> = new Map();
  private currentState: string = "";
  private currentFrame: number = 0;
  private frameTime: number = 100; // ms per frame
  private elapsed: number = 0;
  private playing: boolean = true;

  /**
   * @param materialName - Name of the registered Material containing the spritesheet
   * @param gridCols - Number of columns (frames per row) in the spritesheet
   * @param gridRows - Number of rows in the spritesheet
   * @param frameWidth - Pixel width of a single frame (for reference, not used in rendering)
   * @param frameHeight - Pixel height of a single frame
   */
  constructor(materialName: string, gridCols: number, gridRows: number, frameWidth: number = 0, frameHeight: number = 0) {
    this.materialName = materialName;
    this.gridCols = gridCols;
    this.gridRows = gridRows;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
  }

  /**
   * Define an animation state.
   * @param name - State name (e.g. "idle", "walk_right")
   * @param row - Row in the spritesheet (0-indexed)
   * @param startFrame - First frame column (inclusive)
   * @param endFrame - Last frame column (inclusive)
   */
  addState(name: string, row: number, startFrame: number, endFrame: number): void {
    this.states.set(name, { row, startFrame, endFrame });
    if (this.currentState === "") {
      this.currentState = name;
      this.currentFrame = startFrame;
    }
  }

  /**
   * Switch to a state. Resets frame to start if the state changed.
   */
  setState(name: string): void {
    if (name === this.currentState) return;
    let state = this.states.get(name);
    if (!state) return;
    this.currentState = name;
    this.currentFrame = state.startFrame;
    this.elapsed = 0;
  }

  /** Get the current state name. */
  getState(): string {
    return this.currentState;
  }

  /** Set milliseconds per frame. Default: 100ms. */
  setFrameTime(ms: number): void {
    this.frameTime = ms;
  }

  /** Pause/resume animation. */
  setPaused(paused: boolean): void {
    this.playing = !paused;
  }

  /**
   * Advance animation by delta time.
   */
  update(deltaTime: number): void {
    if (!this.playing) return;

    let state = this.states.get(this.currentState);
    if (!state) return;

    // Single-frame state (like idle with 1 frame) — no animation needed
    if (state.startFrame === state.endFrame) {
      this.currentFrame = state.startFrame;
      return;
    }

    this.elapsed += deltaTime;
    if (this.elapsed >= this.frameTime) {
      this.elapsed -= this.frameTime;
      this.currentFrame++;
      if (this.currentFrame > state.endFrame) {
        this.currentFrame = state.startFrame;
      }
    }
  }

  /**
   * Render the current frame at a screen position.
   * Uses SpriteBatcher.drawTexture — batched with other sprites sharing the same texture.
   */
  render(material: Material, x: number, y: number, width: number, height: number, tint?: Color): void {
    let state = this.states.get(this.currentState);
    if (!state) return;

    SpriteBatcher.drawTexture(
      material,
      this.currentFrame,
      state.row,
      this.gridCols,
      this.gridRows,
      x, y, width, height,
      tint,
    );
  }
}
