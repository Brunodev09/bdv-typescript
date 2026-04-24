import { vec3 } from '../utils/vec3';
import { m4x4 } from '../utils/m4x4';

export class Camera {
  public position: vec3;
  public target: vec3;
  public up: vec3;
  public fov: number;
  public near: number;
  public far: number;

  constructor(
    position: vec3 = new vec3(0, 2, 5),
    target: vec3 = new vec3(0, 0, 0),
    up: vec3 = new vec3(0, 1, 0),
    fov: number = Math.PI / 4,
    near: number = 0.1,
    far: number = 1000,
  ) {
    this.position = position;
    this.target = target;
    this.up = up;
    this.fov = fov;
    this.near = near;
    this.far = far;
  }

  public getViewMatrix(): m4x4 {
    return m4x4.lookAt(this.position, this.target, this.up);
  }

  public getProjectionMatrix(aspect: number): m4x4 {
    return m4x4.perspective(this.fov, aspect, this.near, this.far);
  }

  public getViewProjection(aspect: number): m4x4 {
    return m4x4.multiply(this.getProjectionMatrix(aspect), this.getViewMatrix());
  }
}
