import { m4x4 } from '../utils/m4x4';
import { transform } from '../utils/transform';
export class SimObject {
    constructor(id, name, scene) {
        this.children = [];
        this.isLoaded = false;
        this.components = [];
        this.behaviors = [];
        this.localMatrix = m4x4.identity();
        this.worldMatrix = m4x4.identity();
        this.transform = new transform();
        this.id = id;
        this.name = name;
        this.scene = scene;
    }
    onAdded(scene) {
        this.scene = scene;
    }
    updateWorldMatrix(parentWorldMatrix) {
        if (parentWorldMatrix) {
            this.worldMatrix = m4x4.multiply(parentWorldMatrix, this.localMatrix);
        }
        else {
            this.worldMatrix.copyFrom(this.localMatrix);
        }
    }
    get getId() {
        return this.id;
    }
    get getName() {
        return this.name;
    }
    get getLocalMatrix() {
        return this.localMatrix;
    }
    get getWorldMatrix() {
        return this.worldMatrix;
    }
    get getParent() {
        return this.parent;
    }
    get getIsLoaded() {
        return this.isLoaded;
    }
    addChild(child) {
        child.parent = this;
        this.children.push(child);
        child.onAdded(this.scene);
    }
    removeChild(child) {
        let index = this.children.indexOf(child);
        if (index !== -1) {
            child.parent = undefined;
            this.children.splice(index, 1);
        }
    }
    getObjectByName(name) {
        if (this.name === name) {
            return this;
        }
        for (let child of this.children) {
            let result = child.getObjectByName(name);
            if (result) {
                return result;
            }
        }
        return undefined;
    }
    addComponent(component) {
        this.components.push(component);
        component.setOwner(this);
    }
    addBehavior(behavior) {
        this.behaviors.push(behavior);
        behavior.setOwner(this);
    }
    load() {
        this.isLoaded = true;
        for (let component of this.components) {
            component.load();
        }
        for (let child of this.children) {
            child.load();
        }
    }
    update(deltaTime) {
        this.localMatrix = this.transform.getTransformationMatrix();
        this.updateWorldMatrix(this.parent ? this.parent.getWorldMatrix : undefined);
        for (let component of this.components) {
            component.update(deltaTime);
        }
        for (let b of this.behaviors) {
            b.update(deltaTime);
        }
        for (let child of this.children) {
            child.update(deltaTime);
        }
    }
    render(shader) {
        for (let component of this.components) {
            component.render(shader);
        }
        for (let child of this.children) {
            child.render(shader);
        }
    }
}
//# sourceMappingURL=simObject.js.map