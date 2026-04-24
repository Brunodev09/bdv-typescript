import { vec2 } from '../utils/vec2';
import { Message } from '../com/message';
export var Keys;
(function (Keys) {
    Keys[Keys["LEFT"] = 37] = "LEFT";
    Keys[Keys["UP"] = 38] = "UP";
    Keys[Keys["RIGHT"] = 39] = "RIGHT";
    Keys[Keys["DOWN"] = 40] = "DOWN";
})(Keys || (Keys = {}));
export class MouseContext {
    constructor(leftDown, rightDown, position) {
        this.leftDown = leftDown;
        this.rightDown = rightDown;
        this.position = position;
    }
}
export class InputManager {
    static initialize() {
        for (let i = 0; i < 255; ++i) {
            InputManager._keys[i] = false;
        }
        window.addEventListener("keydown", InputManager.onKeyDown);
        window.addEventListener("keyup", InputManager.onKeyUp);
        window.addEventListener("mousemove", InputManager.onMouseMove);
        window.addEventListener("mousedown", InputManager.onMouseDown);
        window.addEventListener("mouseup", InputManager.onMouseUp);
    }
    static isKeyDown(key) {
        return InputManager._keys[key];
    }
    static getMousePosition() {
        return new vec2(this._mouseX, this._mouseY);
    }
    static onKeyDown(event) {
        InputManager._keys[event.keyCode] = true;
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
    static onKeyUp(event) {
        InputManager._keys[event.keyCode] = false;
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
    static onMouseMove(event) {
        InputManager._previousMouseX = InputManager._mouseX;
        InputManager._previousMouseY = InputManager._mouseY;
        InputManager._mouseX = event.clientX;
        InputManager._mouseY = event.clientY;
    }
    static onMouseDown(event) {
        if (event.button === 0) {
            InputManager._leftDown = true;
        }
        else if (event.button === 2) {
            InputManager._rightDown = true;
        }
        Message.send("MOUSE_DOWN", InputManager, new MouseContext(InputManager._leftDown, InputManager._rightDown, InputManager.getMousePosition()));
    }
    static onMouseUp(event) {
        if (event.button === 0) {
            InputManager._leftDown = false;
        }
        else if (event.button === 2) {
            InputManager._rightDown = false;
        }
        Message.send("MOUSE_UP", InputManager, new MouseContext(InputManager._leftDown, InputManager._rightDown, InputManager.getMousePosition()));
    }
}
InputManager._keys = [];
InputManager._leftDown = false;
InputManager._rightDown = false;
//# sourceMappingURL=inputManager.js.map