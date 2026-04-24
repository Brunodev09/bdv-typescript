import { SpriteComponentData } from './spriteComponent';
import { BaseComponent } from './baseComponent';
import { AnimatedSprite } from '../graphics/animatedSprite';
import { ComponentManager } from './componentManager';
export class AnimatedSpriteComponentData extends SpriteComponentData {
    constructor() {
        super(...arguments);
        this.frameSequence = [];
    }
    setFromJson(json) {
        super.setFromJson(json);
        if (json.frameWidth === undefined) {
            throw new Error("AnimatedSpriteComponentData requires 'frameWidth' to be defined.");
        }
        else {
            this.frameWidth = Number(json.frameWidth);
        }
        if (json.frameHeight === undefined) {
            throw new Error("AnimatedSpriteComponentData requires 'frameHeight' to be defined.");
        }
        else {
            this.frameHeight = Number(json.frameHeight);
        }
        if (json.frameCount === undefined) {
            throw new Error("AnimatedSpriteComponentData requires 'frameCount' to be defined.");
        }
        else {
            this.frameCount = Number(json.frameCount);
        }
        if (json.frameSequence === undefined) {
            throw new Error("AnimatedSpriteComponentData requires 'frameSequence' to be defined.");
        }
        else {
            this.frameSequence = json.frameSequence;
        }
    }
}
export class AnimatedSpriteComponentBuilder {
    get type() {
        return "animatedSprite";
    }
    buildFromJson(json) {
        let data = new AnimatedSpriteComponentData();
        data.setFromJson(json);
        return new AnimatedSpriteComponent(data);
    }
}
export class AnimatedSpriteComponent extends BaseComponent {
    constructor(data) {
        super(data);
        this.sprite = new AnimatedSprite(this.name, data.materialName, data.frameWidth, data.frameHeight, data.frameWidth, data.frameHeight, data.frameCount, data.frameSequence);
    }
    load() {
        this.sprite.load();
    }
    update(time) {
        this.sprite.update(time);
        super.update(time);
    }
    render(shader) {
        this.sprite.render(shader, this.getOwner.getWorldMatrix);
        super.render(shader);
    }
}
ComponentManager.registerBuilder(new AnimatedSpriteComponentBuilder());
//# sourceMappingURL=animatedSpriteComponent.js.map