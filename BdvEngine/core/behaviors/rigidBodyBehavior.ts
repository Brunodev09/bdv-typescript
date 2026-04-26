import { BaseBehavior } from './baseBehavior';
import { IBehaviorData } from './IBehaviorData';
import { IBehaviorBuilder } from './IBehaviorBuilder';
import { IBehavior } from './IBehavior';
import { BehaviorManager } from './behaviorManager';
import { ColliderComponent } from '../components/colliderComponent';
import { Collision } from '../utils/collision';
import { SimObject } from '../world/simObject';

export class RigidBodyBehaviorData implements IBehaviorData {
  public name: string = 'rigidBody';
  public vx: number = 0;
  public vy: number = 0;
  public gravity: number = 0;
  public bounceDamping: number = 0.7;
  public friction: number = 0.99;
  /** If true, position is controlled externally (e.g. by player input).
   *  Velocity is NOT applied to position, only used for collision response. */
  public kinematic: boolean = false;

  public setFromJson(json: any): void {
    if (json.name !== undefined) this.name = String(json.name);
    if (json.vx !== undefined) this.vx = Number(json.vx);
    if (json.vy !== undefined) this.vy = Number(json.vy);
    if (json.gravity !== undefined) this.gravity = Number(json.gravity);
    if (json.bounceDamping !== undefined) this.bounceDamping = Number(json.bounceDamping);
    if (json.friction !== undefined) this.friction = Number(json.friction);
    if (json.kinematic !== undefined) this.kinematic = Boolean(json.kinematic);
  }
}

export class RigidBodyBehaviorBuilder implements IBehaviorBuilder {
  public get type(): string { return "rigidBody"; }

  public buildFromJson(json: any): IBehavior {
    let data = new RigidBodyBehaviorData();
    data.setFromJson(json);
    return new RigidBodyBehavior(data);
  }
}

/**
 * Physics behavior: applies velocity, gravity, and resolves collisions
 * against all other SimObjects that have a ColliderComponent.
 *
 * Requires a ColliderComponent on the same SimObject.
 * Finds other colliders by traversing the scene.
 */
export class RigidBodyBehavior extends BaseBehavior {
  public vx: number;
  public vy: number;
  public gravity: number;
  public bounceDamping: number;
  public friction: number;
  public kinematic: boolean;

  public collider: ColliderComponent | null = null;

  /** All registered rigid bodies — used by RayCastBehavior and collision resolution. */
  public static allBodies: RigidBodyBehavior[] = [];

  /** Pairs already resolved this frame — prevents double resolution. */
  private static resolvedPairs: Set<string> = new Set();

  /** Call at start of each physics frame to reset pair tracking. */
  public static beginFrame(): void {
    RigidBodyBehavior.resolvedPairs.clear();
  }

  constructor(data: RigidBodyBehaviorData) {
    super(data);
    this.vx = data.vx;
    this.vy = data.vy;
    this.gravity = data.gravity;
    this.bounceDamping = data.bounceDamping;
    this.friction = data.friction;
    this.kinematic = data.kinematic;
  }

  public setOwner(owner: SimObject): void {
    super.setOwner(owner);
    RigidBodyBehavior.allBodies.push(this);
  }

  /** Clear the global registry (call when resetting scenes). */
  public static clearAll(): void {
    RigidBodyBehavior.allBodies = [];
  }

