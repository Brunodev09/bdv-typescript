import {
  Game,
  Shader,
  Draw,
  UI,
  Material,
  MaterialManager,
  Color,
  SimObject,
  Scene,
  SpriteComponent,
  SpriteComponentData,
  AnimatedSpriteComponent,
  AnimatedSpriteComponentData,
  KeyboardMovementBehavior,
  KeyboardMovementBehaviorData,
  ParticleEmitter,
} from '../BdvEngine';

/**
 * Custom shader: pulsing tint + vignette.
 * Only needs to define the GLSL — the engine handles projection,
 * transform, texture binding, and custom uniforms automatically.
 */
class TintPulseShader extends Shader {
  constructor() {
    super("tint_pulse");
    this.load(
      `
      attribute vec3 a_pos;
      attribute vec2 a_textCoord;

      uniform mat4 u_proj;
      uniform mat4 u_transf;

      varying vec2 v_textCoord;

      void main() {
          gl_Position = u_proj * u_transf * vec4(a_pos, 1.0);
          v_textCoord = a_textCoord;
      }`,
      `
      precision mediump float;

      uniform sampler2D u_diffuse;
      uniform vec4 u_color;
      uniform float u_time;

      varying vec2 v_textCoord;

      void main() {
          vec4 texColor = texture2D(u_diffuse, v_textCoord);
          float pulse = (sin(u_time * 3.0) + 1.0) * 0.5;
          vec3 tinted = mix(texColor.rgb, u_color.rgb, pulse * 0.6);
          float dist = distance(v_textCoord, vec2(0.5, 0.5));
          float vignette = smoothstep(0.7, 0.2, dist);
          gl_FragColor = vec4(tinted * vignette, texColor.a * u_color.a);
      }`,
    );
  }
}

export class MyGame extends Game {
  private scene!: Scene;
  private drawShapes: boolean = true;
  private moveBehavior!: KeyboardMovementBehavior;
  private crateMaterial!: Material;
  private elapsedTime: number = 0;

  // Particle emitters
  private fireEmitter!: ParticleEmitter;
  private sparkEmitter!: ParticleEmitter;

