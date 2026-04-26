import { gl } from '../gl/gl';
import { Shader } from '../gl/shader';
import { Color } from './color';
import { m4x4 } from '../utils/m4x4';

/**
 * Batched immediate-mode shape drawing.
 *
 * All shapes queued during a frame are collected into pre-allocated
 * Float32Arrays and rendered in at most 2 draw calls (triangles + lines).
 * Per-vertex color means different-colored shapes batch together.
 *
 * Optimized for high particle counts: no JS array allocations per frame,
 * no GC pressure, direct typed array writes.
 */
export class Draw {

  // Vertex layout: x, y, z, r, g, b, a  (7 floats per vertex)
  private static readonly FLOATS_PER_VERT = 7;

  // Pre-allocated buffers — grow as needed, never shrink
  private static triData: Float32Array = new Float32Array(7 * 6 * 1024); // ~1K rects
  private static triCount: number = 0; // floats written

  private static lineData: Float32Array = new Float32Array(7 * 2 * 512); // ~512 lines
  private static lineCount: number = 0;

  private static whiteTexture: WebGLTexture | null = null;
  private static triBuf: WebGLBuffer | null = null;
  private static lineBuf: WebGLBuffer | null = null;
  private static batchShader: Shader | null = null;
  private static projectionMatrix: m4x4 = m4x4.identity();

  /** Called by the engine each frame to keep the projection in sync. */
  static setProjection(proj: m4x4): void {
    Draw.projectionMatrix = proj;
  }

  /** Get the current projection matrix. */
  static getProjection(): m4x4 {
    return Draw.projectionMatrix;
  }

