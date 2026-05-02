import { gl, GLExt } from '../gl/gl';
import { Shader } from '../gl/shader';
import { Vertex } from './vertex';
import { Material } from './material';
import { Texture } from './texture';
import { Color } from './color';
import { m4x4 } from '../utils/m4x4';
import { Draw } from './draw';

/**
 * Layered sprite batcher.
 *
 * Layers flush in order: Ground → Object → UI.
 *   • Ground / UI: per-texture batch, insertion order. One draw per (shader × texture).
 *   • Object: per-quad entries with sortY; sorted by Y on flush, run-length batched
 *     by texture for stable depth ordering (RimWorld-style feet-on-ground sort).
 *
 * All batches use indexed quads (4 verts + 6 indices per quad).
 * Vertex layout: x, y, z, u, v, r, g, b, a (9 floats / 36 bytes).
 */

export enum SpriteLayer {
  Ground = 0,
  Object = 1,
  UI = 2,
}

const FLOATS_PER_VERT = 9;
const FLOATS_PER_QUAD = 4 * FLOATS_PER_VERT;

interface Batch {
  verts: number[];
  indices: number[];
  nextBase: number;
  texture: Texture;
  material: Material | null;
}

interface ObjectEntry {
  sortY: number;
  key: string;
  texture: Texture;
  material: Material | null;
  verts: number[]; // 36 floats
}

export class SpriteBatcher {
  private static groundBatches: Map<string, Batch> = new Map();
  private static groundOrder: Batch[] = [];
  private static uiBatches: Map<string, Batch> = new Map();
  private static uiOrder: Batch[] = [];
  private static objectEntries: ObjectEntry[] = [];

  private static vbo: WebGLBuffer | null = null;
  private static ebo: WebGLBuffer | null = null;
  private static batchShader: BatchSpriteShader | null = null;
  private static useUint32: boolean = false;

  private static ensureInit(): void {
    if (SpriteBatcher.vbo) return;
    SpriteBatcher.vbo = gl.createBuffer();
    SpriteBatcher.ebo = gl.createBuffer();
    SpriteBatcher.batchShader = new BatchSpriteShader();
    SpriteBatcher.useUint32 = !!GLExt.elementIndexUint;
  }

  /**
   * Queue a sprite quad. Expects 6 input vertices in the layout produced by Sprite.load
   * (BL, TL, TR, TR-dup, BR, BL-dup) and emits indexed 4-vert geometry.
   */
  static push(
    vertices: Vertex[],
    material: Material,
    worldMatrix: m4x4,
    layer: SpriteLayer = SpriteLayer.Ground,
    sortY: number = 0,
  ): void {
    let texture = material.diffTexture;
    if (!texture || vertices.length < 5) return;

    let shaderName = material.hasCustomShader ? material.shader!.name : "__default_batch__";
    let key = shaderName + ":" + material.diffTextureName;

    let m = worldMatrix.mData;
    let color = material.diffColor;
    let r = color.rFloat, g = color.gFloat, b = color.bFloat, a = color.aFloat;

    // Pull the 4 unique corners (input verts 0, 1, 2, 4 — see Sprite.load).
    let cornerIdx = [0, 1, 2, 4];
    let quad = new Array<number>(FLOATS_PER_QUAD);
    for (let i = 0; i < 4; i++) {
      let v = vertices[cornerIdx[i]];
      let px = v.position.vx, py = v.position.vy, pz = v.position.vz;
      let wx = m[0] * px + m[4] * py + m[8]  * pz + m[12];
      let wy = m[1] * px + m[5] * py + m[9]  * pz + m[13];
      let wz = m[2] * px + m[6] * py + m[10] * pz + m[14];
      let o = i * FLOATS_PER_VERT;
      quad[o + 0] = wx; quad[o + 1] = wy; quad[o + 2] = wz;
      quad[o + 3] = v.texCoords.vx; quad[o + 4] = v.texCoords.vy;
      quad[o + 5] = r;  quad[o + 6] = g;  quad[o + 7] = b;  quad[o + 8] = a;
    }

    SpriteBatcher.emitQuad(quad, key, texture, material.hasCustomShader ? material : null, layer, sortY);
  }

