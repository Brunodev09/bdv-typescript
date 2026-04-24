import { gl } from '../gl/gl';

/**
 * 3D Mesh — holds vertex data (position + normal + UV) in a GL buffer.
 * Vertex layout: x, y, z, nx, ny, nz, u, v = 8 floats per vertex.
 */
export class Mesh {
  private vbo: WebGLBuffer;
  private ibo: WebGLBuffer | null = null;
  private vertexCount: number;
  private indexCount: number = 0;
  private initialized: boolean = false;
  private vertexData: Float32Array;
  private indexData: Uint16Array | null = null;

  static readonly FLOATS_PER_VERTEX = 8;
  static readonly STRIDE = 8 * 4; // 32 bytes

  constructor(vertices: number[], indices?: number[]) {
    this.vertexData = new Float32Array(vertices);
    this.vertexCount = vertices.length / Mesh.FLOATS_PER_VERTEX;
    this.vbo = null as any;

    if (indices && indices.length > 0) {
      this.indexData = new Uint16Array(indices);
      this.indexCount = indices.length;
    }
  }

  private ensureGl(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.STATIC_DRAW);

    if (this.indexData) {
      this.ibo = gl.createBuffer()!;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indexData, gl.STATIC_DRAW);
    }
  }

  public bind(posLoc: number, normalLoc: number, texLoc: number): void {
    this.ensureGl();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

    // a_pos: 3 floats at offset 0
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, Mesh.STRIDE, 0);
    gl.enableVertexAttribArray(posLoc);

    // a_normal: 3 floats at offset 12
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, Mesh.STRIDE, 3 * 4);
    gl.enableVertexAttribArray(normalLoc);

    // a_textCoord: 2 floats at offset 24
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, Mesh.STRIDE, 6 * 4);
    gl.enableVertexAttribArray(texLoc);

    if (this.ibo) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    }
  }

  public draw(): void {
    if (this.ibo) {
      gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    } else {
      gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    }
  }

  public unbind(posLoc: number, normalLoc: number, texLoc: number): void {
    gl.disableVertexAttribArray(posLoc);
    gl.disableVertexAttribArray(normalLoc);
    gl.disableVertexAttribArray(texLoc);
  }

  public destroy(): void {
    if (this.vbo) gl.deleteBuffer(this.vbo);
    if (this.ibo) gl.deleteBuffer(this.ibo);
  }

  // ---- built-in primitives ----

  static cube(): Mesh {
    // Each face: 4 vertices × 8 floats, 2 triangles via indices
    // pos(3) + normal(3) + uv(2)
    let v: number[] = [];
    let idx: number[] = [];

    function face(
      p0: number[], p1: number[], p2: number[], p3: number[],
      n: number[],
    ) {
      let base = v.length / 8;
      v.push(...p0, ...n, 0, 0);
      v.push(...p1, ...n, 1, 0);
      v.push(...p2, ...n, 1, 1);
      v.push(...p3, ...n, 0, 1);
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }

    // Front  (+Z)
    face([-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5], [0, 0, 1]);
    // Back   (-Z)
    face([0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5], [0, 0, -1]);
    // Top    (+Y)
    face([-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5], [0, 1, 0]);
    // Bottom (-Y)
    face([-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5], [0, -1, 0]);
    // Right  (+X)
    face([0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5], [1, 0, 0]);
    // Left   (-X)
    face([-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5], [-1, 0, 0]);

    return new Mesh(v, idx);
  }

  static plane(size: number = 1): Mesh {
    let h = size / 2;
    let v = [
      // Top face (normal +Y)
      -h, 0, -h,  0, 1, 0,  0, 0,
       h, 0, -h,  0, 1, 0,  1, 0,
       h, 0,  h,  0, 1, 0,  1, 1,
      -h, 0,  h,  0, 1, 0,  0, 1,
      // Bottom face (normal -Y) — so it's visible from below too
      -h, 0,  h,  0, -1, 0,  0, 0,
       h, 0,  h,  0, -1, 0,  1, 0,
       h, 0, -h,  0, -1, 0,  1, 1,
      -h, 0, -h,  0, -1, 0,  0, 1,
    ];
    let idx = [
      0, 1, 2, 0, 2, 3,
      4, 5, 6, 4, 6, 7,
    ];
    return new Mesh(v, idx);
  }

  static sphere(segments: number = 16, rings: number = 12): Mesh {
    let v: number[] = [];
    let idx: number[] = [];

    for (let r = 0; r <= rings; r++) {
      let phi = (r / rings) * Math.PI;
      let sp = Math.sin(phi), cp = Math.cos(phi);

      for (let s = 0; s <= segments; s++) {
        let theta = (s / segments) * Math.PI * 2;
        let st = Math.sin(theta), ct = Math.cos(theta);

        let x = ct * sp;
        let y = cp;
        let z = st * sp;
        let u = s / segments;
        let vv = r / rings;

        v.push(x * 0.5, y * 0.5, z * 0.5, x, y, z, u, vv);
      }
    }

    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < segments; s++) {
        let a = r * (segments + 1) + s;
        let b = a + segments + 1;
        idx.push(a, b, a + 1);
        idx.push(a + 1, b, b + 1);
      }
    }

    return new Mesh(v, idx);
  }
}