  private static ensureInit(): void {
    if (Draw.whiteTexture) return;

    Draw.whiteTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, Draw.whiteTexture);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
      gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([255, 255, 255, 255]),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    Draw.triBuf = gl.createBuffer();
    Draw.lineBuf = gl.createBuffer();
    Draw.batchShader = new BatchColorShader();
  }

  // Grow a Float32Array if needed, returns the (possibly new) array
  private static grow(arr: Float32Array, needed: number): Float32Array {
    if (needed <= arr.length) return arr;
    // Double until big enough
    let newSize = arr.length;
    while (newSize < needed) newSize *= 2;
    let newArr = new Float32Array(newSize);
    newArr.set(arr);
    return newArr;
  }

  // Write a vertex directly into the typed array
  private static pushTriVert(x: number, y: number, z: number, r: number, g: number, b: number, a: number): void {
    let i = Draw.triCount;
    Draw.triData = Draw.grow(Draw.triData, i + 7);
    let d = Draw.triData;
    d[i]     = x;
    d[i + 1] = y;
    d[i + 2] = z;
    d[i + 3] = r;
    d[i + 4] = g;
    d[i + 5] = b;
    d[i + 6] = a;
    Draw.triCount = i + 7;
  }

  private static pushLineVert(x: number, y: number, z: number, r: number, g: number, b: number, a: number): void {
    let i = Draw.lineCount;
    Draw.lineData = Draw.grow(Draw.lineData, i + 7);
    let d = Draw.lineData;
    d[i]     = x;
    d[i + 1] = y;
    d[i + 2] = z;
    d[i + 3] = r;
    d[i + 4] = g;
    d[i + 5] = b;
    d[i + 6] = a;
    Draw.lineCount = i + 7;
  }

  // ---- queue shapes (public API unchanged) ----

  /** Filled rectangle. */
  static rect(x: number, y: number, w: number, h: number, color: Color): void {
    let r = color.rFloat, g = color.gFloat, b = color.bFloat, a = color.aFloat;
    let x2 = x + w, y2 = y + h;

    // Ensure capacity for 6 verts (42 floats) in one check
    let needed = Draw.triCount + 42;
    Draw.triData = Draw.grow(Draw.triData, needed);
    let d = Draw.triData;
    let i = Draw.triCount;

    d[i]    = x;  d[i+1]  = y;  d[i+2]  = 0; d[i+3]  = r; d[i+4]  = g; d[i+5]  = b; d[i+6]  = a;
    d[i+7]  = x;  d[i+8]  = y2; d[i+9]  = 0; d[i+10] = r; d[i+11] = g; d[i+12] = b; d[i+13] = a;
    d[i+14] = x2; d[i+15] = y2; d[i+16] = 0; d[i+17] = r; d[i+18] = g; d[i+19] = b; d[i+20] = a;
    d[i+21] = x2; d[i+22] = y2; d[i+23] = 0; d[i+24] = r; d[i+25] = g; d[i+26] = b; d[i+27] = a;
    d[i+28] = x2; d[i+29] = y;  d[i+30] = 0; d[i+31] = r; d[i+32] = g; d[i+33] = b; d[i+34] = a;
    d[i+35] = x;  d[i+36] = y;  d[i+37] = 0; d[i+38] = r; d[i+39] = g; d[i+40] = b; d[i+41] = a;

    Draw.triCount = i + 42;
  }

  /** Rectangle outline. */
  static rectOutline(x: number, y: number, w: number, h: number, color: Color): void {
    Draw.line(x, y, x + w, y, color);
    Draw.line(x + w, y, x + w, y + h, color);
    Draw.line(x + w, y + h, x, y + h, color);
    Draw.line(x, y + h, x, y, color);
  }

  /** Filled circle. */
  static circle(cx: number, cy: number, radius: number, color: Color, segments: number = 32): void {
    let r = color.rFloat, g = color.gFloat, b = color.bFloat, a = color.aFloat;
    let needed = Draw.triCount + segments * 21;
    Draw.triData = Draw.grow(Draw.triData, needed);
    let d = Draw.triData;
    let idx = Draw.triCount;

    for (let i = 0; i < segments; i++) {
      let a0 = (i / segments) * Math.PI * 2;
      let a1 = ((i + 1) / segments) * Math.PI * 2;
      let cos0 = Math.cos(a0), sin0 = Math.sin(a0);
      let cos1 = Math.cos(a1), sin1 = Math.sin(a1);

      d[idx]   = cx; d[idx+1] = cy; d[idx+2] = 0; d[idx+3] = r; d[idx+4] = g; d[idx+5] = b; d[idx+6] = a;
      d[idx+7] = cx + cos0*radius; d[idx+8] = cy + sin0*radius; d[idx+9] = 0; d[idx+10] = r; d[idx+11] = g; d[idx+12] = b; d[idx+13] = a;
      d[idx+14] = cx + cos1*radius; d[idx+15] = cy + sin1*radius; d[idx+16] = 0; d[idx+17] = r; d[idx+18] = g; d[idx+19] = b; d[idx+20] = a;
      idx += 21;
    }
    Draw.triCount = idx;
  }

  /** Circle outline. */
  static circleOutline(cx: number, cy: number, radius: number, color: Color, segments: number = 32): void {
    for (let i = 0; i < segments; i++) {
      let a0 = (i / segments) * Math.PI * 2;
      let a1 = ((i + 1) / segments) * Math.PI * 2;
      Draw.line(
        cx + Math.cos(a0) * radius, cy + Math.sin(a0) * radius,
        cx + Math.cos(a1) * radius, cy + Math.sin(a1) * radius,
        color,
      );
    }
  }

  /** Filled triangle. */
  static triangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, color: Color): void {
    let r = color.rFloat, g = color.gFloat, b = color.bFloat, a = color.aFloat;
    Draw.pushTriVert(x1, y1, 0, r, g, b, a);
    Draw.pushTriVert(x2, y2, 0, r, g, b, a);
    Draw.pushTriVert(x3, y3, 0, r, g, b, a);
  }

  /** Triangle outline. */
  static triangleOutline(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, color: Color): void {
    Draw.line(x1, y1, x2, y2, color);
    Draw.line(x2, y2, x3, y3, color);
    Draw.line(x3, y3, x1, y1, color);
  }

  /** Point (small filled rect). */
  static point(x: number, y: number, color: Color, size: number = 4): void {
    let h = size / 2;
    Draw.rect(x - h, y - h, size, size, color);
  }

  /** Line segment. */
  static line(x1: number, y1: number, x2: number, y2: number, color: Color): void {
    let r = color.rFloat, g = color.gFloat, b = color.bFloat, a = color.aFloat;
    let needed = Draw.lineCount + 14;
    Draw.lineData = Draw.grow(Draw.lineData, needed);
    let d = Draw.lineData;
    let i = Draw.lineCount;

    d[i]   = x1; d[i+1] = y1; d[i+2] = 0; d[i+3] = r; d[i+4] = g; d[i+5] = b; d[i+6] = a;
    d[i+7] = x2; d[i+8] = y2; d[i+9] = 0; d[i+10] = r; d[i+11] = g; d[i+12] = b; d[i+13] = a;

    Draw.lineCount = i + 14;
  }

  /** Ray from origin along direction for a given length. */
  static ray(ox: number, oy: number, dirX: number, dirY: number, length: number, color: Color): void {
    let mag = Math.sqrt(dirX * dirX + dirY * dirY);
    if (mag === 0) return;
    Draw.line(ox, oy, ox + (dirX / mag) * length, oy + (dirY / mag) * length, color);
  }

  /** Polygon outline from [x,y] pairs. */
  static polygon(points: [number, number][], color: Color): void {
    for (let i = 0; i < points.length; i++) {
      let [x1, y1] = points[i];
      let [x2, y2] = points[(i + 1) % points.length];
      Draw.line(x1, y1, x2, y2, color);
    }
  }

  /** Filled convex polygon from [x,y] pairs. */
  static polygonFilled(points: [number, number][], color: Color): void {
    if (points.length < 3) return;
    for (let i = 1; i < points.length - 1; i++) {
      Draw.triangle(
        points[0][0], points[0][1],
        points[i][0], points[i][1],
        points[i + 1][0], points[i + 1][1],
        color,
      );
    }
  }

  // ---- flush: submit everything ----

  /**
   * Submit all queued shapes to the GPU.
   * At most 2 draw calls: one for all triangles, one for all lines.
   */
  static flush(parentShader: Shader): void {
    if (Draw.triCount === 0 && Draw.lineCount === 0) return;

    Draw.ensureInit();

    let shader = Draw.batchShader!;
    shader.use();

    let projLoc = shader.getUniformLocation("u_proj");
    gl.uniformMatrix4fv(projLoc, false, new Float32Array(Draw.projectionMatrix.mData));

    if (Draw.triCount > 0) {
      Draw.submitBatch(shader, Draw.triBuf!, Draw.triData, Draw.triCount, gl.TRIANGLES);
      Draw.triCount = 0;
    }

    if (Draw.lineCount > 0) {
      Draw.submitBatch(shader, Draw.lineBuf!, Draw.lineData, Draw.lineCount, gl.LINES);
      Draw.lineCount = 0;
    }

    parentShader.use();
  }

  private static submitBatch(shader: Shader, buffer: WebGLBuffer, data: Float32Array, floatCount: number, mode: number): void {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // Upload only the portion that was written — use subarray view (no copy)
    gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, floatCount), gl.DYNAMIC_DRAW);

    const stride = 7 * 4; // 28 bytes

    let posLoc = shader.getAttribLocation("a_pos");
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(posLoc);

    let colLoc = shader.getAttribLocation("a_color");
    gl.vertexAttribPointer(colLoc, 4, gl.FLOAT, false, stride, 3 * 4);
    gl.enableVertexAttribArray(colLoc);

    gl.drawArrays(mode, 0, floatCount / 7);

    gl.disableVertexAttribArray(posLoc);
    gl.disableVertexAttribArray(colLoc);
  }
}

/** Per-vertex-color shader for batched primitives. */
class BatchColorShader extends Shader {
  public constructor() {
    super("batch_color");
    this.load(this.vertSrc(), this.fragSrc());
  }

  private vertSrc(): string {
    return `
      attribute vec3 a_pos;
      attribute vec4 a_color;

      uniform mat4 u_proj;

      varying vec4 v_color;

      void main() {
          gl_Position = u_proj * vec4(a_pos, 1.0);
          v_color = a_color;
      }`;
  }

  private fragSrc(): string {
    return `
      precision mediump float;
      varying vec4 v_color;

      void main() {
          gl_FragColor = v_color;
      }`;
  }
}
