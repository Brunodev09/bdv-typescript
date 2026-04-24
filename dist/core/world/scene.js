import { SimObject } from './simObject';
export class Scene {
    constructor() {
        this.root = new SimObject(0, '__root__', this);
    }
    get getRoot() {
        return this.root;
    }
    get isLoaded() {
        return this.root.getIsLoaded;
    }
    addObject(object) {
        this.root.addChild(object);
    }
    removeObject(object) {
        this.root.removeChild(object);
    }
    getObjectByName(name) {
        return this.root.getObjectByName(name);
    }
    load() {
        this.root.load();
    }
    update(deltaTime) {
        this.root.update(deltaTime);
    }
    render(shader) {
        this.root.render(shader);
    }
}
//# sourceMappingURL=scene.js.map