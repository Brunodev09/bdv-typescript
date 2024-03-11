namespace BdvEngine {

    export class Sprite {

        private name: string;
        private width: number;
        private height: number;

        private buffer: glBuffer;

        public position: vec3 = new vec3();

        public constructor(name: string, width: number = 100, height: number = 100) {
            this.name = name;
            this.width = width;
            this.height = height;
        }

        public load(): void {
            this.buffer = new glBuffer(3);

            let positionAttr = new glAttrInfo();
            positionAttr.location = 0;
            positionAttr.offset = 0;
            positionAttr.size = 3;

            this.buffer.addAttrLocation(positionAttr);
            
            let vertices = [
                0, 0, 0,
                0, this.height, 0,
                this.width, this.height, 0,

                this.width, this.height, 0,
                this.width, 0, 0,
                0, 0, 0
            ];

            this.buffer.pushBack(vertices);
            this.buffer.upload();
            this.buffer.unbind();
        }

        public update(tick: number): void {

        }

        public render(): void {
            this.buffer.bind();
            this.buffer.draw();
        }

    }
}