import { Scene } from './scene';
import { SimObject } from './simObject';
import { ComponentManager } from '../components/componentManager';
import { BehaviorManager } from '../behaviors/behaviorManager';
export var ZoneState;
(function (ZoneState) {
    ZoneState[ZoneState["UNINITIALIZED"] = 0] = "UNINITIALIZED";
    ZoneState[ZoneState["LOADING"] = 1] = "LOADING";
    ZoneState[ZoneState["UPDATING"] = 2] = "UPDATING";
})(ZoneState || (ZoneState = {}));
export class Zone {
    constructor(id, name, description) {
        this.state = ZoneState.UNINITIALIZED;
        this.globalId = -1;
        this.id = id;
        this.name = name;
        this.description = description;
        this.scene = new Scene();
    }
    initialize(zoneData) {
        if (zoneData.objects === undefined) {
            throw new Error("Zone initialization error: objects not present.");
        }
        for (let o in zoneData.objects) {
            let obj = zoneData.objects[o];
            this.loadSimObject(obj, this.scene.getRoot);
        }
    }
    loadSimObject(dataSection, parent) {
        let name = "";
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
    get getId() {
        return this.id;
    }
    get getName() {
        return this.name;
    }
    get getDescription() {
        return this.description;
    }
    get getScene() {
        return this.scene;
    }
    load() {
        this.state = ZoneState.LOADING;
        this.scene.load();
        this.state = ZoneState.UPDATING;
    }
    unload() {
        this.state = ZoneState.UNINITIALIZED;
    }
    update(deltaTime) {
        if (this.state === ZoneState.UPDATING) {
            this.scene.update(deltaTime);
        }
    }
    render(shader) {
        if (this.state === ZoneState.UPDATING) {
            this.scene.render(shader);
        }
    }
    onActivate() { }
    onDeactivate() { }
}
//# sourceMappingURL=zone.js.map