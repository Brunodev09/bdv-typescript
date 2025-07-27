namespace BdvEngine {
    export enum ZoneState {
        UNINITIALIZED,
        LOADING,
        UPDATING,
    }

    export class Zone {
        private id: number;
        private name: string;
        private description: string;
        private scene: Scene;
        private state: ZoneState = ZoneState.UNINITIALIZED;

        public constructor(id: number, name: string, description: string) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.scene = new Scene();
        }

        public get getId(): number {
            return this.id;
        }

        public get getName(): string {
            return this.name;
        }

        public get getDescription(): string {
            return this.description;
        }

        public get getScene(): Scene {
            return this.scene;
        }

        public load(): void {
            this.state = ZoneState.LOADING;

            this.scene.load();

            this.state = ZoneState.UPDATING;
        }

        public unload(): void {
            this.state = ZoneState.UNINITIALIZED;

            //this.scene.unload();
        }

        public update(deltaTime: number): void {
            if (this.state === ZoneState.UPDATING) {
                this.scene.update(deltaTime);
            }
        }

        public render(shader: Shader): void {
            if (this.state === ZoneState.UPDATING) {
                this.scene.render(shader);
            }
        }

        public onActivate(): void {}

        public onDeactivate(): void {}
    }
}
