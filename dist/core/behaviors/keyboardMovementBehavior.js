import { BaseBehavior } from './baseBehavior';
import { InputManager, Keys } from '../input/inputManager';
import { BehaviorManager } from './behaviorManager';
export class KeyboardMovementBehaviorData {
    constructor() {
        this.speed = 0.1;
    }
    setFromJson(json) {
        if (json.name === undefined) {
            throw new Error("Name must be defined in behavior data.");
        }
        this.name = String(json.name);
        if (json.speed !== undefined) {
            this.speed = Number(json.speed);
        }
    }
}
export class KeyboardMovementBehaviorBuilder {
    get type() {
        return "keyboardMovement";
    }
    buildFromJson(json) {
        let data = new KeyboardMovementBehaviorData();
        data.setFromJson(json);
        return new KeyboardMovementBehavior(data);
    }
}
export class KeyboardMovementBehavior extends BaseBehavior {
    constructor(data) {
        super(data);
        this.speed = 0.1;
        this.speed = data.speed;
    }
    update(time) {
        if (InputManager.isKeyDown(Keys.LEFT)) {
            this._owner.transform.position.vx -= this.speed;
        }
        if (InputManager.isKeyDown(Keys.RIGHT)) {
            this._owner.transform.position.vx += this.speed;
        }
        if (InputManager.isKeyDown(Keys.UP)) {
            this._owner.transform.position.vy -= this.speed;
        }
        if (InputManager.isKeyDown(Keys.DOWN)) {
            this._owner.transform.position.vy += this.speed;
        }
        super.update(time);
    }
}
BehaviorManager.registerBuilder(new KeyboardMovementBehaviorBuilder());
//# sourceMappingURL=keyboardMovementBehavior.js.map