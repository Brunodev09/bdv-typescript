import { vec3 } from './vec3';
import { m4x4 } from './m4x4';
export class transform {
    constructor() {
        this.position = vec3.zero;
        this.rotation = vec3.zero;
        this.scale = vec3.one;
    }
    copyFrom(transform) {
        this.position.copyFrom(transform.position);
        this.rotation.copyFrom(transform.rotation);
        this.scale.copyFrom(transform.scale);
    }
    getTransformationMatrix() {
        let translation = m4x4.translation(this.position);
        let rotation = m4x4.rotationXYZ(this.rotation.vx, this.rotation.vy, this.rotation.vz);
        let scale = m4x4.scale(this.scale);
        return m4x4.multiply(m4x4.multiply(translation, rotation), scale);
    }
    setFromJson(json) {
        if (json.position !== undefined) {
            this.position.setFromJson(json.position);
        }
        if (json.rotation !== undefined) {
            this.rotation.setFromJson(json.rotation);
        }
        if (json.scale !== undefined) {
            this.scale.setFromJson(json.scale);
        }
    }
}
//# sourceMappingURL=transform.js.map