  /**
   * Queue an axis-aligned textured quad sampling a sub-rect of a spritesheet.
   * Use for tilemaps, building atlases, UI icons, etc.
   */
  static drawTexture(
    material: Material,
    srcCol: number, srcRow: number,
    gridCols: number, gridRows: number,
    x: number, y: number,
    width: number, height: number,
    tint: Color = Color.white(),
    layer: SpriteLayer = SpriteLayer.Ground,
    sortY: number = 0,
  ): void {
    let u0 = srcCol / gridCols;
    let v0 = srcRow / gridRows;
    let u1 = (srcCol + 1) / gridCols;
    let v1 = (srcRow + 1) / gridRows;
    SpriteBatcher.drawTextureUV(material, u0, v0, u1, v1, x, y, width, height, tint, layer, sortY);
  }

  /**
   * Queue an axis-aligned textured quad sampling an explicit UV rectangle.
   * Use to draw a sub-tile of a larger atlas cell.
   */
  static drawTextureUV(
    material: Material,
    u0: number, v0: number, u1: number, v1: number,
    x: number, y: number,
    width: number, height: number,
    tint: Color = Color.white(),
    layer: SpriteLayer = SpriteLayer.Ground,
    sortY: number = 0,
  ): void {
    let texture = material.diffTexture;
    if (!texture) return;

    let key = "__default_batch__:" + material.diffTextureName;
    let r = tint.rFloat, g = tint.gFloat, b = tint.bFloat, a = tint.aFloat;
    let x2 = x + width, y2 = y + height;

    let quad = new Array<number>(FLOATS_PER_QUAD);
    // BL
    quad[0]  = x;  quad[1]  = y;  quad[2]  = 0; quad[3]  = u0; quad[4]  = v0; quad[5]  = r; quad[6]  = g; quad[7]  = b; quad[8]  = a;
    // TL
    quad[9]  = x;  quad[10] = y2; quad[11] = 0; quad[12] = u0; quad[13] = v1; quad[14] = r; quad[15] = g; quad[16] = b; quad[17] = a;
    // TR
    quad[18] = x2; quad[19] = y2; quad[20] = 0; quad[21] = u1; quad[22] = v1; quad[23] = r; quad[24] = g; quad[25] = b; quad[26] = a;
    // BR
    quad[27] = x2; quad[28] = y;  quad[29] = 0; quad[30] = u1; quad[31] = v0; quad[32] = r; quad[33] = g; quad[34] = b; quad[35] = a;

    SpriteBatcher.emitQuad(quad, key, texture, null, layer, sortY);
  }

  private static emitQuad(
    quad: number[],
    key: string,
    texture: Texture,
    material: Material | null,
    layer: SpriteLayer,
    sortY: number,
  ): void {
    if (layer === SpriteLayer.Object) {
      SpriteBatcher.objectEntries.push({ sortY, key, texture, material, verts: quad });
      return;
    }

    let dict  = layer === SpriteLayer.UI ? SpriteBatcher.uiBatches : SpriteBatcher.groundBatches;
    let order = layer === SpriteLayer.UI ? SpriteBatcher.uiOrder   : SpriteBatcher.groundOrder;

    let batch = dict.get(key);
    if (!batch) {
      batch = { verts: [], indices: [], nextBase: 0, texture, material };
      dict.set(key, batch);
      order.push(batch);
    }
    SpriteBatcher.appendQuadToBatch(batch, quad);
  }

  private static appendQuadToBatch(batch: Batch, quad: number[]): void {
    let v = batch.verts;
    for (let i = 0; i < FLOATS_PER_QUAD; i++) v.push(quad[i]);
    let b = batch.nextBase;
    batch.indices.push(b + 0, b + 1, b + 2, b + 2, b + 3, b + 0);
    batch.nextBase = b + 4;
  }

