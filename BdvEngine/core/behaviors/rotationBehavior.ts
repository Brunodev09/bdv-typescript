import { IBehaviorData } from './IBehaviorData';
import { IBehaviorBuilder } from './IBehaviorBuilder';
import { IBehavior } from './IBehavior';
import { BaseBehavior } from './baseBehavior';
import { vec3 } from '../utils/vec3';
import { BehaviorManager } from './behaviorManager';

export class RotationBehaviorData implements IBehaviorData {
  public name!: string;

  public rotation: vec3 = vec3.zero;

  public setFromJson(json: any): void {
    if (json.name === undefined) {
      throw new Error("Name must be defined in behavior data.");
    }

    this.name = String(json.name);

    if (json.rotation !== undefined) {
      this.rotation.setFromJson(json.rotation);
    }
  }
}

export class RotationBehaviorBuilder implements IBehaviorBuilder {
  public get type(): string {
    return "rotation";
  }

  public buildFromJson(json: any): IBehavior {
    let data = new RotationBehaviorData();
    data.setFromJson(json);
    return new RotationBehavior(data);
  }
}

export class RotationBehavior extends BaseBehavior {
  private rotation: vec3;

  public constructor(data: RotationBehaviorData) {
    super(data);

    this.rotation = data.rotation;
  }

  public update(time: number): void {
    this._owner.transform.rotation.add(this.rotation);

    super.update(time);
  }
}

BehaviorManager.registerBuilder(new RotationBehaviorBuilder());
