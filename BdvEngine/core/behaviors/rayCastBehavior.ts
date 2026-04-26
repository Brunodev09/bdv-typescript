import { BaseBehavior } from './baseBehavior';
import { IBehaviorData } from './IBehaviorData';
import { IBehaviorBuilder } from './IBehaviorBuilder';
import { IBehavior } from './IBehavior';
import { BehaviorManager } from './behaviorManager';
import { Collision } from '../utils/collision';
import { ColliderComponent } from '../components/colliderComponent';
import { RigidBodyBehavior } from './rigidBodyBehavior';
import { InputManager } from '../input/inputManager';
import { Draw } from '../graphics/draw';
import { Color } from '../graphics/color';

export class RayCastBehaviorData implements IBehaviorData {
  public name: string = 'rayCast';
  public color: Color = new Color(255, 255, 0, 150);
  public hitColor: Color = new Color(255, 0, 0, 255);
  public hitRadius: number = 5;
  public useMouseTarget: boolean = true;
  /** If set, use camera to convert mouse screen coords to world coords. */
  public setFromJson(json: any): void {
    if (json.name !== undefined) this.name = String(json.name);
  }
}

export class RayCastBehaviorBuilder implements IBehaviorBuilder {
  public get type(): string { return "rayCast"; }
  public buildFromJson(json: any): IBehavior {
    let data = new RayCastBehaviorData();
    data.setFromJson(json);
    return new RayCastBehavior(data);
  }
}

/**
 * Casts a ray from the owner's position toward the mouse (in world space).
 * Detects the closest collider hit and draws the ray + hit point.
 */
export class RayCastBehavior extends BaseBehavior {
  public hitX: number = 0;
  public hitY: number = 0;
  public hasHit: boolean = false;
  public targetX: number = 0;
  public targetY: number = 0;

  private rayColor: Color;
  private hitColor: Color;
  private hitRadius: number;

  constructor(data: RayCastBehaviorData) {
    super(data);
    this.rayColor = data.color;
    this.hitColor = data.hitColor;
    this.hitRadius = data.hitRadius;
  }

  update(time: number): void {
    if (!this._owner) return;

    let pos = this._owner.transform.position;

    // Get mouse in world space via camera on the game
    let mouse = InputManager.getMousePosition();
    // We need the camera — access it through the game's camera property
    // For now, store target from external call
    let dx = this.targetX - pos.vx;
    let dy = this.targetY - pos.vy;
    let len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;
    dx /= len;
    dy /= len;

    // Cast against all colliders
    this.hasHit = false;
    let closestT = Infinity;

    for (let body of RigidBodyBehavior.allBodies) {
      if (body === this._owner.getBehavior("rigidBody")) continue; // skip self
      if (!body.collider) continue;

      let col = body.collider;
      let t = -1;

      if (col.shape === 'rect') {
        let r = col.getWorldRect();
        t = Collision.rayRect(pos.vx, pos.vy, dx, dy, r.x, r.y, r.w, r.h);
      } else {
        // Ray vs circle: solve quadratic
        let c = col.getWorldCircle();
        let ox = pos.vx - c.x, oy = pos.vy - c.y;
        let a = dx * dx + dy * dy;
        let b2 = ox * dx + oy * dy;
        let cc = ox * ox + oy * oy - c.r * c.r;
        let disc = b2 * b2 - a * cc;
        if (disc >= 0) {
          t = (-b2 - Math.sqrt(disc)) / a;
          if (t < 0) t = (-b2 + Math.sqrt(disc)) / a;
        }
      }

      if (t >= 0 && t < closestT) {
        closestT = t;
        this.hitX = pos.vx + dx * t;
        this.hitY = pos.vy + dy * t;
        this.hasHit = true;
      }
    }

    // Draw ray
    if (this.hasHit) {
      Draw.line(pos.vx, pos.vy, this.hitX, this.hitY, this.rayColor);
      Draw.circle(this.hitX, this.hitY, this.hitRadius, this.hitColor);
    } else {
      Draw.line(pos.vx, pos.vy, this.targetX, this.targetY, new Color(this.rayColor.r, this.rayColor.g, this.rayColor.b, 50));
    }
  }
}

BehaviorManager.registerBuilder(new RayCastBehaviorBuilder());