  public update(time: number): void {
    if (!this._owner) return;

    // Resolve collider once
    if (!this.collider) {
      let comp = this._owner.getComponent("collider");
      if (comp instanceof ColliderComponent) {
        this.collider = comp;
      }
      if (!this.collider) return;
    }

    // Static objects don't move
    if (this.collider.isStatic) return;

    let pos = this._owner.transform.position;

    if (!this.kinematic) {
      // Apply gravity and velocity for dynamic (non-kinematic) bodies
      this.vy += this.gravity * time;
      pos.vx += this.vx * time;
      pos.vy += this.vy * time;
    }

    // Resolve all collisions — skip pairs already resolved this frame
    let myIdx = RigidBodyBehavior.allBodies.indexOf(this);
    for (let i = 0; i < RigidBodyBehavior.allBodies.length; i++) {
      let other = RigidBodyBehavior.allBodies[i];
      if (other === this || !other.collider) continue;

      // For dynamic-dynamic pairs, only resolve once (lower index handles it)
      if (!other.collider.isStatic && !other.kinematic) {
        let lo = Math.min(myIdx, i);
        let hi = Math.max(myIdx, i);
        let pairKey = `${lo}:${hi}`;
        if (RigidBodyBehavior.resolvedPairs.has(pairKey)) continue;
        RigidBodyBehavior.resolvedPairs.add(pairKey);
      }

      this.resolveCollision(other);
    }

    // Hard clamp: check if body is inside any static collider AFTER all resolution
    for (let other of RigidBodyBehavior.allBodies) {
      if (other === this || !other.collider) continue;
      if (!other.collider.isStatic) continue;

      if (this.collider!.shape === 'rect' && other.collider.shape === 'rect') {
        let a = this.collider!.getWorldRect();
        let b = other.collider.getWorldRect();
        let ov = Collision.rectOverlap(a.x, a.y, a.w, a.h, b.x, b.y, b.w, b.h);
        if (ov) {
          pos.vx += ov.x;
          pos.vy += ov.y;
          if (ov.x !== 0) this.vx = 0;
          if (ov.y !== 0) this.vy = 0;
        }
      }
    }
  }

  /** Check if moving a collider to a new center position would overlap any static body. */
  private wouldOverlapStatic(newX: number, newY: number, col: ColliderComponent): boolean {
    for (let body of RigidBodyBehavior.allBodies) {
      if (!body.collider || !body.collider.isStatic) continue;
      let s = body.collider;

      if (col.shape === 'rect' && s.shape === 'rect') {
        let sr = s.getWorldRect();
        if (Collision.rectRect(
          newX - col.width / 2, newY - col.height / 2, col.width, col.height,
          sr.x, sr.y, sr.w, sr.h)) return true;
      } else if (col.shape === 'circle' && s.shape === 'rect') {
        let sr = s.getWorldRect();
        if (Collision.circleRect(newX, newY, col.radius, sr.x, sr.y, sr.w, sr.h)) return true;
      }
    }
    return false;
  }

