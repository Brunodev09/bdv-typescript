import { IBehaviorData } from './IBehaviorData';
import { IBehaviorBuilder } from './IBehaviorBuilder';
import { IBehavior } from './IBehavior';
import { BaseBehavior } from './baseBehavior';
import { InputManager, Keys } from '../input/inputManager';
import { BehaviorManager } from './behaviorManager';

export class KeyboardMovementBehaviorData implements IBehaviorData {
  public name!: string;
  public speed: number = 0.1;

  public setFromJson(json: any): void {
    if (json.name === undefined) {
      throw new Error("Name must be defined in behavior data.");
    }

    this.name = String(json.name);

    if (json.speed !== undefined) {
      this.speed = Number(json.speed);
    }
  }
}

export class KeyboardMovementBehaviorBuilder implements IBehaviorBuilder {
  public get type(): string {
    return "keyboardMovement";
  }

  public buildFromJson(json: any): IBehavior {
    let data = new KeyboardMovementBehaviorData();
    data.setFromJson(json);
    return new KeyboardMovementBehavior(data);
  }
}

export class KeyboardMovementBehavior extends BaseBehavior {
  public speed: number = 0.1;

  public constructor(data: KeyboardMovementBehaviorData) {
    super(data);

    this.speed = data.speed;
  }

  public update(time: number): void {
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
