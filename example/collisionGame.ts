import {
  Game,
  Shader,
  Draw,
  Color,
  UI,
  InputManager,
  Keys,
  Collision,
  SimObject,
  Scene,
  ColliderComponent,
  ColliderComponentData,
  RigidBodyBehavior,
  RigidBodyBehaviorData,
  RayCastBehavior,
  RayCastBehaviorData,
  BaseBehavior,
  IBehaviorData,
} from '../BdvEngine';

/** Player control behavior — WASD movement. */
class PlayerControlData implements IBehaviorData {
  public name: string = "playerControl";
  public speed: number = 0.3;
  public setFromJson(): void {}
}

class PlayerControlBehavior extends BaseBehavior {
  private speed: number;

  constructor(data: PlayerControlData) {
    super(data);
    this.speed = data.speed;
  }

  update(time: number): void {
    if (!this._owner) return;
    let rb = this._owner.getBehavior("rigidBody") as RigidBodyBehavior | null;
    if (!rb) return;

    // Direct position control (rigid body handles collisions)
    let move = this.speed * time;
    if (InputManager.isKeyDown(Keys.W)) this._owner.transform.position.vy -= move;
    if (InputManager.isKeyDown(Keys.S)) this._owner.transform.position.vy += move;
    if (InputManager.isKeyDown(Keys.A)) this._owner.transform.position.vx -= move;
    if (InputManager.isKeyDown(Keys.D)) this._owner.transform.position.vx += move;
  }
}

// Helper to create a SimObject with collider + rigid body
function createPhysicsObject(
  id: number, name: string,
  x: number, y: number,
  shape: 'rect' | 'circle',
  size: { w?: number; h?: number; r?: number },
  color: Color,
  options?: { vx?: number; vy?: number; gravity?: number; isStatic?: boolean; bounce?: number; kinematic?: boolean },
): SimObject {
  let obj = new SimObject(id, name);
  obj.transform.position.vx = x;
  obj.transform.position.vy = y;

  let colData = new ColliderComponentData();
  colData.name = "collider";
  colData.shape = shape;
  colData.width = size.w || 50;
  colData.height = size.h || 50;
  colData.radius = size.r || 25;
  colData.isStatic = options?.isStatic || false;
  colData.color = color;
  obj.addComponent(new ColliderComponent(colData));

  let rbData = new RigidBodyBehaviorData();
  rbData.name = "rigidBody";
  rbData.vx = options?.vx || 0;
  rbData.vy = options?.vy || 0;
  rbData.gravity = options?.gravity || 0;
  rbData.bounceDamping = options?.bounce || 0.7;
  rbData.kinematic = options?.kinematic || false;
  obj.addBehavior(new RigidBodyBehavior(rbData));

  return obj;
}

export class CollisionGame extends Game {
  private scene!: Scene;
  private player!: SimObject;
  private infoText!: HTMLDivElement;

  init(): void {
    RigidBodyBehavior.clearAll();
    this.scene = new Scene();
    let id = 0;

    // Walls (static rects)
    let wallColor = new Color(100, 100, 100, 255);
    let walls = [
      { x: 400, y: 60, w: 700, h: 20 },   // top
      { x: 400, y: 540, w: 700, h: 20 },   // bottom
      { x: 60, y: 300, w: 20, h: 500 },    // left
      { x: 740, y: 300, w: 20, h: 500 },   // right
      { x: 400, y: 360, w: 200, h: 20 },   // platform
      { x: 210, y: 260, w: 120, h: 20 },   // shelf
      { x: 600, y: 210, w: 100, h: 20 },   // shelf
    ];
    for (let w of walls) {
      let wall = createPhysicsObject(id++, `wall_${id}`, w.x, w.y, 'rect',
        { w: w.w, h: w.h }, wallColor, { isStatic: true });
      this.scene.addObject(wall);
    }

    // Player (kinematic — moved by input, not velocity)
    this.player = createPhysicsObject(id++, "player", 400, 300, 'rect',
      { w: 50, h: 50 }, Color.white(), { kinematic: true });
    let ctrlData = new PlayerControlData();
    this.player.addBehavior(new PlayerControlBehavior(ctrlData));

    let rayData = new RayCastBehaviorData();
    rayData.name = "rayCast";
    this.player.addBehavior(new RayCastBehavior(rayData));

    this.scene.addObject(this.player);

    // Bouncing boxes
    let boxConfigs = [
      { x: 200, y: 150, vx: 0.08, vy: 0.05, color: new Color(200, 150, 50, 255) },
      { x: 500, y: 400, vx: -0.06, vy: 0.07, color: new Color(50, 200, 150, 255) },
      { x: 600, y: 100, vx: 0.04, vy: -0.08, color: new Color(150, 50, 200, 255) },
    ];
    for (let bc of boxConfigs) {
      let box = createPhysicsObject(id++, `box_${id}`, bc.x, bc.y, 'rect',
        { w: 40, h: 40 }, bc.color, { vx: bc.vx, vy: bc.vy });
      this.scene.addObject(box);
    }

    // Bouncing balls
    let ballConfigs = [
      { x: 300, y: 200, r: 20, vx: 0.1, vy: 0.06, color: new Color(255, 80, 80, 255) },
      { x: 500, y: 300, r: 15, vx: -0.07, vy: 0.09, color: new Color(80, 255, 80, 255) },
      { x: 150, y: 450, r: 25, vx: 0.05, vy: -0.05, color: new Color(80, 80, 255, 255) },
      { x: 650, y: 150, r: 12, vx: -0.09, vy: -0.06, color: new Color(255, 255, 80, 255) },
    ];
    for (let bc of ballConfigs) {
      let ball = createPhysicsObject(id++, `ball_${id}`, bc.x, bc.y, 'circle',
        { r: bc.r }, bc.color, { vx: bc.vx, vy: bc.vy });
      this.scene.addObject(ball);
    }

    this.scene.load();

    // Center camera on the play area
    this.camera.x = 400;
    this.camera.y = 300;
    this.camera.zoom = 1;

    // UI
    let panel = UI.panel(10, 560, {
      padding: "8px",
      background: "rgba(0,0,0,0.7)",
      borderRadius: "4px",
    });
    UI.text(panel, "WASD to move | All physics through engine behaviors", {
      fontSize: "13px",
    });
    this.infoText = UI.text(panel, "", { fontSize: "12px", fontFamily: "monospace" });
  }

  update(deltaTime: number): void {
    // Set ray target to mouse world position
    let mouse = InputManager.getMousePosition();
    let sw = window.innerWidth, sh = window.innerHeight;
    let worldMouse = this.camera.screenToWorld(mouse.vx, mouse.vy, sw, sh);
    let ray = this.player.getBehavior("rayCast") as RayCastBehavior | null;
    if (ray) {
      ray.targetX = worldMouse.x;
      ray.targetY = worldMouse.y;
    }

    this.scene.update(deltaTime);

    let pos = this.player.transform.position;
    let hitInfo = ray?.hasHit ? " | Ray: HIT" : " | Ray: miss";
    UI.setText(this.infoText, `Player: ${Math.round(pos.vx)}, ${Math.round(pos.vy)}${hitInfo}`);
  }

  render(shader: Shader): void {
    // Scene renders all collider shapes + ray (via behaviors)
    this.scene.render(shader);
  }
}
