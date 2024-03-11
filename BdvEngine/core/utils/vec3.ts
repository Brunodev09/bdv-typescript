namespace BdvEngine {

    export class vec3 {
        private x: number;
        private y: number;
        private z: number;

        public constructor(x: number = 0, y: number = 0, z: number = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        public get vx(): number {
            return this.x;
        }

        public set vx(point: number) {
            this.x = point;
        }

        public get vy(): number {
            return this.y;
        }

        public set vy(point: number) {
            this.y = point;
        }

        public get vz(): number {
            return this.z;
        }

        public set vz(point: number) {
            this.z = point;
        }

        public toArray(): number[] {
            return [this.x, this.y, this.z];
        }

        public toFloat32(): Float32Array {
            return new Float32Array(this.toArray());
        }
    }
}