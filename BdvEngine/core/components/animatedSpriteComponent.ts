import { SpriteComponentData } from './spriteComponent';
import { IComponentData } from './IComponentData';
import { IComponentBuilder } from './IComponentBuilder';
import { IComponent } from './IComponents';
import { BaseComponent } from './baseComponent';
import { AnimatedSprite } from '../graphics/animatedSprite';
import { Shader } from '../gl/shader';
import { ComponentManager } from './componentManager';

export class AnimatedSpriteComponentData
  extends SpriteComponentData
  implements IComponentData
{
  public frameWidth!: number;
  public frameHeight!: number;
  public frameCount!: number;
  public frameSequence: number[] = [];

  public setFromJson(json: any): void {
    super.setFromJson(json);

    if (json.frameWidth === undefined) {
      throw new Error(
        "AnimatedSpriteComponentData requires 'frameWidth' to be defined.",
      );
    } else {
      this.frameWidth = Number(json.frameWidth);
    }

    if (json.frameHeight === undefined) {
      throw new Error(
        "AnimatedSpriteComponentData requires 'frameHeight' to be defined.",
      );
    } else {
      this.frameHeight = Number(json.frameHeight);
    }

    if (json.frameCount === undefined) {
      throw new Error(
        "AnimatedSpriteComponentData requires 'frameCount' to be defined.",
      );
    } else {
      this.frameCount = Number(json.frameCount);
    }

    if (json.frameSequence === undefined) {
      throw new Error(
        "AnimatedSpriteComponentData requires 'frameSequence' to be defined.",
      );
    } else {
      this.frameSequence = json.frameSequence;
    }
  }
}

export class AnimatedSpriteComponentBuilder implements IComponentBuilder {
  public get type(): string {
    return "animatedSprite";
  }

  public buildFromJson(json: any): IComponent {
    let data = new AnimatedSpriteComponentData();
    data.setFromJson(json);
    return new AnimatedSpriteComponent(data);
  }
}

export class AnimatedSpriteComponent extends BaseComponent {
  public sprite: AnimatedSprite;

  public constructor(data: AnimatedSpriteComponentData) {
    super(data);

    this.sprite = new AnimatedSprite(
      this.name,
      data.materialName,
      data.frameWidth,
      data.frameHeight,
      data.frameWidth,
      data.frameHeight,
      data.frameCount,
      data.frameSequence,
    );
  }

  public load(): void {
    this.sprite.load();
  }

  public update(time: number): void {
    this.sprite.update(time);

    super.update(time);
  }

  public render(shader: Shader): void {
    if (this.sprite.hasCustomShader) {
      this.sprite.render(shader, this.getOwner.getWorldMatrix);
    } else {
      this.sprite.pushToBatch(this.getOwner.getWorldMatrix);
    }
    super.render(shader);
  }
}

ComponentManager.registerBuilder(new AnimatedSpriteComponentBuilder());
