import { gl } from '../gl/gl';
import { Shader } from '../gl/shader';
import { Vertex } from './vertex';
import { Material } from './material';
import { Texture } from './texture';
import { Color } from './color';
import { m4x4 } from '../utils/m4x4';
import { Draw } from './draw';

/**
 * Batched sprite renderer.
 *
 * Collects all sprites during the render pass into vertex arrays keyed
 * by texture+shader. At flush time, each unique combo is drawn in a
 * single drawArrays call.
 *
 * Vertex layout: x, y, z, u, v, r, g, b, a (9 floats).
 * Positions are pre-transformed to world space on the CPU so no
 * per-sprite u_transf uniform is needed.
 */

interface Batch {
  verts: number[];
  texture: Texture;
  material: Material | null; // non-null for custom-shader batches
}

export class SpriteBatcher {

  private static batches: Map<string, Batch> = new Map();
  private static buffer: WebGLBuffer | null = null;
  private static batchShader: BatchSpriteShader | null = null;

  private static ensureInit(): void {
    if (SpriteBatcher.buffer) return;
    SpriteBatcher.buffer = gl.createBuffer();
    SpriteBatcher.batchShader = new BatchSpriteShader();
  }

  /**
   * Queue a sprite's vertices for batched rendering.
   * Called by Sprite.pushToBatch().
   */
  static push(vertices: Vertex[], material: Material, worldMatrix: m4x4): void {
    let texture = material.diffTexture;
    if (!texture) return;

    let shaderName = material.hasCustomShader ? material.shader!.name : "__default_batch__";
    let key = shaderName + ":" + material.diffTextureName;

    let batch = SpriteBatcher.batches.get(key);
    if (!batch) {
      batch = {
        verts: [],
        texture: texture,
        material: material.hasCustomShader ? material : null,
      };
      SpriteBatcher.batches.set(key, batch);
    }

    let color = material.diffColor;
    let r = color.rFloat, g = color.gFloat, b = color.bFloat, a = color.aFloat;
    let m = worldMatrix.mData;
    let buf = batch.verts;

    for (let i = 0; i < vertices.length; i++) {
      let v = vertices[i];
      let px = v.position.vx, py = v.position.vy, pz = v.position.vz;

      // CPU-side mat4 * vec4 transform to world space
      let wx = m[0] * px + m[4] * py + m[8]  * pz + m[12];
      let wy = m[1] * px + m[5] * py + m[9]  * pz + m[13];
      let wz = m[2] * px + m[6] * py + m[10] * pz + m[14];

      buf.push(wx, wy, wz, v.texCoords.vx, v.texCoords.vy, r, g, b, a);
    }
  }

  /**
   * Draw a textured quad from a spritesheet.
   * Use this to render buildings, UI icons, or any sprite from a texture atlas.
   *
   * @param material - Material containing the spritesheet texture
   * @param srcCol - Column in the spritesheet grid (0-indexed)
   * @param srcRow - Row in the spritesheet grid (0-indexed)
   * @param gridCols - Total columns in the spritesheet
   * @param gridRows - Total rows in the spritesheet
   * @param x - Screen X position
   * @param y - Screen Y position
   * @param width - Render width in pixels
   * @param height - Render height in pixels
   * @param tint - Optional color tint (default white)
   */
  static drawTexture(
    material: Material,
    srcCol: number, srcRow: number,
    gridCols: number, gridRows: number,
    x: number, y: number,
    width: number, height: number,
    tint: Color = Color.white(),
  ): void {
    let texture = material.diffTexture;
    if (!texture) return;

    SpriteBatcher.ensureInit();

    let key = "__default_batch__:" + material.diffTextureName;
    let batch = SpriteBatcher.batches.get(key);
    if (!batch) {
      batch = { verts: [], texture: texture, material: null };
      SpriteBatcher.batches.set(key, batch);
    }

    let u0 = srcCol / gridCols;
    let v0 = srcRow / gridRows;
    let u1 = (srcCol + 1) / gridCols;
    let v1 = (srcRow + 1) / gridRows;

    let r = tint.rFloat, g = tint.gFloat, b = tint.bFloat, a = tint.aFloat;
    let buf = batch.verts;

    buf.push(
      x,         y,          0, u0, v0, r, g, b, a,
      x,         y + height, 0, u0, v1, r, g, b, a,
      x + width, y + height, 0, u1, v1, r, g, b, a,
      x + width, y + height, 0, u1, v1, r, g, b, a,
      x + width, y,          0, u1, v0, r, g, b, a,
      x,         y,          0, u0, v0, r, g, b, a,
    );
  }

