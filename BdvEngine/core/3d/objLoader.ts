import { Mesh } from './mesh';

/**
 * Parses Wavefront .obj text into a Mesh.
 * Supports: v (positions), vn (normals), vt (texcoords), f (faces).
 * Triangulates quads. Generates flat normals if none provided.
 */
export class ObjLoader {

  static parse(objText: string): Mesh {
    let positions: number[][] = [];
    let normals: number[][] = [];
    let texcoords: number[][] = [];

    let vertices: number[] = [];
    let vertexMap: Map<string, number> = new Map();
    let indices: number[] = [];

    let lines = objText.split('\n');

    for (let line of lines) {
      line = line.trim();
      if (line.length === 0 || line[0] === '#') continue;

      let parts = line.split(/\s+/);
      let cmd = parts[0];

      if (cmd === 'v') {
        positions.push([
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3]),
        ]);
      } else if (cmd === 'vn') {
        normals.push([
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3]),
        ]);
      } else if (cmd === 'vt') {
        texcoords.push([
          parseFloat(parts[1]),
          parseFloat(parts[2] || '0'),
        ]);
      } else if (cmd === 'f') {
        let faceVerts: number[] = [];

        for (let i = 1; i < parts.length; i++) {
          let key = parts[i];
          let existing = vertexMap.get(key);
          if (existing !== undefined) {
            faceVerts.push(existing);
            continue;
          }

          let segs = key.split('/');
          let pi = parseInt(segs[0]) - 1;
          let ti = segs.length > 1 && segs[1] ? parseInt(segs[1]) - 1 : -1;
          let ni = segs.length > 2 && segs[2] ? parseInt(segs[2]) - 1 : -1;

          let pos = positions[pi] || [0, 0, 0];
          let nor = ni >= 0 ? normals[ni] : [0, 0, 0];
          let tex = ti >= 0 ? texcoords[ti] : [0, 0];

          let idx = vertices.length / 8;
          vertices.push(pos[0], pos[1], pos[2], nor[0], nor[1], nor[2], tex[0], tex[1]);
          vertexMap.set(key, idx);
          faceVerts.push(idx);
        }

        // Triangulate (fan from first vertex)
        for (let i = 1; i < faceVerts.length - 1; i++) {
          indices.push(faceVerts[0], faceVerts[i], faceVerts[i + 1]);
        }
      }
    }

    // Generate normals if none were provided
    if (normals.length === 0) {
      ObjLoader.generateFlatNormals(vertices, indices);
    }

    return new Mesh(vertices, indices);
  }

  private static generateFlatNormals(vertices: number[], indices: number[]): void {
    // Zero out existing normals
    for (let i = 0; i < vertices.length; i += 8) {
      vertices[i + 3] = 0;
      vertices[i + 4] = 0;
      vertices[i + 5] = 0;
    }

    // Accumulate face normals
    for (let i = 0; i < indices.length; i += 3) {
      let a = indices[i] * 8, b = indices[i + 1] * 8, c = indices[i + 2] * 8;

      let ax = vertices[a], ay = vertices[a + 1], az = vertices[a + 2];
      let bx = vertices[b], by = vertices[b + 1], bz = vertices[b + 2];
      let cx = vertices[c], cy = vertices[c + 1], cz = vertices[c + 2];

      let e1x = bx - ax, e1y = by - ay, e1z = bz - az;
      let e2x = cx - ax, e2y = cy - ay, e2z = cz - az;

      let nx = e1y * e2z - e1z * e2y;
      let ny = e1z * e2x - e1x * e2z;
      let nz = e1x * e2y - e1y * e2x;

      for (let vi of [a, b, c]) {
        vertices[vi + 3] += nx;
        vertices[vi + 4] += ny;
        vertices[vi + 5] += nz;
      }
    }

    // Normalize
    for (let i = 0; i < vertices.length; i += 8) {
      let nx = vertices[i + 3], ny = vertices[i + 4], nz = vertices[i + 5];
      let len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len > 0) {
        vertices[i + 3] /= len;
        vertices[i + 4] /= len;
        vertices[i + 5] /= len;
      }
    }
  }
}
