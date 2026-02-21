namespace BdvEngine {
  export interface IComponent {
    name: string;

    readonly getOwner: SimObject;
    setOwner(owner: SimObject): void;

    load(): void;

    update(time: number): void;

    render(shader: Shader): void;
  }
}