  /**
   * Submit all batched sprites to the GPU.
   * One draw call per unique texture+shader combination.
   * Called by the engine at the end of the render pass.
   */
  static flush(): void {
    if (SpriteBatcher.batches.size === 0) return;

    SpriteBatcher.ensureInit();

    SpriteBatcher.batches.forEach((batch, key) => {
      if (batch.verts.length === 0) return;

      let shader: Shader;
      if (batch.material && batch.material.hasCustomShader) {
        // Custom shader path
        shader = batch.material.shader!;
        shader.use();

        let projLoc = shader.getUniformLocation("u_proj");
        gl.uniformMatrix4fv(projLoc, false, new Float32Array(Draw.getProjection().mData));

        batch.material.applyUniforms(shader);
      } else {
        // Default batched sprite shader
        shader = SpriteBatcher.batchShader!;
        shader.use();

        let projLoc = shader.getUniformLocation("u_proj");
        gl.uniformMatrix4fv(projLoc, false, new Float32Array(Draw.getProjection().mData));
      }

      // Bind texture
      batch.texture.activate(0);
      let diffLoc = shader.getUniformLocation("u_diffuse");
      gl.uniform1i(diffLoc, 0);

      // Upload vertex data
      gl.bindBuffer(gl.ARRAY_BUFFER, SpriteBatcher.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(batch.verts), gl.DYNAMIC_DRAW);

      // Vertex layout: 9 floats * 4 bytes = 36 byte stride
      const stride = 9 * 4;

      let posLoc = shader.getAttribLocation("a_pos");
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(posLoc);

      let texLoc = shader.getAttribLocation("a_textCoord");
      gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, stride, 3 * 4);
      gl.enableVertexAttribArray(texLoc);

      let colLoc = shader.getAttribLocation("a_color");
      gl.vertexAttribPointer(colLoc, 4, gl.FLOAT, false, stride, 5 * 4);
      gl.enableVertexAttribArray(colLoc);

      // Draw all sprites in this batch in one call
      let vertexCount = batch.verts.length / 9;
      gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

      gl.disableVertexAttribArray(posLoc);
      gl.disableVertexAttribArray(texLoc);
      gl.disableVertexAttribArray(colLoc);

      batch.verts.length = 0;
    });
  }
}

/**
 * Shader for batched sprites.
 * Per-vertex color + texture sampling. No per-sprite transform uniform.
 */
class BatchSpriteShader extends Shader {
  constructor() {
    super("batch_sprite");
    this.load(this.vertSrc(), this.fragSrc());
  }

  private vertSrc(): string {
    return `
      attribute vec3 a_pos;
      attribute vec2 a_textCoord;
      attribute vec4 a_color;

      uniform mat4 u_proj;

      varying vec2 v_textCoord;
      varying vec4 v_color;

      void main() {
          gl_Position = u_proj * vec4(a_pos, 1.0);
          v_textCoord = a_textCoord;
          v_color = a_color;
      }`;
  }

  private fragSrc(): string {
    return `
      precision mediump float;
      uniform sampler2D u_diffuse;

      varying vec2 v_textCoord;
      varying vec4 v_color;

      void main() {
          gl_FragColor = v_color * texture2D(u_diffuse, v_textCoord);
      }`;
  }
}