  init(): void {
    // Standard material
    MaterialManager.register(
      new Material("duck", "assets/textures/duck.png", Color.white()),
    );

    MaterialManager.register(
      new Material("block", "assets/textures/block.png", Color.white()),
    );

    // Material with custom shader — just pass the shader as the 4th arg.
    // The engine handles projection, transform, texture, u_color, and
    // any custom uniforms you set via material.setUniform().
    this.crateMaterial = new Material(
      "crate",
      "assets/textures/block.png",
      new Color(255, 100, 200, 255), // magenta tint
      new TintPulseShader(),
    );
    MaterialManager.register(this.crateMaterial);

    // --- Scene ---
    this.scene = new Scene();

    // Animated duck
    let duck = new SimObject(1, "duck");
    duck.transform.position.vx = 100;
    duck.transform.position.vy = 100;
    duck.transform.scale.vx = 8;
    duck.transform.scale.vy = 8;

    let spriteData = new AnimatedSpriteComponentData();
    spriteData.name = "duckSprite";
    spriteData.materialName = "duck";
    spriteData.frameWidth = 17;
    spriteData.frameHeight = 12;
    spriteData.frameCount = 3;
    spriteData.frameSequence = [0, 1, 2, 1];
    duck.addComponent(new AnimatedSpriteComponent(spriteData));

    let moveData = new KeyboardMovementBehaviorData();
    moveData.name = "mover";
    moveData.speed = 2.5;
    this.moveBehavior = new KeyboardMovementBehavior(moveData);
    duck.addBehavior(this.moveBehavior);

    // Crate with custom shader — just reference the material name.
    // No GL code needed. The sprite renders with the TintPulseShader automatically.
    let crate = new SimObject(2, "crate");
    crate.transform.position.vx = 500;
    crate.transform.position.vy = 80;
    crate.transform.scale.vx = 8;
    crate.transform.scale.vy = 8;

    let crateData = new AnimatedSpriteComponentData();
    crateData.name = "crateSprite";
    crateData.materialName = "crate";
    crateData.frameWidth = 16;
    crateData.frameHeight = 16;
    crateData.frameCount = 1;
    crateData.frameSequence = [0];
    crate.addComponent(new AnimatedSpriteComponent(crateData));

    // --- Parent/child hierarchy demo ---
    // Parent block orbits on its own, children orbit relative to it
    let parent = new SimObject(10, "parentBlock");
    parent.transform.position.vx = 900;
    parent.transform.position.vy = 300;
    parent.transform.scale.vx = 4;
    parent.transform.scale.vy = 4;

    let parentSprite = new SpriteComponentData();
    parentSprite.name = "parentSprite";
    parentSprite.materialName = "block";
    parent.addComponent(new SpriteComponent(parentSprite));

    // Child — offset from parent, orbits when parent rotates
    let child = new SimObject(11, "childBlock");
    child.transform.position.vx = 40; // 40px offset from parent center
    child.transform.scale.vx = 0.5;
    child.transform.scale.vy = 0.5;

    let childSprite = new SpriteComponentData();
    childSprite.name = "childSprite";
    childSprite.materialName = "duck";
    child.addComponent(new SpriteComponent(childSprite));

    // Grandchild — orbits the child
    let grandchild = new SimObject(12, "grandchildBlock");
    grandchild.transform.position.vx = 30;
    grandchild.transform.scale.vx = 0.5;
    grandchild.transform.scale.vy = 0.5;

    let gcSprite = new SpriteComponentData();
    gcSprite.name = "gcSprite";
    gcSprite.materialName = "block";
    grandchild.addComponent(new SpriteComponent(gcSprite));

    child.addChild(grandchild);
    parent.addChild(child);

    this.scene.addObject(duck);
    this.scene.addObject(crate);
    this.scene.addObject(parent);
    this.scene.load();

    // --- UI ---
    let panel = UI.panel(10, 40, {
      width: "220px",
      padding: "10px",
      background: "rgba(0,0,0,0.7)",
      borderRadius: "6px",
    });

    UI.heading(panel, "BdvEngine", { color: "#4af" });
    UI.text(panel, "Arrow keys to move the duck");
    UI.spacer(panel);

    let scoreText = UI.text(panel, "Score: 0", { fontSize: "16px" });
    let score = 0;
    UI.button(panel, "+10 Score", () => {
      score += 10;
      UI.setText(scoreText, `Score: ${score}`);
    });

    UI.spacer(panel);
    UI.slider(panel, "Speed", 1, 20, 3, (val) => {
      this.moveBehavior.speed = val;
    });

    UI.checkbox(panel, "Show shapes", true, (val) => {
      this.drawShapes = val;
    });

    // --- Particles ---
    this.fireEmitter = new ParticleEmitter(400, 500, {
      spawnRate: 80,
      maxParticles: 300,
      lifetimeMin: 400,
      lifetimeMax: 1200,
      speedMin: 0.04,
      speedMax: 0.12,
      direction: -Math.PI / 2, // upward
      spread: Math.PI / 4,
      sizeMin: 3,
      sizeMax: 8,
      colorStart: new Color(255, 220, 50, 255),
      colorEnd: new Color(255, 30, 0, 255),
      alphaStart: 255,
      alphaEnd: 0,
      shape: 'circle',
    });

    this.sparkEmitter = new ParticleEmitter(700, 500, {
      spawnRate: 30,
      maxParticles: 100,
      lifetimeMin: 300,
      lifetimeMax: 800,
      speedMin: 0.1,
      speedMax: 0.3,
      direction: -Math.PI / 2,
      spread: Math.PI * 2, // all directions
      sizeMin: 1,
      sizeMax: 3,
      colorStart: new Color(200, 200, 255, 255),
      colorEnd: new Color(100, 100, 255, 255),
      alphaStart: 255,
      alphaEnd: 0,
      gravity: 0.0003,
      shape: 'rect',
    });
  }

  update(deltaTime: number): void {
    this.scene.update(deltaTime);
    this.elapsedTime += deltaTime / 1000;

    // Update the custom uniform on the material — no GL calls
    this.crateMaterial.setUniform("u_time", this.elapsedTime);

    // Parent/child rotation — parent rotates, children orbit automatically
    let parent = this.scene.getObjectByName("parentBlock");
    if (parent) parent.transform.rotation.vz = this.elapsedTime * 1.5;

    let child = this.scene.getObjectByName("childBlock");
    if (child) child.transform.rotation.vz = -this.elapsedTime * 3;

    let gc = this.scene.getObjectByName("grandchildBlock");
    if (gc) gc.transform.rotation.vz = this.elapsedTime * 5;

    // Particles
    this.fireEmitter.update(deltaTime);
    this.sparkEmitter.update(deltaTime);
  }

  render(shader: Shader): void {
    // Everything renders through the scene — custom shaders are handled internally
    this.scene.render(shader);

    // Batched shape primitives
    if (this.drawShapes) {
      Draw.rect(400, 300, 120, 80, Color.red());
      Draw.rectOutline(400, 300, 120, 80, Color.white());
      Draw.circle(700, 350, 50, Color.green());
      Draw.circleOutline(700, 350, 60, Color.white());
      Draw.triangle(800, 250, 850, 350, 750, 350, Color.blue());
      Draw.line(50, 400, 300, 400, new Color(255, 255, 0, 255));
      Draw.ray(50, 450, 1, 0.5, 200, new Color(0, 255, 255, 255));
      Draw.point(600, 450, Color.white(), 6);
    }

    // Particles — all batch into the same Draw call
    this.fireEmitter.render();
    this.sparkEmitter.render();

    Draw.flush(shader);
  }
}
