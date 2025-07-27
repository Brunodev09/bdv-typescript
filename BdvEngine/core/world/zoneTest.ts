namespace BdvEngine {
    export class ZoneTest extends Zone {
        private parentObject: SimObject;
        private parentSprite: SpriteComponent;

        private testObject: SimObject;
        private testSprite: SpriteComponent;

        public load(): void {
            this.parentObject = new SimObject(0, 'parentObject');
            this.parentObject.transform.position.vx = 300;
            this.parentObject.transform.position.vy = 300;

            this.parentSprite = new SpriteComponent('parentSprite', 'block_mat');
            this.parentObject.addComponent(this.parentSprite);

            this.testObject = new SimObject(1, 'testObject');
            this.testSprite = new SpriteComponent('testSprite', 'block_mat');
            this.testObject.addComponent(this.testSprite);

            this.testObject.transform.position.vx = 120;
            this.testObject.transform.position.vy = 120;

            this.parentObject.addChild(this.testObject);

            this.getScene.addObject(this.parentObject);

            this.testObject.load();

            super.load();
        }

        public update(deltaTime: number): void {
            this.parentObject.transform.rotation.vz += 0.01;
            this.testObject.transform.rotation.vz += 0.01;

            super.update(deltaTime);
        }
    }
}
