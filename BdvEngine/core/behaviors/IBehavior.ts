import type { SimObject } from '../world/simObject';

export interface IBehavior {
  name: string;

  setOwner(owner: SimObject): void;

  update(time: number): void;

  apply(userData: any): void;
}
