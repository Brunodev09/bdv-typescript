namespace BdvEngine {
  export class Vertex {
    public position: vec3 = vec3.zero;
    public texCoords: vec2 = vec2.zero;

    public constructor(
      x: number = 0,
      y: number = 0,
      z: number = 0,
      tu: number = 0,
      tv: number = 0,
    ) {
      this.position.vx = x;
      this.position.vy = y;
      this.position.vz = z;

      this.texCoords.vx = tu;
      this.texCoords.vy = tv;
    }

    public toArray(): number[] {
      let array: number[] = [];

      array = array.concat(this.position.toArray());
      array = array.concat(this.texCoords.toArray());

      return array;
    }

    public toFloat32Array(): Float32Array {
      return new Float32Array(this.toArray());
    }
  }
}