  private resolveCollision(other: RigidBodyBehavior): void {
    let myCol = this.collider!;
    let otherCol = other.collider!;
    let myPos = this._owner.transform.position;
    let otherPos = other._owner.transform.position;
    let isStatic = otherCol.isStatic || other.kinematic;

    // Rect vs Rect
    if (myCol.shape === 'rect' && otherCol.shape === 'rect') {
      let a = myCol.getWorldRect();
      let b = otherCol.getWorldRect();
      let overlap = Collision.rectOverlap(a.x, a.y, a.w, a.h, b.x, b.y, b.w, b.h);
      if (overlap) {
        if (isStatic) {
          myPos.vx += overlap.x;
          myPos.vy += overlap.y;
          // Only reverse velocity if moving INTO the wall
          if (overlap.x > 0 && this.vx < 0) this.vx = -this.vx * this.bounceDamping;
          else if (overlap.x < 0 && this.vx > 0) this.vx = -this.vx * this.bounceDamping;
          if (overlap.y > 0 && this.vy < 0) { this.vy = -this.vy * this.bounceDamping; this.vx *= this.friction; }
          else if (overlap.y < 0 && this.vy > 0) { this.vy = -this.vy * this.bounceDamping; this.vx *= this.friction; }
        } else {
          // Separate positions
          myPos.vx += overlap.x / 2;
          myPos.vy += overlap.y / 2;
          otherPos.vx -= overlap.x / 2;
          otherPos.vy -= overlap.y / 2;

          // Elastic velocity swap
          if (Math.abs(overlap.x) > Math.abs(overlap.y)) {
            let t = this.vx; this.vx = other.vx; other.vx = t;
          } else {
            let t = this.vy; this.vy = other.vy; other.vy = t;
          }
        }
      }
    }

    // Circle vs Circle (elastic — no damping between dynamic bodies)
    else if (myCol.shape === 'circle' && otherCol.shape === 'circle') {
      let a = myCol.getWorldCircle();
      let b = otherCol.getWorldCircle();
      if (Collision.circleCircle(a.x, a.y, a.r, b.x, b.y, b.r)) {
        let dx = b.x - a.x, dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let nx = dx / dist, ny = dy / dist;
        let pen = (a.r + b.r) - dist;

        if (isStatic) {
          myPos.vx -= nx * pen;
          myPos.vy -= ny * pen;
          let dot = this.vx * nx + this.vy * ny;
          this.vx -= 2 * dot * nx * this.bounceDamping;
          this.vy -= 2 * dot * ny * this.bounceDamping;
        } else {
          myPos.vx -= nx * pen / 2;
          myPos.vy -= ny * pen / 2;
          otherPos.vx += nx * pen / 2;
          otherPos.vy += ny * pen / 2;
          // Elastic velocity exchange along collision normal
          let aVn = this.vx * nx + this.vy * ny;
          let bVn = other.vx * nx + other.vy * ny;
          this.vx += (bVn - aVn) * nx;
          this.vy += (bVn - aVn) * ny;
          other.vx += (aVn - bVn) * nx;
          other.vy += (aVn - bVn) * ny;
        }
      }
    }

    // Circle vs Rect
    else if (myCol.shape === 'circle' && otherCol.shape === 'rect') {
      let c = myCol.getWorldCircle();
      let r = otherCol.getWorldRect();
      if (Collision.circleRect(c.x, c.y, c.r, r.x, r.y, r.w, r.h)) {
        let nearestX = Math.max(r.x, Math.min(c.x, r.x + r.w));
        let nearestY = Math.max(r.y, Math.min(c.y, r.y + r.h));
        let dx = c.x - nearestX, dy = c.y - nearestY;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let nx = dx / dist, ny = dy / dist;
        let pen = c.r - dist;
        myPos.vx += nx * pen;
        myPos.vy += ny * pen;
        let dot = this.vx * nx + this.vy * ny;
        let damp = isStatic ? this.bounceDamping : 1.0;
        this.vx -= 2 * dot * nx * damp;
        this.vy -= 2 * dot * ny * damp;
      }
    }

    // Rect vs Circle
    else if (myCol.shape === 'rect' && otherCol.shape === 'circle') {
      let r = myCol.getWorldRect();
      let c = otherCol.getWorldCircle();
      if (Collision.circleRect(c.x, c.y, c.r, r.x, r.y, r.w, r.h)) {
        let nearestX = Math.max(r.x, Math.min(c.x, r.x + r.w));
        let nearestY = Math.max(r.y, Math.min(c.y, r.y + r.h));
        let dx = myPos.vx - c.x, dy = myPos.vy - c.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let nx = dx / dist, ny = dy / dist;
        let overlap = Collision.rectOverlap(r.x, r.y, r.w, r.h,
          c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
        if (overlap) {
          myPos.vx += overlap.x;
          myPos.vy += overlap.y;
          if (isStatic) {
            if (overlap.x !== 0) this.vx = -this.vx * this.bounceDamping;
            if (overlap.y !== 0) this.vy = -this.vy * this.bounceDamping;
          } else {
            if (overlap.x !== 0) { let t = this.vx; this.vx = other.vx; other.vx = t; }
            if (overlap.y !== 0) { let t = this.vy; this.vy = other.vy; other.vy = t; }
          }
        }
      }
    }
  }
}

BehaviorManager.registerBuilder(new RigidBodyBehaviorBuilder());
