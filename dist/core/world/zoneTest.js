import { Zone } from './zone';
export class ZoneTest extends Zone {
    load() {
    }
    update(deltaTime) {
        this.parentObject.transform.rotation.vz += 0.01;
        this.testObject.transform.rotation.vz += 0.01;
        super.update(deltaTime);
    }
}
//# sourceMappingURL=zoneTest.js.map