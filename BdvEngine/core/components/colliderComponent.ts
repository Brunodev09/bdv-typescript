import { BaseComponent } from './baseComponent';
import { IComponentData } from './IComponentData';
import { IComponentBuilder } from './IComponentBuilder';
import { IComponent } from './IComponents';
import { ComponentManager } from './componentManager';
import { Shader } from '../gl/shader';
import { Draw } from '../graphics/draw';
import { Color } from '../graphics/color';

export type ColliderShape = 'rect' | 'circle';

export class ColliderComponentData implements IComponentData {
  public name: string = 'collider';
  public shape: ColliderShape = 'rect';
  public width: number = 50;
  public height: number = 50;
  public radius: number = 25;
  public isStatic: boolean = false;
  public color: Color = Color.white();
  public debugDraw: boolean = true;

  public setFromJson(json: any): void {
    if (json.name !== undefined) this.name = String(json.name);
    if (json.shape !== undefined) this.shape = json.shape;
    if (json.width !== undefined) this.width = Number(json.width);
    if (json.height !== undefined) this.height = Number(json.height);
    if (json.radius !== undefined) this.radius = Number(json.radius);
    if (json.isStatic !== undefined) this.isStatic = Boolean(json.isStatic);
  }
}

export class ColliderComponentBuilder implements IComponentBuilder {
  public get type(): string { return "collider"; }

  public buildFromJson(json: any): IComponent {
    let data = new ColliderComponentData();
    data.setFromJson(json);
    return new ColliderComponent(data);
  }
}

/**
 * Defines a collision shape attached to a SimObject.
 * The shape is centered on the object's transform position.
 * Use with RigidBodyBehavior for physics, or query manually.
 */
export class ColliderComponent extends BaseComponent {
  public shape: ColliderShape;
  public width: number;
  public height: number;
  public radius: number;
  public isStatic: boolean;
  public color: Color;
  public debugDraw: boolean;

  constructor(data: ColliderComponentData) {
    super(data);
    this.shape = data.shape;
    this.width = data.width;
    this.height = data.height;
    this.radius = data.radius;
    this.isStatic = data.isStatic;
    this.color = data.color;
    this.debugDraw = data.debugDraw;
  }

  /** Get world-space bounding box (for rect colliders). */
  public getWorldRect(): { x: number; y: number; w: number; h: number } {
    let pos = this.owner!.transform.position;
    return {
      x: pos.vx - this.width / 2,
      y: pos.vy - this.height / 2,
      w: this.width,
      h: this.height,
    };
  }

  /** Get world-space circle (for circle colliders). */
  public getWorldCircle(): { x: number; y: number; r: number } {
    let pos = this.owner!.transform.position;
    return { x: pos.vx, y: pos.vy, r: this.radius };
  }

  public render(shader: Shader): void {
    if (!this.debugDraw) return;
    let pos = this.owner!.transform.position;
    if (this.shape === 'rect') {
      Draw.rect(
        pos.vx - this.width / 2, pos.vy - this.height / 2,
        this.width, this.height, this.color,
      );
    } else {
      Draw.circle(pos.vx, pos.vy, this.radius, this.color);
    }
  }
}

ComponentManager.registerBuilder(new ColliderComponentBuilder());
