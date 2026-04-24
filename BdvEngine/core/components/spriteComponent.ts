import { IComponentData } from './IComponentData';
import { IComponentBuilder } from './IComponentBuilder';
import { IComponent } from './IComponents';
import { BaseComponent } from './baseComponent';
import { Sprite } from '../graphics/sprite';
import { Shader } from '../gl/shader';
import { ComponentManager } from './componentManager';

export class SpriteComponentData implements IComponentData {
  public name!: string;
  public materialName!: string;

  public setFromJson(json: any): void {
    if (json.name !== undefined) {
      this.name = String(json.name);
    }

    if (json.materialName !== undefined) {
      this.materialName = String(json.materialName);
    }
  }
}

export class SpriteComponentBuilder implements IComponentBuilder {
  public get type(): string {
    return "sprite";
  }

  public buildFromJson(json: any): IComponent {
    let data = new SpriteComponentData();
    data.setFromJson(json);
    return new SpriteComponent(data);
  }
}

export class SpriteComponent extends BaseComponent {
  private sprite: Sprite;

  public constructor(data: SpriteComponentData) {
    super(data);

    this.sprite = new Sprite(this.name, data.materialName);
  }

  public load(): void {
    this.sprite.load();
  }

  public render(shader: Shader): void {
    this.sprite.render(shader, this.getOwner.getWorldMatrix);
    super.render(shader);
  }
}
ComponentManager.registerBuilder(new SpriteComponentBuilder());
