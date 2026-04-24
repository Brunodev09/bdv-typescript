import { IComponent } from './IComponents';

export interface IComponentBuilder {
  readonly type: string;

  buildFromJson(json: any): IComponent;
}
