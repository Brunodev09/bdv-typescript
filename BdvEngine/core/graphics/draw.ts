import { gl } from '../gl/gl';
import { Shader } from '../gl/shader';
import { Color } from './color';
import { m4x4 } from '../utils/m4x4';

/**
 * Batched immediate-mode shape drawing.
 *
 * All shapes queued during a frame are collected into a single vertex buffer
 * and rendered in at most 2 draw calls (triangles + lines).
 * Per-vertex color means different-colored shapes batch together.
 *
 * Usage (inside Game.render):
 *   Draw.rect(10, 20, 100, 50, Color.red());
 *   Draw.circle(200, 200, 40, Color.green());
 *   Draw.line(0, 0, 300, 300, Color.white());
 *   Draw.flush(shader);  // submits everything
 */
export class Draw {

  // Vertex layout: x, y, z, r, g, b, a  (7 floats)
  private static triVerts: number[] = [];
  private static lineVerts: number[] = [];

  private static whiteTexture: WebGLTexture | null = null;
  private static triBuf: WebGLBuffer | null = null;
  private static lineBuf: WebGLBuffer | null = null;
  private static batchShader: Shader | null = null;
  private static projectionMatrix: m4x4 = m4x4.identity();

  /** Called by the engine each frame to keep the projection in sync. */
  static setProjection(proj: m4x4): void {
    Draw.projectionMatrix = proj;
  }

  /** Get the current projection matrix. Used internally by Sprite for custom shaders. */
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

  private static pushVert(buf: number[], x: number, y: number, z: number, c: Color): void {
    buf.push(x, y, z, c.rFloat, c.gFloat, c.bFloat, c.aFloat);
  }

  // ---- queue shapes ----

  /** Filled rectangle. */
  static rect(x: number, y: number, w: number, h: number, color: Color): void {
    let b = Draw.triVerts, c = color;
    Draw.pushVert(b, x, y, 0, c);
    Draw.pushVert(b, x, y + h, 0, c);
    Draw.pushVert(b, x + w, y + h, 0, c);
    Draw.pushVert(b, x + w, y + h, 0, c);
    Draw.pushVert(b, x + w, y, 0, c);
    Draw.pushVert(b, x, y, 0, c);
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
    let b = Draw.triVerts;
    for (let i = 0; i < segments; i++) {
      let a0 = (i / segments) * Math.PI * 2;
      let a1 = ((i + 1) / segments) * Math.PI * 2;
      Draw.pushVert(b, cx, cy, 0, color);
      Draw.pushVert(b, cx + Math.cos(a0) * radius, cy + Math.sin(a0) * radius, 0, color);
      Draw.pushVert(b, cx + Math.cos(a1) * radius, cy + Math.sin(a1) * radius, 0, color);
    }
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
    let b = Draw.triVerts;
    Draw.pushVert(b, x1, y1, 0, color);
    Draw.pushVert(b, x2, y2, 0, color);
    Draw.pushVert(b, x3, y3, 0, color);
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
    let b = Draw.lineVerts;
    Draw.pushVert(b, x1, y1, 0, color);
    Draw.pushVert(b, x2, y2, 0, color);
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
   * Call once at the end of your render() method.
   * At most 2 draw calls: one for all triangles, one for all lines.
   */
  static flush(parentShader: Shader): void {
    if (Draw.triVerts.length === 0 && Draw.lineVerts.length === 0) return;

    Draw.ensureInit();

    let shader = Draw.batchShader!;
    shader.use();

    // Set projection uniform on the batch shader
    let projLoc = shader.getUniformLocation("u_proj");
    gl.uniformMatrix4fv(projLoc, false, new Float32Array(Draw.projectionMatrix.mData));

    // Draw triangles
    if (Draw.triVerts.length > 0) {
      Draw.submitBatch(shader, Draw.triBuf!, Draw.triVerts, gl.TRIANGLES);
      Draw.triVerts.length = 0;
    }

    // Draw lines
    if (Draw.lineVerts.length > 0) {
      Draw.submitBatch(shader, Draw.lineBuf!, Draw.lineVerts, gl.LINES);
      Draw.lineVerts.length = 0;
    }

    // Restore the parent shader so sprite rendering isn't affected
    parentShader.use();
  }

  private static submitBatch(shader: Shader, buffer: WebGLBuffer, verts: number[], mode: number): void {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);

    // stride: 7 floats * 4 bytes = 28
    const stride = 7 * 4;

    let posLoc = shader.getAttribLocation("a_pos");
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(posLoc);

    let colLoc = shader.getAttribLocation("a_color");
    gl.vertexAttribPointer(colLoc, 4, gl.FLOAT, false, stride, 3 * 4);
    gl.enableVertexAttribArray(colLoc);

    gl.drawArrays(mode, 0, verts.length / 7);

    gl.disableVertexAttribArray(posLoc);
    gl.disableVertexAttribArray(colLoc);
  }
}

/** Per-vertex-color shader for batched primitives. No texture sampling. */
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
