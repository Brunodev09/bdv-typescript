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

        public static rotationX(angleInRadians: number): m4x4 {
            let m = new m4x4();

            let c = Math.cos(angleInRadians);
            let s = Math.sin(angleInRadians);

            m.data[5] = c;
            m.data[6] = s;
            m.data[9] = -s;
            m.data[10] = c;

            return m;
        }

        public static rotationY(angleInRadians: number): m4x4 {
            let m = new m4x4();

            let c = Math.cos(angleInRadians);
            let s = Math.sin(angleInRadians);

            m.data[0] = c;
            m.data[2] = -s;
            m.data[8] = s;
            m.data[10] = c;

            return m;
        }

        public static rotationZ(angleInRadians: number): m4x4 {
            let m = new m4x4();

            let c = Math.cos(angleInRadians);
            let s = Math.sin(angleInRadians);

            m.data[0] = c;
            m.data[1] = s;
            m.data[4] = -s;
            m.data[5] = c;

            return m;
        }

        public static rotationXYZ(xRadians: number, yRadians: number, zRadians: number): m4x4 {
            let rx = m4x4.rotationX(xRadians);
            let ry = m4x4.rotationY(yRadians);
            let rz = m4x4.rotationZ(zRadians);

            // ZYX
            return m4x4.multiply(m4x4.multiply(rz, ry), rx);
        }

        public static scale(scale: vec3): m4x4 {
            let m = new m4x4();

            m.data[0] = scale.vx;
            m.data[5] = scale.vy;
            m.data[10] = scale.vz;

            return m;
        }

        public static multiply(a: m4x4, b: m4x4): m4x4 {
            let m = new m4x4();

            let b00 = b.data[0 * 4 + 0];
            let b01 = b.data[0 * 4 + 1];
            let b02 = b.data[0 * 4 + 2];
            let b03 = b.data[0 * 4 + 3];
            let b10 = b.data[1 * 4 + 0];
            let b11 = b.data[1 * 4 + 1];
            let b12 = b.data[1 * 4 + 2];
            let b13 = b.data[1 * 4 + 3];
            let b20 = b.data[2 * 4 + 0];
            let b21 = b.data[2 * 4 + 1];
            let b22 = b.data[2 * 4 + 2];
            let b23 = b.data[2 * 4 + 3];
            let b30 = b.data[3 * 4 + 0];
            let b31 = b.data[3 * 4 + 1];
            let b32 = b.data[3 * 4 + 2];
            let b33 = b.data[3 * 4 + 3];
            let a00 = a.data[0 * 4 + 0];
            let a01 = a.data[0 * 4 + 1];
            let a02 = a.data[0 * 4 + 2];
            let a03 = a.data[0 * 4 + 3];
            let a10 = a.data[1 * 4 + 0];
            let a11 = a.data[1 * 4 + 1];
            let a12 = a.data[1 * 4 + 2];
            let a13 = a.data[1 * 4 + 3];
            let a20 = a.data[2 * 4 + 0];
            let a21 = a.data[2 * 4 + 1];
            let a22 = a.data[2 * 4 + 2];
            let a23 = a.data[2 * 4 + 3];
            let a30 = a.data[3 * 4 + 0];
            let a31 = a.data[3 * 4 + 1];
            let a32 = a.data[3 * 4 + 2];
            let a33 = a.data[3 * 4 + 3];

            m.data[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
            m.data[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
            m.data[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
            m.data[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;

            m.data[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
            m.data[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
            m.data[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
            m.data[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;

            m.data[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
            m.data[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
            m.data[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
            m.data[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;

            m.data[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
            m.data[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
            m.data[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
            m.data[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;

            return m;
        }

        public toFloat32Array(): Float32Array {
            return new Float32Array(this.data);
        }

        public copyFrom(m: m4x4): void {
            for (let i = 0; i < 16; i++) {
                this.data[i] = m.data[i];
            }
        }
    }
}
