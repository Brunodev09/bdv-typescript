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
  AnimatedSpriteComponent,
  AnimatedSpriteComponentData,
  KeyboardMovementBehavior,
  KeyboardMovementBehaviorData,
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

  init(): void {
    // Standard material
    MaterialManager.register(
      new Material("duck", "assets/textures/duck.png", Color.white()),
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

    this.scene.addObject(duck);
    this.scene.addObject(crate);
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
  }

  update(deltaTime: number): void {
    this.scene.update(deltaTime);
    this.elapsedTime += deltaTime / 1000;

    // Update the custom uniform on the material — no GL calls
    this.crateMaterial.setUniform("u_time", this.elapsedTime);
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

    Draw.flush(shader);
  }
}
