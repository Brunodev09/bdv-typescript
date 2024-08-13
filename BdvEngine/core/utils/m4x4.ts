namespace BdvEngine {
    export class m4x4 {
        private data: number[] = [];

        private constructor() {
            this.data = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        }

        public get mData(): number[] {
            return this.data;
        }

        public static identity(): m4x4 {
            return new m4x4();
        }

        // flattens the perspective frostrum into 2d space
        public static ortho(left: number, right: number, bottom: number, top: number, zNear: number, zFar: number): m4x4 {
            let m = new m4x4();

            let lr: number = 1.0 / (left - right);
            let bt: number = 1.0 / (bottom - top);
            let nf: number = 1.0 / (zNear - zFar);

            m.data[0] = -2.0 * lr;
            m.data[5] = -2.0 * bt;
            m.data[10] = 2.0 * nf;

            m.data[12] = (left + right) * lr;
            m.data[13] = (top + bottom) * bt;
            m.data[14] = (zFar + zNear) * nf;

            return m;
        }

        public static translation(position: vec3): m4x4 {
            let m = new m4x4();

            m.data[12] = position.vx;
            m.data[13] = position.vy;
            m.data[14] = position.vz;

            return m;
        }
    }
}
