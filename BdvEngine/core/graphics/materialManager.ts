namespace BdvEngine {
    export class MaterialManager {
        private static materials: {[name: string]: MaterialRefNode} = {};
        private constructor() {}

        public static register(material: Material): void {
            if (!MaterialManager.materials[material.materialName]) {
                MaterialManager.materials[material.materialName] = new MaterialRefNode(material);
            }
        }

        public static get(materialName: string): Material {
            if (!MaterialManager.materials[materialName]) return undefined;
            MaterialManager.materials[materialName].refCount++;
            return MaterialManager.materials[materialName].material;
        }

        public static flush(materialName: string): void {
            if (!MaterialManager.materials[materialName]) {
                console.log(`MaterialManager:: Cannot flush material ${materialName} because it hasn't been registered.`);
                return undefined;
            }
            MaterialManager.materials[materialName].refCount--;
            if (MaterialManager.materials[materialName].refCount < 1) {
                MaterialManager.materials[materialName].material.destructor();
                MaterialManager.materials[materialName].material = undefined;
                delete MaterialManager.materials[materialName];
            }
        }
    }
}
