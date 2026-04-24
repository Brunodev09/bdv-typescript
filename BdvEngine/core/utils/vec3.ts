export class vec3 {
  private x: number;
  private y: number;
  private z: number;

  public constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  public get vx(): number {
    return this.x;
  }

  public set vx(point: number) {
    this.x = point;
  }

  public get vy(): number {
    return this.y;
  }

  public set vy(point: number) {
    this.y = point;
  }

  public get vz(): number {
    return this.z;
  }

  public set vz(point: number) {
    this.z = point;
  }

  public add(v: vec3): vec3 {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;

    return this;
  }

  public subtract(v: vec3): vec3 {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;

    return this;
  }

  public multiply(v: vec3): vec3 {
    this.x *= v.x;
    this.y *= v.y;
    this.z *= v.z;

    return this;
  }

  public divide(v: vec3): vec3 {
    this.x /= v.x;
    this.y /= v.y;
    this.z /= v.z;

    return this;
  }

  public copyFrom(vec: vec3): void {
    this.x = vec.x;
    this.y = vec.y;
    this.z = vec.z;
  }

  public toArray(): number[] {
    return [this.x, this.y, this.z];
  }

  public toFloat32(): Float32Array {
    return new Float32Array(this.toArray());
  }

  public static get zero(): vec3 {
    return new vec3();
  }

  public static get one(): vec3 {
    return new vec3(1, 1, 1);
  }

  public setFromJson(json: any): void {
    if (json.x !== undefined) {
      this.x = Number(json.x);
    }

    if (json.y !== undefined) {
      this.y = Number(json.y);
    }

    if (json.z !== undefined) {
      this.z = Number(json.z);
    }
  }
}
