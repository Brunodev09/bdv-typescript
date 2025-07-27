namespace BdvEngine {
    export abstract class BaseComponent {
        protected owner: SimObject;
        public name: string;

        public constructor(name: string) {
            this.name = name;
        }

        public setOwner(owner: SimObject): void {
            this.owner = owner;
        }

        public get getOwner(): SimObject {
            return this.owner;
        }

        public load(): void {}

        public unload(): void {}

        public update(deltaTime: number): void {}

        public render(shader: Shader): void {}
    }
}