  /** Submit all queued sprites for the frame. */
  static flush(): void {
    let any =
      SpriteBatcher.groundOrder.length > 0 ||
      SpriteBatcher.objectEntries.length > 0 ||
      SpriteBatcher.uiOrder.length > 0;
    if (!any) return;

    SpriteBatcher.ensureInit();

    SpriteBatcher.flushBatchList(SpriteBatcher.groundOrder);
    SpriteBatcher.flushObjectLayer();
    SpriteBatcher.flushBatchList(SpriteBatcher.uiOrder);
  }

  private static flushBatchList(order: Batch[]): void {
    for (let i = 0; i < order.length; i++) {
      let batch = order[i];
      if (batch.indices.length === 0) continue;

      let shader = SpriteBatcher.bindShader(batch.material);
      batch.texture.activate(0);
      gl.uniform1i(shader.getUniformLocation("u_diffuse"), 0);

      SpriteBatcher.uploadAndDraw(shader, batch.verts, batch.indices);

      batch.verts.length = 0;
      batch.indices.length = 0;
      batch.nextBase = 0;
    }
  }

  private static flushObjectLayer(): void {
    let entries = SpriteBatcher.objectEntries;
    if (entries.length === 0) return;
    entries.sort((a, b) => a.sortY - b.sortY);

    let verts: number[] = [];
    let indices: number[] = [];
    let nextBase = 0;
    let curKey: string | null = null;
    let curTex: Texture | null = null;
    let curMat: Material | null = null;

    for (let i = 0; i < entries.length; i++) {
      let e = entries[i];
      if (curKey !== e.key) {
        if (verts.length > 0) {
          let shader = SpriteBatcher.bindShader(curMat);
          curTex!.activate(0);
          gl.uniform1i(shader.getUniformLocation("u_diffuse"), 0);
          SpriteBatcher.uploadAndDraw(shader, verts, indices);
          verts = []; indices = []; nextBase = 0;
        }
        curKey = e.key; curTex = e.texture; curMat = e.material;
      }
      for (let j = 0; j < FLOATS_PER_QUAD; j++) verts.push(e.verts[j]);
      indices.push(nextBase + 0, nextBase + 1, nextBase + 2, nextBase + 2, nextBase + 3, nextBase + 0);
      nextBase += 4;
    }

    if (verts.length > 0) {
      let shader = SpriteBatcher.bindShader(curMat);
      curTex!.activate(0);
      gl.uniform1i(shader.getUniformLocation("u_diffuse"), 0);
      SpriteBatcher.uploadAndDraw(shader, verts, indices);
    }
    entries.length = 0;
  }

  private static bindShader(material: Material | null): Shader {
    let shader: Shader;
    if (material && material.hasCustomShader) {
      shader = material.shader!;
      shader.use();
      gl.uniformMatrix4fv(shader.getUniformLocation("u_proj"), false, new Float32Array(Draw.getProjection().mData));
      material.applyUniforms(shader);
    } else {
      shader = SpriteBatcher.batchShader!;
      shader.use();
      gl.uniformMatrix4fv(shader.getUniformLocation("u_proj"), false, new Float32Array(Draw.getProjection().mData));
    }
    return shader;
  }

  private static uploadAndDraw(shader: Shader, verts: number[], indices: number[]): void {
    gl.bindBuffer(gl.ARRAY_BUFFER, SpriteBatcher.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);

    const stride = FLOATS_PER_VERT * 4;
    let posLoc = shader.getAttribLocation("a_pos");
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(posLoc);

    let texLoc = shader.getAttribLocation("a_textCoord");
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, stride, 3 * 4);
    gl.enableVertexAttribArray(texLoc);

    let colLoc = shader.getAttribLocation("a_color");
    gl.vertexAttribPointer(colLoc, 4, gl.FLOAT, false, stride, 5 * 4);
    gl.enableVertexAttribArray(colLoc);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, SpriteBatcher.ebo);
    if (SpriteBatcher.useUint32) {
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.DYNAMIC_DRAW);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);
    } else {
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.DYNAMIC_DRAW);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }

    gl.disableVertexAttribArray(posLoc);
    gl.disableVertexAttribArray(texLoc);
    gl.disableVertexAttribArray(colLoc);
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
