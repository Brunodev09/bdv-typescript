export class Color {
    constructor(r = 255, g = 255, b = 255, a = 255) {
        this.red = r;
        this.green = g;
        this.blue = b;
        this.alpha = a;
    }
    get r() {
        return this.red;
    }
    get rFloat() {
        return this.red / 255.0;
    }
    set r(value) {
        this.red = value;
    }
    get g() {
        return this.green;
    }
    get gFloat() {
        return this.green / 255.0;
    }
    set g(value) {
        this.green = value;
    }
    get b() {
        return this.blue;
    }
    get bFloat() {
        return this.blue / 255.0;
    }
    set b(value) {
        this.blue = value;
    }
    get a() {
        return this.alpha;
    }
    get aFloat() {
        return this.alpha / 255.0;
    }
    set a(value) {
        this.alpha = value;
    }
    toArray() {
        return [this.red, this.green, this.blue, this.alpha];
    }
    toArrayFloat() {
        return [
            this.red / 255.0,
            this.green / 255.0,
            this.blue / 255.0,
            this.alpha / 255.0,
        ];
    }
    toArrayFloat32() {
        return new Float32Array(this.toArrayFloat());
    }
    static white() {
        return new Color(255, 255, 255, 255);
    }
    static black() {
        return new Color(0, 0, 0, 255);
    }
    static red() {
        return new Color(255, 0, 0, 255);
    }
    static green() {
        return new Color(0, 255, 0, 255);
    }
    static blue() {
        return new Color(0, 0, 255, 255);
    }
}
//# sourceMappingURL=color.js.map