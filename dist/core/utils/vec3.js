export class vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    get vx() {
        return this.x;
    }
    set vx(point) {
        this.x = point;
    }
    get vy() {
        return this.y;
    }
    set vy(point) {
        this.y = point;
    }
    get vz() {
        return this.z;
    }
    set vz(point) {
        this.z = point;
    }
    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }
    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }
    multiply(v) {
        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;
        return this;
    }
    divide(v) {
        this.x /= v.x;
        this.y /= v.y;
        this.z /= v.z;
        return this;
    }
    copyFrom(vec) {
        this.x = vec.x;
        this.y = vec.y;
        this.z = vec.z;
    }
    toArray() {
        return [this.x, this.y, this.z];
    }
    toFloat32() {
        return new Float32Array(this.toArray());
    }
    static get zero() {
        return new vec3();
    }
    static get one() {
        return new vec3(1, 1, 1);
    }
    setFromJson(json) {
        if (json.x !== undefined) {
            this.x = Number(json.x);
        }
        if (json.y !== undefined) {
            this.y = Number(json.y);
        }
        if (json.z !== undefined) {
            this.z = Number(json.z);
        }
    }
}
//# sourceMappingURL=vec3.js.map