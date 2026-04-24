import { Scene } from './scene';
import { SimObject } from './simObject';
import { ComponentManager } from '../components/componentManager';
import { BehaviorManager } from '../behaviors/behaviorManager';
import { Shader } from '../gl/shader';
import { transform } from '../utils/transform';

export enum ZoneState {
  UNINITIALIZED,
  LOADING,
  UPDATING,
}

export class Zone {
  private id: number;
  private name: string;
  private description: string;
  private scene: Scene;
  private state: ZoneState = ZoneState.UNINITIALIZED;
  private globalId: number = -1;

  public constructor(id: number, name: string, description: string) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.scene = new Scene();
  }

  public initialize(zoneData: any): void {
    if (zoneData.objects === undefined) {
      throw new Error("Zone initialization error: objects not present.");
    }

    for (let o in zoneData.objects) {
      let obj = zoneData.objects[o];

      this.loadSimObject(obj, this.scene.getRoot);
    }
  }

  private loadSimObject(dataSection: any, parent: SimObject): void {
    let name: string = "";
    if (dataSection.name !== undefined) {
      name = String(dataSection.name);
    }

    this.globalId++;
    let simObject = new SimObject(this.globalId, name, this.scene);

    if (dataSection.transform !== undefined) {
      simObject.transform.setFromJson(dataSection.transform);
    }

    if (dataSection.components !== undefined) {
      for (let c in dataSection.components) {
        let data = dataSection.components[c];
        let component = ComponentManager.extractComponent(data);
        simObject.addComponent(component);
      }
    }

    if (dataSection.behaviors !== undefined) {
      for (let b in dataSection.behaviors) {
        let data = dataSection.behaviors[b];
        let behavior = BehaviorManager.extractBehavior(data);
        simObject.addBehavior(behavior);
      }
    }

    if (dataSection.children !== undefined) {
      for (let o in dataSection.children) {
        let obj = dataSection.children[o];
        this.loadSimObject(obj, simObject);
      }
    }

    if (parent !== undefined) {
      parent.addChild(simObject);
    }
  }

  public get getId(): number {
    return this.id;
  }

  public get getName(): string {
    return this.name;
  }

  public get getDescription(): string {
    return this.description;
  }

  public get getScene(): Scene {
    return this.scene;
  }

  public load(): void {
    this.state = ZoneState.LOADING;

    this.scene.load();

    this.state = ZoneState.UPDATING;
  }

  public unload(): void {
    this.state = ZoneState.UNINITIALIZED;

    //this.scene.unload();
  }

  public update(deltaTime: number): void {
    if (this.state === ZoneState.UPDATING) {
      this.scene.update(deltaTime);
    }
  }

  public render(shader: Shader): void {
    if (this.state === ZoneState.UPDATING) {
      this.scene.render(shader);
    }
  }

  public onActivate(): void {}

  public onDeactivate(): void {}
}
