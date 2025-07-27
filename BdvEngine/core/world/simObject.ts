namespace BdvEngine {
    export class SimObject {
        private id: number;
        private children: SimObject[] = [];
        private parent: SimObject;
        private scene: Scene;
        private isLoaded: boolean = false;
        private components: BaseComponent[] = [];

        private localMatrix: m4x4 = m4x4.identity();
        private worldMatrix: m4x4 = m4x4.identity();

        public name: string;

        public transform: transform = new transform();

        public constructor(id: number, name: string, scene?: Scene) {
            this.id = id;
            this.name = name;
            this.scene = scene;
        }

        protected onAdded(scene: Scene): void {
            this.scene = scene;
        }

        private updateWorldMatrix(parentWorldMatrix: m4x4): void {
            if (parentWorldMatrix) {
                this.worldMatrix = m4x4.multiply(parentWorldMatrix, this.localMatrix);
            } else {
                this.worldMatrix.copyFrom(this.localMatrix);
            }
        }

        public get getId(): number {
            return this.id;
        }

        public get getName(): string {
            return this.name;
        }

        public get getLocalMatrix(): m4x4 {
            return this.localMatrix;
        }

        public get getWorldMatrix(): m4x4 {
            return this.worldMatrix;
        }

        public get getParent(): SimObject {
            return this.parent;
        }

        public get getIsLoaded(): boolean {
            return this.isLoaded;
        }

        public addChild(child: SimObject): void {
            child.parent = this;
            this.children.push(child);
            child.onAdded(this.scene);
        }

        public removeChild(child: SimObject): void {
            let index = this.children.indexOf(child);
            if (index !== -1) {
                child.parent = undefined;
                this.children.splice(index, 1);
            }
        }

        public getObjectByName(name: string): SimObject {
            if (this.name === name) {
                return this;
            }

            for (let child of this.children) {
                let result = child.getObjectByName(name);
                if (result) {
                    return result;
                }
            }

            return undefined;
        }

        public addComponent(component: BaseComponent): void {
            this.components.push(component);
            component.setOwner(this);
        }

        public load(): void {
            this.isLoaded = true;

            for (let component of this.components) {
                component.load();
            }

            for (let child of this.children) {
                child.load();
            }
        }

        public update(deltaTime: number): void {
            this.localMatrix = this.transform.getTransformationMatrix();
            this.updateWorldMatrix(this.parent ? this.parent.getWorldMatrix : undefined);

            for (let component of this.components) {
                component.update(deltaTime);
            }

            for (let child of this.children) {
                child.update(deltaTime);
            }
        }

        public render(shader: Shader): void {
            for (let component of this.components) {
                component.render(shader);
            }

            for (let child of this.children) {
                child.render(shader);
            }
        }
    }
}
