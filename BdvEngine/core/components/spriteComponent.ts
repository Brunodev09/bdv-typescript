namespace BdvEngine {
    export class SpriteComponent extends BaseComponent {
        private sprite: Sprite;

        public constructor(name: string, materialName: string) {
            super(name);

            this.sprite = new Sprite(name, materialName);
        }

        public load(): void {
            this.sprite.load();
        }

        public render(shader: Shader): void {
            this.sprite.render(shader, this.getOwner.getWorldMatrix);
            super.render(shader);
        }
    }
}
