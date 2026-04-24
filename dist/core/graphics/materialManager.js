import { MaterialRefNode } from './materialRefNode';
export class MaterialManager {
    constructor() { }
    static register(material) {
        if (!MaterialManager.materials[material.materialName]) {
            MaterialManager.materials[material.materialName] = new MaterialRefNode(material);
        }
    }
    static get(materialName) {
        if (!MaterialManager.materials[materialName])
            return undefined;
        MaterialManager.materials[materialName].refCount++;
        return MaterialManager.materials[materialName].material;
    }
    static flush(materialName) {
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
MaterialManager.materials = {};
//# sourceMappingURL=materialManager.js.map