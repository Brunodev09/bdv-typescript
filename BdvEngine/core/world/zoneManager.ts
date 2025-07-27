namespace BdvEngine {
    export class ZoneManager {
        private static globalZoneId: number = -1;
        private static zones: {[id: number]: Zone} = {};
        private static currentZone: Zone;

        private constructor() {}

        public static createZone(name: string, description: string): number {
            ZoneManager.globalZoneId++;
            let zone = new Zone(ZoneManager.globalZoneId, name, description);
            ZoneManager.zones[ZoneManager.globalZoneId] = zone;

            return ZoneManager.globalZoneId;
        }

        public static createTestZone(): number {
            ZoneManager.globalZoneId++;
            ZoneManager.zones[ZoneManager.globalZoneId] = new ZoneTest(ZoneManager.globalZoneId, 'test', 'simple test zone');

            return ZoneManager.globalZoneId;
        }

        public static changeZone(zoneId: number): void {
            if (ZoneManager.currentZone) {
                ZoneManager.currentZone.onDeactivate();
                ZoneManager.currentZone.unload();
            }

            if (ZoneManager.zones[zoneId]) {
                ZoneManager.currentZone = ZoneManager.zones[zoneId];
                ZoneManager.currentZone.onActivate();
                ZoneManager.currentZone.load();
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
    }
}
