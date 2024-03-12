namespace BdvEngine {

    export class vec2 {
        private x: number;
        private y: number;

        public constructor(x: number = 0, y: number = 0) {
            this.x = x;
            this.y = y;
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


        public toArray(): number[] {
            return [this.x, this.y];
        }

        public toFloat32(): Float32Array {
            return new Float32Array(this.toArray());
        }
    }
}