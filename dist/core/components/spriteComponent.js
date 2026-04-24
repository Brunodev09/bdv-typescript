import { BaseComponent } from './baseComponent';
import { Sprite } from '../graphics/sprite';
import { ComponentManager } from './componentManager';
export class SpriteComponentData {
    setFromJson(json) {
        if (json.name !== undefined) {
            this.name = String(json.name);
        }
        if (json.materialName !== undefined) {
            this.materialName = String(json.materialName);
        }
    }
}
export class SpriteComponentBuilder {
    get type() {
        return "sprite";
    }
    buildFromJson(json) {
        let data = new SpriteComponentData();
        data.setFromJson(json);
        return new SpriteComponent(data);
    }
}
export class SpriteComponent extends BaseComponent {
    constructor(data) {
        super(data);
        this.sprite = new Sprite(this.name, data.materialName);
    }
    load() {
        this.sprite.load();
    }
    render(shader) {
        this.sprite.render(shader, this.getOwner.getWorldMatrix);
        super.render(shader);
    }
}
ComponentManager.registerBuilder(new SpriteComponentBuilder());
//# sourceMappingURL=spriteComponent.js.map