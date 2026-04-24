export class vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
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
    static get zero() {
        return new vec2();
    }
    static get one() {
        return new vec2(1, 1);
    }
    copyFrom(v) {
        this.x = v.x;
        this.y = v.y;
    }
    setFromJson(json) {
        if (json.x !== undefined) {
            this.x = Number(json.x);
        }
        if (json.y !== undefined) {
            this.y = Number(json.y);
        }
    }
    toArray() {
        return [this.x, this.y];
    }
    toFloat32() {
        return new Float32Array(this.toArray());
    }
}
//# sourceMappingURL=vec2.js.map