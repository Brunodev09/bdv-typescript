import { vec2 } from '../utils/vec2';
import { Message } from '../com/message';

export enum Keys {
  LEFT = 37,
  UP = 38,
  RIGHT = 39,
  DOWN = 40,

  W = 87,
  A = 65,
  S = 83,
  D = 68,

  SPACE = 32,
  SHIFT = 16,
  ENTER = 13,
  ESCAPE = 27,

  Q = 81,
  E = 69,
  R = 82,
  F = 70,
  Z = 90,
  X = 88,
  C = 67,
  V = 86,
}

export class MouseContext {
  public leftDown: boolean;
  public rightDown: boolean;
  public position: vec2;

  public constructor(leftDown: boolean, rightDown: boolean, position: vec2) {
    this.leftDown = leftDown;
    this.rightDown = rightDown;
    this.position = position;
  }
}

export class InputManager {
  private static _keys: boolean[] = [];

  private static _previousMouseX: number;
  private static _previousMouseY: number;
  private static _mouseX: number;
  private static _mouseY: number;
  private static _leftDown: boolean = false;
  private static _rightDown: boolean = false;
  private static _wheelDelta: number = 0;

  public static initialize(): void {
    for (let i = 0; i < 255; ++i) {
      InputManager._keys[i] = false;
    }

    window.addEventListener("keydown", InputManager.onKeyDown);
    window.addEventListener("keyup", InputManager.onKeyUp);
    window.addEventListener("mousemove", InputManager.onMouseMove);
    window.addEventListener("mousedown", InputManager.onMouseDown);
    window.addEventListener("mouseup", InputManager.onMouseUp);
    window.addEventListener("wheel", InputManager.onWheel, { passive: false });
  }

  public static isKeyDown(key: Keys): boolean {
    return InputManager._keys[key];
  }

  /** Returns accumulated wheel delta since last call, then resets it. */
  public static consumeWheelDelta(): number {
    let d = InputManager._wheelDelta;
    InputManager._wheelDelta = 0;
    return d;
  }

  public static getMousePosition(): vec2 {
    return new vec2(this._mouseX, this._mouseY);
  }

  private static onKeyDown(event: KeyboardEvent): boolean {
    InputManager._keys[event.keyCode] = true;
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  private static onKeyUp(event: KeyboardEvent): boolean {
    InputManager._keys[event.keyCode] = false;
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  private static onMouseMove(event: MouseEvent): void {
    InputManager._previousMouseX = InputManager._mouseX;
    InputManager._previousMouseY = InputManager._mouseY;
    InputManager._mouseX = event.clientX;
    InputManager._mouseY = event.clientY;
  }

  private static onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      InputManager._leftDown = true;
    } else if (event.button === 2) {
      InputManager._rightDown = true;
    }

    Message.send(
      "MOUSE_DOWN",
      InputManager,
      new MouseContext(
        InputManager._leftDown,
        InputManager._rightDown,
        InputManager.getMousePosition(),
      ),
    );
  }

  private static onMouseUp(event: MouseEvent): void {
    if (event.button === 0) {
      InputManager._leftDown = false;
    } else if (event.button === 2) {
      InputManager._rightDown = false;
    }

    Message.send(
      "MOUSE_UP",
      InputManager,
      new MouseContext(
        InputManager._leftDown,
        InputManager._rightDown,
        InputManager.getMousePosition(),
      ),
    );
  }

  private static onWheel(event: WheelEvent): void {
    event.preventDefault();
    InputManager._wheelDelta += event.deltaY;
  }
}
