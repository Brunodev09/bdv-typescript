namespace BdvEngine {
  export class MaterialRefNode {
    public material: Material;
    public refCount: number = 1;

    public constructor(material: Material) {
      this.material = material;
    }
  }
}
