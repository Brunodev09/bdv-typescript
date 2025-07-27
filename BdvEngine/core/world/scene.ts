namespace BdvEngine {
    export class Scene {
        private root: SimObject;

        public constructor() {
            this.root = new SimObject(0, '__root__', this);
        }

        public get getRoot(): SimObject {
            return this.root;
        }

        public get isLoaded(): boolean {
            return this.root.getIsLoaded;
        }

        public addObject(object: SimObject): void {
            this.root.addChild(object);
        }

        public removeObject(object: SimObject): void {
            this.root.removeChild(object);
        }

        public getObjectByName(name: string): SimObject {
            return this.root.getObjectByName(name);
        }

        public load(): void {
            this.root.load();
        }

        public update(deltaTime: number): void {
            this.root.update(deltaTime);
        }

        public render(shader: Shader): void {
            this.root.render(shader);
        }
    }
}
