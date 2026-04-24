import { BaseBehavior } from './baseBehavior';
import { vec3 } from '../utils/vec3';
import { BehaviorManager } from './behaviorManager';
export class RotationBehaviorData {
    constructor() {
        this.rotation = vec3.zero;
    }
    setFromJson(json) {
        if (json.name === undefined) {
            throw new Error("Name must be defined in behavior data.");
        }
        this.name = String(json.name);
        if (json.rotation !== undefined) {
            this.rotation.setFromJson(json.rotation);
        }
    }
}
export class RotationBehaviorBuilder {
    get type() {
        return "rotation";
    }
    buildFromJson(json) {
        let data = new RotationBehaviorData();
        data.setFromJson(json);
        return new RotationBehavior(data);
    }
}
export class RotationBehavior extends BaseBehavior {
    constructor(data) {
        super(data);
        this.rotation = data.rotation;
    }
    update(time) {
        this._owner.transform.rotation.add(this.rotation);
        super.update(time);
    }
}
BehaviorManager.registerBuilder(new RotationBehaviorBuilder());
//# sourceMappingURL=rotationBehavior.js.map