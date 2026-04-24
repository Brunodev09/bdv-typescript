import { vec3 } from '../utils/vec3';
import { vec2 } from '../utils/vec2';
export class Vertex {
    constructor(x = 0, y = 0, z = 0, tu = 0, tv = 0) {
        this.position = vec3.zero;
        this.texCoords = vec2.zero;
        this.position.vx = x;
        this.position.vy = y;
        this.position.vz = z;
        this.texCoords.vx = tu;
        this.texCoords.vy = tv;
    }
    toArray() {
        let array = [];
        array = array.concat(this.position.toArray());
        array = array.concat(this.texCoords.toArray());
        return array;
    }
    toFloat32Array() {
        return new Float32Array(this.toArray());
    }
}
//# sourceMappingURL=vertex.js.map