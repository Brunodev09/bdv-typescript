import { IMessageHandler } from '../com/IMessageHandler';
import { Message } from '../com/message';
import { MESSAGE_ASSET_LOADER_LOADED, AssetManager } from '../assets/assetManager';
import { Zone } from './zone';
import { JsonAsset } from '../assets/jsonAssetLoader';
import { Shader } from '../gl/shader';

export class ZoneManager implements IMessageHandler {
  private static globalZoneId: number = -1;
  // private static zones: { [id: number]: Zone } = {};
  private static registeredZones: { [id: number]: string } = {};
  private static currentZone: Zone | undefined;

  private static instance: ZoneManager;

  private constructor() {}

  public static init(): void {
    ZoneManager.instance = new ZoneManager();
    // Temporarily register the test zone.
    ZoneManager.registeredZones[0] = "assets/zones/testZone.json";
  }

  public static changeZone(zoneId: number): void {
    if (ZoneManager.currentZone) {
      ZoneManager.currentZone.onDeactivate();
      ZoneManager.currentZone.unload();
      ZoneManager.currentZone = undefined;
    }

    if (ZoneManager.registeredZones[zoneId] !== undefined) {
      if (AssetManager.isLoaded(ZoneManager.registeredZones[zoneId])) {
        let asset = AssetManager.get(ZoneManager.registeredZones[zoneId]);
        ZoneManager.loadZone(asset);
      } else {
        Message.subscribe(
          MESSAGE_ASSET_LOADER_LOADED +
            "::" +
            ZoneManager.registeredZones[zoneId],
          ZoneManager.instance,
        );
        AssetManager.loadAsset(ZoneManager.registeredZones[zoneId]);
      }
    } else {
      throw new Error("Zone id:" + zoneId.toString() + " does not exist.");
    }
  }

  public static update(deltaTime: number): void {
    if (ZoneManager.currentZone) {
      ZoneManager.currentZone.update(deltaTime);
    }
  }

  public static render(shader: Shader): void {
    if (ZoneManager.currentZone) {
      ZoneManager.currentZone.render(shader);
    }
  }

  public onMessage(message: Message): void {
    if (message.code.indexOf(MESSAGE_ASSET_LOADER_LOADED) !== -1) {
      console.log("ZoneManager::Zone loaded:" + message.code);
      let asset = message.context as JsonAsset;
      ZoneManager.loadZone(asset);
    }
  }

  private static loadZone(asset: JsonAsset): void {
    console.log("ZoneManager::Loading zone:" + asset.name);

    let zoneData = asset.data;
    let zoneId: number;
    if (zoneData.id === undefined) {
      throw new Error("Zone file format exception: Zone id not present.");
    } else {
      zoneId = Number(zoneData.id);
    }

    let zoneName: string;
    if (zoneData.name === undefined) {
      throw new Error("Zone file format exception: Zone name not present.");
    } else {
      zoneName = String(zoneData.name);
    }

    let zoneDescription: string = "";
    if (zoneData.description !== undefined) {
      zoneDescription = String(zoneData.description);
    }

    ZoneManager.currentZone = new Zone(zoneId, zoneName, zoneDescription);
    ZoneManager.currentZone.initialize(zoneData);
    ZoneManager.currentZone.onActivate();
    ZoneManager.currentZone.load();
  }
}
