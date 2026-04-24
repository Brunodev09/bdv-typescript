import {
  Game,
  Shader,
  UI,
  Material,
  MaterialManager,
  Color,
  SimObject,
  Scene,
  vec3,
} from '../BdvEngine';

import { Mesh } from '../BdvEngine/core/3d/mesh';
import { MeshComponent } from '../BdvEngine/core/3d/meshComponent';
import { Engine3D } from '../BdvEngine/core/engine3d';

export class My3DGame extends Game {
  private scene!: Scene;
  private engine3d!: Engine3D;

  /** Set by app3d.ts after construction. */
  public setEngine(engine: Engine3D): void {
    this.engine3d = engine;
  }

  init(): void {
    // Materials
    MaterialManager.register(
      new Material("crate", "assets/textures/block.png", Color.white()),
    );
    MaterialManager.register(
      new Material("white", "assets/textures/block.png", new Color(200, 200, 220, 255)),
    );

    // Scene
    this.scene = new Scene();

    // Textured cube
    let cube = new SimObject(1, "cube");
    cube.transform.position.vx = 0;
    cube.transform.position.vy = 0.5;
    cube.transform.position.vz = 0;
    cube.addComponent(new MeshComponent(Mesh.cube(), "crate"));
    this.scene.addObject(cube);

    // Child cube — orbits the parent cube
    let child = new SimObject(2, "child");
    child.transform.position.vx = 2; // offset from parent
    child.transform.position.vy = 0;
    child.transform.scale = new vec3(0.4, 0.4, 0.4);
    child.addComponent(new MeshComponent(Mesh.cube(), "crate"));
    cube.addChild(child); // parented to the main cube

    // Grandchild sphere — orbits the child cube
    let grandchild = new SimObject(5, "grandchild");
    grandchild.transform.position.vx = 1.5;
    grandchild.transform.scale = new vec3(0.5, 0.5, 0.5);
    grandchild.addComponent(new MeshComponent(Mesh.sphere(12, 8), "white"));
    child.addChild(grandchild);

    // Sphere
    let sphere = new SimObject(3, "sphere");
    sphere.transform.position.vx = -2;
    sphere.transform.position.vy = 0.5;
    sphere.transform.position.vz = 0;
    sphere.addComponent(new MeshComponent(Mesh.sphere(24, 16), "white"));
    this.scene.addObject(sphere);

    // Ground plane
    let ground = new SimObject(4, "ground");
    ground.transform.scale = new vec3(10, 1, 10);
    ground.addComponent(new MeshComponent(Mesh.plane(1), "white"));
    this.scene.addObject(ground);

    this.scene.load();

    // UI
    let panel = UI.panel(10, 40, {
      width: "200px",
      padding: "10px",
      background: "rgba(0,0,0,0.7)",
      borderRadius: "6px",
    });

    UI.heading(panel, "BdvEngine 3D", { color: "#4af" });
    UI.text(panel, "Parent → child → grandchild");
    UI.text(panel, "hierarchy with Phong lighting");
  }

  private elapsed: number = 0;

  update(deltaTime: number): void {
    this.elapsed += deltaTime / 1000;
    this.scene.update(deltaTime);

    // Parent cube rotates — child and grandchild orbit with it
    let cube = this.scene.getObjectByName("cube");
    if (cube) cube.transform.rotation.vy = this.elapsed * 0.8;

    // Child spins on its own axis too
    let child = this.scene.getObjectByName("child");
    if (child) child.transform.rotation.vy = this.elapsed * 3;

    // Grandchild gets both parent + grandparent rotation for free
    let grandchild = this.scene.getObjectByName("grandchild");
    if (grandchild) grandchild.transform.rotation.vx = this.elapsed * 2;

    // Orbit camera
    if (this.engine3d) {
      let camDist = 6;
      let camHeight = 3;
      let angle = this.elapsed * 0.3;
      this.engine3d.camera.position = new vec3(
        Math.cos(angle) * camDist,
        camHeight,
        Math.sin(angle) * camDist,
      );
      this.engine3d.camera.target = new vec3(0, 0.5, 0);
    }
  }

  render(shader: Shader): void {
    this.scene.render(shader);
  }
}
