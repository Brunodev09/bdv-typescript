namespace BdvEngine {
    export class Color {
        private red: number;
        private green: number;
        private blue: number;
        private alpha: number;

        public constructor(r: number = 255, g: number = 255, b: number = 255, a: number = 255) {
            this.red = r;
            this.green = g;
            this.blue = b;
            this.alpha = a;
        }

        public get r(): number {
            return this.red;
        }

        public get rFloat(): number {
            return this.red / 255.0;
        }

        public set r(value: number) {
            this.red = value;
        }

        public get g(): number {
            return this.green;
        }

        public get gFloat(): number {
            return this.green / 255.0;
        }

        public set g(value: number) {
            this.green = value;
        }

        public get b(): number {
            return this.blue;
        }

        public get bFloat(): number {
            return this.blue / 255.0;
        }

        public set b(value: number) {
            this.blue = value;
        }

        public get a(): number {
            return this.alpha;
        }

        public get aFloat(): number {
            return this.alpha / 255.0;
        }

        public set a(value: number) {
            this.alpha = value;
        }

        public toArray(): number[] {
            return [this.red, this.green, this.blue, this.alpha];
        }

        public toArrayFloat(): number[] {
            return [this.red / 255.0, this.green / 255.0, this.blue / 255.0, this.alpha / 255.0];
        }

        public toArrayFloat32(): Float32Array {
            return new Float32Array(this.toArrayFloat());
        }

        public static white(): Color {
            return new Color(255, 255, 255, 255);
        }

        public static black(): Color {
            return new Color(0, 0, 0, 255);
        }

        public static red(): Color {
            return new Color(255, 0, 0, 255);
        }

        public static green(): Color {
            return new Color(0, 255, 0, 255);
        }

        public static blue(): Color {
            return new Color(0, 0, 255, 255);
        }
    }
}
