namespace BdvEngine {
  export abstract class BaseComponent implements IComponent {
    protected owner!: SimObject;
    protected data: IComponentData;
    public name: string;

    public constructor(data: IComponentData) {
      this.data = data;
      this.name = data.name;
    }

    public setOwner(owner: SimObject): void {
      this.owner = owner;
    }

    public get getOwner(): SimObject {
      return this.owner;
    }

    public load(): void {}

    public unload(): void {}

    public update(deltaTime: number): void {}

    public render(shader: Shader): void {}
  }
}
