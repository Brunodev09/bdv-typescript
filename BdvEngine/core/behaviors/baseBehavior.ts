import { IBehavior } from './IBehavior';
import { SimObject } from '../world/simObject';
import { IBehaviorData } from './IBehaviorData';

export abstract class BaseBehavior implements IBehavior {
  public name: string;

  protected _data: IBehaviorData;
  protected _owner!: SimObject;

  public constructor(data: IBehaviorData) {
    this._data = data;
    this.name = this._data.name;
  }

  public setOwner(owner: SimObject): void {
    this._owner = owner;
  }

  public update(time: number): void {}

  public apply(userData: any): void {}
}
