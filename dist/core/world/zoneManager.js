import { Message } from '../com/message';
import { MESSAGE_ASSET_LOADER_LOADED, AssetManager } from '../assets/assetManager';
import { Zone } from './zone';
export class ZoneManager {
    constructor() { }
    static init() {
        ZoneManager.instance = new ZoneManager();
    }
    static registerZone(id, path) {
        ZoneManager.registeredZones[id] = path;
    }
    static changeZone(zoneId) {
        if (ZoneManager.currentZone) {
            ZoneManager.currentZone.onDeactivate();
            ZoneManager.currentZone.unload();
            ZoneManager.currentZone = undefined;
        }
        if (ZoneManager.registeredZones[zoneId] !== undefined) {
            if (AssetManager.isLoaded(ZoneManager.registeredZones[zoneId])) {
                let asset = AssetManager.get(ZoneManager.registeredZones[zoneId]);
                ZoneManager.loadZone(asset);
            }
            else {
                Message.subscribe(MESSAGE_ASSET_LOADER_LOADED +
                    "::" +
                    ZoneManager.registeredZones[zoneId], ZoneManager.instance);
                AssetManager.loadAsset(ZoneManager.registeredZones[zoneId]);
            }
        }
        else {
            throw new Error("Zone id:" + zoneId.toString() + " does not exist.");
        }
    }
    static update(deltaTime) {
        if (ZoneManager.currentZone) {
            ZoneManager.currentZone.update(deltaTime);
        }
    }
    static render(shader) {
        if (ZoneManager.currentZone) {
            ZoneManager.currentZone.render(shader);
        }
    }
    onMessage(message) {
        if (message.code.indexOf(MESSAGE_ASSET_LOADER_LOADED) !== -1) {
            console.log("ZoneManager::Zone loaded:" + message.code);
            let asset = message.context;
            ZoneManager.loadZone(asset);
        }
    }
    static loadZone(asset) {
        console.log("ZoneManager::Loading zone:" + asset.name);
        let zoneData = asset.data;
        let zoneId;
        if (zoneData.id === undefined) {
            throw new Error("Zone file format exception: Zone id not present.");
        }
        else {
            zoneId = Number(zoneData.id);
        }
        let zoneName;
        if (zoneData.name === undefined) {
            throw new Error("Zone file format exception: Zone name not present.");
        }
        else {
            zoneName = String(zoneData.name);
        }
        let zoneDescription = "";
        if (zoneData.description !== undefined) {
            zoneDescription = String(zoneData.description);
        }
        ZoneManager.currentZone = new Zone(zoneId, zoneName, zoneDescription);
        ZoneManager.currentZone.initialize(zoneData);
        ZoneManager.currentZone.onActivate();
        ZoneManager.currentZone.load();
    }
}
ZoneManager.globalZoneId = -1;
ZoneManager.registeredZones = {};
//# sourceMappingURL=zoneManager.js.map