import {
  Game,
  Shader,
  Draw,
  UI,
  Color,
  InputManager,
  Keys,
  IMessageHandler,
  Message,
  TileSet,
  TileMap,
  Material,
  MaterialManager,
  SpriteBatcher,
} from '../BdvEngine';

// ---- Seeded RNG ----

class SeededRng {
  private state: number;
  constructor(seed: number) {
    this.state = seed % 2147483647;
    if (this.state <= 0) this.state += 2147483646;
  }
  next(): number {
    this.state = (this.state * 16807) % 2147483647;
    return (this.state - 1) / 2147483646;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

// ---- Noise ----

class Noise {
  private perm: number[];
  constructor(seed: number) {
    this.perm = [];
    for (let i = 0; i < 256; i++) this.perm[i] = i;
    let rng = new SeededRng(seed);
    for (let i = 255; i > 0; i--) {
      let j = rng.nextInt(0, i);
      [this.perm[i], this.perm[j]] = [this.perm[j], this.perm[i]];
    }
    for (let i = 0; i < 256; i++) this.perm[256 + i] = this.perm[i];
  }
  private hash(x: number, y: number): number { return this.perm[(this.perm[x & 255] + y) & 511]; }
  private lerp(a: number, b: number, t: number): number { return a + t * (b - a); }
  private smooth(t: number): number { return t * t * t * (t * (t * 6 - 15) + 10); }
  get(x: number, y: number): number {
    let xi = Math.floor(x), yi = Math.floor(y);
    let xf = x - xi, yf = y - yi;
    let sx = this.smooth(xf), sy = this.smooth(yf);
    let a = this.hash(xi, yi) / 255, b = this.hash(xi + 1, yi) / 255;
    let c = this.hash(xi, yi + 1) / 255, d = this.hash(xi + 1, yi + 1) / 255;
    return this.lerp(this.lerp(a, b, sx), this.lerp(c, d, sx), sy);
  }
  fbm(x: number, y: number, octaves: number = 4): number {
    let val = 0, amp = 0.5, freq = 1, max = 0;
    for (let i = 0; i < octaves; i++) {
      val += this.get(x * freq, y * freq) * amp;
      max += amp; amp *= 0.5; freq *= 2;
    }
    return val / max;
  }
}

// ---- Tile indices (80-tile tileset) ----

const GRASS_START = 0;
const GRASS_COUNT = 9;
const SAND_1 = 9;
const SAND_2 = 10;
const BEACH = 11;
const WATER = 12;

const MT_START = 13;
const MT_COUNT = 16;

const SNOW_START = 29;
const SNOW_COUNT = 4;

const CHAOS_GND_START = 33;
const CHAOS_GND_COUNT = 7;

const FOREST_TREE_1 = 48;
const FOREST_TREE_2 = 49;
const MAGIC_TREE_1 = 50;
const MAGIC_TREE_2 = 51;
const CHAOS_TREE = 52;
const SNOW_TREE_1 = 53;
const SNOW_TREE_2 = 54;
const SNOW_TREE_3 = 55;

const BUSH_START = 64;
const BUSH_COUNT = 16;

const enum Biome { OCEAN, BEACH_B, DESERT, GRASSLAND, FOREST, MOUNTAIN, SNOW, CHAOS, ENCHANTED }

const BIOME_NAMES = ["Ocean", "Beach", "Desert", "Grassland", "Forest", "Mountain", "Snow", "Chaos", "Enchanted"];

function tileName(idx: number): string {
  if (idx >= GRASS_START && idx < GRASS_START + GRASS_COUNT) return "Grass";
  if (idx === SAND_1) return "Sand";
  if (idx === SAND_2) return "Road";
  if (idx === BEACH) return "Beach";
  if (idx === WATER) return "Water";
  if (idx >= MT_START && idx < MT_START + MT_COUNT) return "Mountain";
  if (idx >= SNOW_START && idx < SNOW_START + SNOW_COUNT) return "Snow";
  if (idx >= CHAOS_GND_START && idx < CHAOS_GND_START + CHAOS_GND_COUNT) return "Chaos";
  if (idx >= 40 && idx <= 47) return "Tree";
  if (idx >= BUSH_START && idx < BUSH_START + BUSH_COUNT) return "Bush";
  return `Tile ${idx}`;
}

// ---- Game ----

const MAP_SIZE = 1024;
const TILE_RENDER_SIZE = 96;
const NOISE_SCALE = 0.006;

// Building tile indices (8x4 grid = 32 tiles)
const BLD_HOUSES_START = 0;   // row 0: houses (8 variants)
const BLD_SHOPS_START = 8;    // row 1: shops/market (8 variants)
const BLD_TOWERS_START = 16;  // row 2: towers (8 variants)
const BLD_CASTLES_START = 24; // row 3: castles (8 variants)

const ROAD_TILE = SAND_2; // use sand_2 so roads are distinguishable from sand_1 desert

interface City {
  x: number;
  y: number;
  size: number;
}

interface Building {
  tileX: number;
  tileY: number;
  spriteCol: number; // column in spritesheet (0-7)
  spriteRow: number; // row in spritesheet (0-7)
}

export class TerrainGame extends Game implements IMessageHandler {
  private tileSet!: TileSet;
  private tileMap!: TileMap;
  private overlayMap!: TileMap;
  private heightMap!: Float32Array;
  private biomeMap!: Uint8Array;
  private buildings: Building[] = [];
  private buildingTexLoaded = false;
  private occupiedTiles: Set<number> = new Set(); // blocked tiles (building + margin)
  private buildingTiles: Set<number> = new Set(); // only tiles with actual buildings

  private camX = MAP_SIZE * TILE_RENDER_SIZE / 2;
  private camY = MAP_SIZE * TILE_RENDER_SIZE / 2;
  private zoom = 0.5;
  private camSpeed = 0.6;

  private coordsText!: HTMLDivElement;
  private tileInfoText!: HTMLDivElement;
  private seed = 54321;

  private hoverTileX = -1;
  private hoverTileY = -1;
  private selectedTileX = -1;
  private selectedTileY = -1;

  init(): void {
    this.tileSet = new TileSet({
      imagePath: "assets/textures/terrain.png",
      tileWidth: 96, tileHeight: 96,
      materialName: "terrain_tiles",
    });

    let lod = new TileSet({
      imagePath: "assets/textures/terrain_lod.png",
      tileWidth: 16, tileHeight: 16,
      materialName: "terrain_lod",
    });

    this.tileMap = new TileMap(this.tileSet, MAP_SIZE, MAP_SIZE, TILE_RENDER_SIZE);
    this.tileMap.lodTileSet = lod;

    this.overlayMap = new TileMap(this.tileSet, MAP_SIZE, MAP_SIZE, TILE_RENDER_SIZE);
    this.overlayMap.heightScale = 0;
    this.overlayMap.shadowStrength = 0;
    // No LOD tileset for overlay — items just disappear when too small
    // No important tiles — everything fades out at extreme zoom

    // Register building texture as a material for SpriteBatcher rendering
    MaterialManager.register(
      new Material("buildings_mat", "assets/textures/buildings_tileset.png", Color.white()),
    );

    this.heightMap = new Float32Array(MAP_SIZE * MAP_SIZE);
    this.biomeMap = new Uint8Array(MAP_SIZE * MAP_SIZE);

    this.generateWorld(this.seed);

    let panel = UI.panel(10, 40, {
      width: "280px", padding: "10px",
      background: "rgba(0,0,0,0.7)", borderRadius: "6px",
    });
    UI.heading(panel, "Bdv World", { color: "#4af" });
    UI.text(panel, `${MAP_SIZE}×${MAP_SIZE} — WASD + scroll`);
    UI.spacer(panel);
    let seedRow = UI.row(panel);
    UI.text(seedRow, "Seed:", { marginRight: "4px" });
    let seedInput = UI.input(seedRow, "", () => {}, { width: "80px" });
    seedInput.value = String(this.seed);
    UI.button(seedRow, "Go", () => {
      let v = parseInt(seedInput.value);
      if (!isNaN(v) && v > 0) { this.seed = v; this.generateWorld(v); }
    });
    UI.button(panel, "Random", () => {
      this.seed = Math.floor(Math.random() * 999999) + 1;
      seedInput.value = String(this.seed);
      this.generateWorld(this.seed);
    });
    UI.spacer(panel);
    this.coordsText = UI.text(panel, "", { fontSize: "12px", fontFamily: "monospace" });
    this.tileInfoText = UI.text(panel, "", { fontSize: "12px", fontFamily: "monospace" });
    Message.subscribe("MOUSE_DOWN", this);
  }

  public onMessage(msg: Message): void {
    if (msg.code === "MOUSE_DOWN" && this.hoverTileX >= 0) {
      this.selectedTileX = this.hoverTileX;
      this.selectedTileY = this.hoverTileY;
    }
  }

  private generateWorld(seed: number): void {
    let noise = new Noise(seed);
    let rng = new SeededRng(seed);
    this.overlayMap.fill(-1);

    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        let dx = (x / MAP_SIZE - 0.5) * 2;
        let dy = (y / MAP_SIZE - 0.5) * 2;
        let island = 1 - Math.min(1, (dx * dx + dy * dy) * 0.8);
        let h = noise.fbm(x * NOISE_SCALE, y * NOISE_SCALE, 6) * island;
        h = h * 0.85 + 0.15;
        let lat = Math.abs(dy);
        if (lat > 0.7 && h > 0.30) {
          let sb = ((lat - 0.7) / 0.3) ** 2;
          h += sb * (1.0 - h) * 0.8;
        }
        this.heightMap[y * MAP_SIZE + x] = h;
      }
    }

    // Collect ALL valid land tiles for biome placement
    let landTiles: [number, number][] = [];
    for (let y = 30; y < MAP_SIZE - 30; y += 3) {
      for (let x = 30; x < MAP_SIZE - 30; x += 3) {
        let h = this.heightMap[y * MAP_SIZE + x];
        if (h > 0.42 && h < 0.78) landTiles.push([x, y]);
      }
    }

    // Shuffle land tiles using RNG
    for (let i = landTiles.length - 1; i > 0; i--) {
      let j = rng.nextInt(0, i);
      [landTiles[i], landTiles[j]] = [landTiles[j], landTiles[i]];
    }

    // Chaos biome — first shuffled land tile (guaranteed to exist if there's any land)
    let chaosCx = landTiles.length > 0 ? landTiles[0][0] : MAP_SIZE / 3;
    let chaosCy = landTiles.length > 0 ? landTiles[0][1] : MAP_SIZE / 3;
    let chaosR = rng.nextInt(25, 45);

    // Enchanted forest — furthest land tile from chaos
    let enchCx = MAP_SIZE / 2, enchCy = MAP_SIZE / 2;
    let bestDist = 0;
    for (let [lx, ly] of landTiles) {
      let d = Math.sqrt((lx - chaosCx) ** 2 + (ly - chaosCy) ** 2);
      if (d > bestDist) {
        bestDist = d;
        enchCx = lx;
        enchCy = ly;
      }
    }
    let enchR = rng.nextInt(20, 35);

    // Use a second noise for consistent grass variant picking (not random per tile)
    let varNoise = new Noise(seed + 500);

    // Helper: pick a grass variant deterministically from position
    const GRASS_VARIANTS = [0, 5, 6, 7]; // row 1 cols 1, 7, 8, 9
    function grassTile(x: number, y: number): number {
      let v = varNoise.get(x * 0.3, y * 0.3);
      return GRASS_START + GRASS_VARIANTS[Math.floor(v * GRASS_VARIANTS.length) % GRASS_VARIANTS.length];
    }
    function snowTile(x: number, y: number): number {
      let v = varNoise.get(x * 0.3 + 100, y * 0.3 + 100);
      return SNOW_START + Math.floor(v * SNOW_COUNT) % SNOW_COUNT;
    }
    function chaosTile(x: number, y: number): number {
      let v = varNoise.get(x * 0.3 + 200, y * 0.3 + 200);
      return CHAOS_GND_START + Math.floor(v * CHAOS_GND_COUNT) % CHAOS_GND_COUNT;
    }
    function sandTile(x: number, y: number): number {
      let v = varNoise.get(x * 0.5 + 300, y * 0.5 + 300);
      return v > 0.5 ? SAND_1 : SAND_2;
    }

    // First pass: assign biomes and ground tiles (NO beach yet)
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        let h = this.heightMap[y * MAP_SIZE + x];
        let lat = Math.abs((y / MAP_SIZE - 0.5) * 2);
        let chD = Math.sqrt((x - chaosCx) ** 2 + (y - chaosCy) ** 2);
        let eD = Math.sqrt((x - enchCx) ** 2 + (y - enchCy) ** 2);

        let biome: Biome;
        let tile: number;

        if (h < 0.38) {
          biome = Biome.OCEAN; tile = WATER;
        } else if (chD < chaosR && h > 0.38) {
          biome = Biome.CHAOS; tile = chaosTile(x, y);
        } else if (eD < enchR && h > 0.38) {
          biome = Biome.ENCHANTED; tile = grassTile(x, y);
        } else if (h > 0.85 || (lat > 0.78 && h > 0.35)) {
          biome = Biome.SNOW; tile = snowTile(x, y);
        } else if (h > 0.65) {
          biome = Biome.MOUNTAIN; tile = grassTile(x, y);
        } else if (h > 0.55) {
          biome = Biome.FOREST; tile = grassTile(x, y);
        } else {
          biome = Biome.GRASSLAND; tile = grassTile(x, y);
        }

        this.biomeMap[y * MAP_SIZE + x] = biome;
        this.tileMap.setTile(x, y, tile);
        this.tileMap.setHeight(x, y, h);
      }
    }

    // Rivers: carve from highlands to ocean
    let riverCount = rng.nextInt(6, 12);
    for (let ri = 0; ri < riverCount; ri++) {
      // Find a start point in highlands
      let sx = 0, sy = 0, found = false;
      for (let attempt = 0; attempt < 300; attempt++) {
        sx = rng.nextInt(20, MAP_SIZE - 20);
        sy = rng.nextInt(20, MAP_SIZE - 20);
        let h = this.heightMap[sy * MAP_SIZE + sx];
        if (h > 0.65 && h < 0.85) { found = true; break; }
      }
      if (!found) continue;

      // Flow downhill until reaching water
      let rx = sx, ry = sy;
      let maxSteps = MAP_SIZE * 2;
      for (let step = 0; step < maxSteps; step++) {
        let h = this.heightMap[ry * MAP_SIZE + rx];
        if (h < 0.35) break; // reached ocean

        // Place river tile (water on terrain)
        this.tileMap.setTile(rx, ry, WATER);
        this.biomeMap[ry * MAP_SIZE + rx] = Biome.OCEAN;

        // Find lowest neighbor
        let bestH = h;
        let bestX = rx, bestY = ry;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            let nx = rx + dx, ny = ry + dy;
            if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE) continue;
            let nh = this.heightMap[ny * MAP_SIZE + nx];
            if (nh < bestH) {
              bestH = nh;
              bestX = nx;
              bestY = ny;
            }
          }
        }

        if (bestX === rx && bestY === ry) {
          // Stuck — nudge randomly downhill-ish
          rx += rng.nextInt(-1, 1);
          ry += rng.nextInt(-1, 1);
          rx = Math.max(1, Math.min(MAP_SIZE - 2, rx));
          ry = Math.max(1, Math.min(MAP_SIZE - 2, ry));
        } else {
          rx = bestX;
          ry = bestY;
        }
      }
    }

    // Overlay: trees, mountains, props per biome
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        let b = this.biomeMap[y * MAP_SIZE + x];
        let r = rng.next();

        if (b === Biome.FOREST) {
          if (r < 0.15) this.overlayMap.setTile(x, y, rng.next() > 0.5 ? FOREST_TREE_1 : FOREST_TREE_2);
          else if (r < 0.18) this.overlayMap.setTile(x, y, BUSH_START + rng.nextInt(0, 7));
        } else if (b === Biome.ENCHANTED) {
          if (r < 0.20) this.overlayMap.setTile(x, y, rng.next() > 0.5 ? MAGIC_TREE_1 : MAGIC_TREE_2);
          else if (r < 0.25) this.overlayMap.setTile(x, y, BUSH_START + rng.nextInt(8, 15));
        } else if (b === Biome.CHAOS) {
          if (r < 0.12) this.overlayMap.setTile(x, y, CHAOS_TREE);
          else if (r < 0.16) this.overlayMap.setTile(x, y, BUSH_START + rng.nextInt(0, BUSH_COUNT - 1));
        } else if (b === Biome.SNOW) {
          if (r < 0.06) this.overlayMap.setTile(x, y, SNOW_TREE_1 + rng.nextInt(0, 2));
          else if (r < 0.08) this.overlayMap.setTile(x, y, BUSH_START + rng.nextInt(0, BUSH_COUNT - 1));
        } else if (b === Biome.MOUNTAIN) {
          if (r < 0.10) this.overlayMap.setTile(x, y, MT_START + rng.nextInt(0, MT_COUNT - 1));
          else if (r < 0.13) this.overlayMap.setTile(x, y, BUSH_START + rng.nextInt(0, BUSH_COUNT - 1));
        } else if (b === Biome.GRASSLAND) {
          if (r < 0.02) this.overlayMap.setTile(x, y, rng.next() > 0.5 ? FOREST_TREE_1 : FOREST_TREE_2);
          else if (r < 0.03) this.overlayMap.setTile(x, y, BUSH_START + rng.nextInt(0, 7));
        }
      }
    }

    // Spawn cities on grassland/forest
    this.buildings = [];
    this.occupiedTiles.clear();
    this.buildingTiles.clear();
    let cities: City[] = [];
    let cityCount = rng.nextInt(15, 30);
    let cityMinDist = 60;

    for (let attempt = 0; attempt < cityCount * 50 && cities.length < cityCount; attempt++) {
      let cx = rng.nextInt(30, MAP_SIZE - 30);
      let cy = rng.nextInt(30, MAP_SIZE - 30);
      let b = this.biomeMap[cy * MAP_SIZE + cx];
      if (b !== Biome.GRASSLAND && b !== Biome.FOREST) continue;

      let tooClose = false;
      for (let c of cities) {
        if (Math.sqrt((c.x - cx) ** 2 + (c.y - cy) ** 2) < cityMinDist) {
          tooClose = true; break;
        }
      }
      if (tooClose) continue;

      let size = rng.nextInt(3, 7);
      cities.push({ x: cx, y: cy, size });

      // Each building occupies a 5x5 tile area
      let BLDG_FOOTPRINT = 5;
      let placeBuilding = (bx: number, by: number, col: number, row: number): boolean => {
        if (bx < 1 || by < 1 || bx + BLDG_FOOTPRINT >= MAP_SIZE || by + BLDG_FOOTPRINT >= MAP_SIZE) return false;

        // Check ENTIRE footprint is free and on land
        for (let ddy = 0; ddy < BLDG_FOOTPRINT; ddy++)
          for (let ddx = 0; ddx < BLDG_FOOTPRINT; ddx++) {
            let tx = bx + ddx, ty = by + ddy;
            if (this.occupiedTiles.has(ty * MAP_SIZE + tx)) return false;
            let tb = this.biomeMap[ty * MAP_SIZE + tx];
            if (tb === Biome.OCEAN || tb === Biome.BEACH_B) return false;
          }

        this.buildings.push({ tileX: bx, tileY: by, spriteCol: col, spriteRow: row });

        // Mark actual building footprint
        for (let ddy = 0; ddy < BLDG_FOOTPRINT; ddy++)
          for (let ddx = 0; ddx < BLDG_FOOTPRINT; ddx++)
            this.buildingTiles.add((by + ddy) * MAP_SIZE + (bx + ddx));

        // Mark footprint + 1-tile margin as occupied, clear trees/bushes
        for (let ddy = -1; ddy <= BLDG_FOOTPRINT; ddy++)
          for (let ddx = -1; ddx <= BLDG_FOOTPRINT; ddx++) {
            let tx = bx + ddx, ty = by + ddy;
            if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE) continue;
            this.occupiedTiles.add(ty * MAP_SIZE + tx);
            this.overlayMap.setTile(tx, ty, -1);
          }
        return true;
      };

      // Center: castle
      placeBuilding(cx, cy, rng.nextInt(0, 7), 3);

      // Surrounding buildings
      let buildCount = rng.nextInt(4, size * 3);
      for (let bi = 0; bi < buildCount; bi++) {
        let dx = rng.nextInt(-size, size);
        let dy = rng.nextInt(-size, size);
        // Snap to 6-tile grid so buildings never overlap (5x5 footprint + margin)
        let bx = cx + Math.round(dx / 6) * 6;
        let by = cy + Math.round(dy / 6) * 6;
        if (bx < 2 || bx >= MAP_SIZE - 2 || by < 2 || by >= MAP_SIZE - 2) continue;

        let dist = Math.sqrt(dx * dx + dy * dy);
        let row: number;
        if (dist < size * 0.4) {
          row = rng.nextInt(1, 2); // shops or towers
        } else {
          row = 0; // houses
        }
        placeBuilding(bx, by, rng.nextInt(0, 7), row);
      }
    }

    // Connect cities with dirt roads
    for (let i = 0; i < cities.length; i++) {
      let distances: { idx: number; dist: number }[] = [];
      for (let j = 0; j < cities.length; j++) {
        if (i === j) continue;
        let dx = cities[i].x - cities[j].x;
        let dy = cities[i].y - cities[j].y;
        distances.push({ idx: j, dist: Math.sqrt(dx * dx + dy * dy) });
      }
      distances.sort((a, b) => a.dist - b.dist);

      if (rng.next() < 0.3) continue;
      let connections = rng.nextInt(1, 2);
      for (let c = 0; c < Math.min(connections, distances.length); c++) {
        if (rng.next() < 0.3) continue;
        let target = cities[distances[c].idx];
        let horizontalFirst = rng.next() > 0.5;

        let x = cities[i].x, y = cities[i].y;
        let tx = target.x, ty = target.y;

        if (horizontalFirst) {
          let sx = x < tx ? 1 : -1;
          while (x !== tx) {
            if (this.biomeMap[y * MAP_SIZE + x] !== Biome.OCEAN && !this.occupiedTiles.has(y * MAP_SIZE + x)) {
              this.overlayMap.setTile(x, y, ROAD_TILE);
            }
            x += sx;
          }
          let sy = y < ty ? 1 : -1;
          while (y !== ty) {
            if (this.biomeMap[y * MAP_SIZE + x] !== Biome.OCEAN && !this.occupiedTiles.has(y * MAP_SIZE + x)) {
              this.overlayMap.setTile(x, y, ROAD_TILE);
            }
            y += sy;
          }
        } else {
          let sy = y < ty ? 1 : -1;
          while (y !== ty) {
            if (this.biomeMap[y * MAP_SIZE + x] !== Biome.OCEAN && !this.occupiedTiles.has(y * MAP_SIZE + x)) {
              this.overlayMap.setTile(x, y, ROAD_TILE);
            }
            y += sy;
          }
          let sx = x < tx ? 1 : -1;
          while (x !== tx) {
            if (this.biomeMap[y * MAP_SIZE + x] !== Biome.OCEAN && !this.occupiedTiles.has(y * MAP_SIZE + x)) {
              this.overlayMap.setTile(x, y, ROAD_TILE);
            }
            x += sx;
          }
        }
      }
    }

    this.camX = MAP_SIZE * TILE_RENDER_SIZE / 2;
    this.camY = MAP_SIZE * TILE_RENDER_SIZE / 2;
  }

  update(deltaTime: number): void {
    let speed = this.camSpeed * deltaTime / this.zoom;
    if (InputManager.isKeyDown(Keys.W) || InputManager.isKeyDown(Keys.UP)) this.camY -= speed;
    if (InputManager.isKeyDown(Keys.S) || InputManager.isKeyDown(Keys.DOWN)) this.camY += speed;
    if (InputManager.isKeyDown(Keys.A) || InputManager.isKeyDown(Keys.LEFT)) this.camX -= speed;
    if (InputManager.isKeyDown(Keys.D) || InputManager.isKeyDown(Keys.RIGHT)) this.camX += speed;

    let wheel = InputManager.consumeWheelDelta();
    if (wheel !== 0) this.zoom = Math.max(0.005, Math.min(12, this.zoom * (wheel > 0 ? 0.85 : 1.15)));

    let ws = MAP_SIZE * TILE_RENDER_SIZE;
    this.camX = Math.max(0, Math.min(ws, this.camX));
    this.camY = Math.max(0, Math.min(ws, this.camY));

    let mouse = InputManager.getMousePosition();
    let sw = window.innerWidth, sh = window.innerHeight;
    let ox = sw / 2 - this.camX * this.zoom, oy = sh / 2 - this.camY * this.zoom;
    let ts = TILE_RENDER_SIZE * this.zoom;

    this.hoverTileX = Math.floor((mouse.vx - ox) / ts);
    this.hoverTileY = Math.floor((mouse.vy - oy) / ts);
    if (this.hoverTileX < 0 || this.hoverTileX >= MAP_SIZE || this.hoverTileY < 0 || this.hoverTileY >= MAP_SIZE) {
      this.hoverTileX = -1; this.hoverTileY = -1;
    }

    UI.setText(this.coordsText, `Zoom: ${this.zoom.toFixed(2)}x | Seed: ${this.seed}`);

    if (this.hoverTileX >= 0) {
      let ti = this.tileMap.getTile(this.hoverTileX, this.hoverTileY);
      let oi = this.overlayMap.getTile(this.hoverTileX, this.hoverTileY);
      let b = this.biomeMap[this.hoverTileY * MAP_SIZE + this.hoverTileX];
      let ol = oi >= 0 ? ` + ${tileName(oi)}` : "";
      let hasBuilding = this.buildingTiles.has(this.hoverTileY * MAP_SIZE + this.hoverTileX);
      let bldInfo = hasBuilding ? " [Building]" : "";
      UI.setText(this.tileInfoText, `${this.hoverTileX},${this.hoverTileY} | ${BIOME_NAMES[b]} | ${tileName(ti)}${ol}${bldInfo}`);
    } else {
      UI.setText(this.tileInfoText, "");
    }
  }

  render(shader: Shader): void {
    let sw = window.innerWidth, sh = window.innerHeight;
    this.tileMap.render(this.camX, this.camY, this.zoom, sw, sh);
    this.overlayMap.render(this.camX, this.camY, this.zoom, sw, sh);

    // Render buildings (1024x512, 8 cols x 4 rows, 128x128 cells, transparent bg)
    let bldMat = MaterialManager.get("buildings_mat");
    if (bldMat && bldMat.diffTexture && bldMat.diffTexture.textureIsLoaded) {
      let ox = sw / 2 - this.camX * this.zoom;
      let oy = sh / 2 - this.camY * this.zoom;
      let ts = TILE_RENDER_SIZE * this.zoom;

      // Each building: 3 tiles wide and tall (square cells)
      let bSize = ts * 3;

      for (let b of this.buildings) {
        let sx = b.tileX * ts + ox;
        let sy = b.tileY * ts + oy;

        if (sx + bSize < 0 || sx > sw || sy + bSize < 0 || sy > sh) continue;

        SpriteBatcher.drawTexture(bldMat, b.spriteCol, b.spriteRow, 8, 4, sx, sy, bSize, bSize);
      }
    }

    let ts2 = TILE_RENDER_SIZE * this.zoom;
    let ox2 = sw / 2 - this.camX * this.zoom, oy2 = sh / 2 - this.camY * this.zoom;
    let hs = this.tileMap.heightScale * this.zoom;

    if (this.selectedTileX >= 0) {
      let sx = Math.floor(this.selectedTileX * ts2 + ox2);
      let sy = Math.floor(this.selectedTileY * ts2 + oy2);
      let sw2 = Math.floor((this.selectedTileX + 1) * ts2 + ox2) - sx;
      let sh2 = Math.floor((this.selectedTileY + 1) * ts2 + oy2) - sy;
      Draw.rectOutline(sx, sy, sw2, sh2, new Color(255, 255, 0, 255));
    }

    // Hover highlight
    if (this.hoverTileX >= 0) {
      let mouse = InputManager.getMousePosition();
      let tileScreenX = Math.floor((mouse.vx - ox2) / ts2) * ts2 + ox2;
      let tileScreenY = Math.floor((mouse.vy - oy2) / ts2) * ts2 + oy2;
      Draw.rect(tileScreenX, tileScreenY, ts2, 2, Color.white());
      Draw.rect(tileScreenX, tileScreenY + ts2 - 2, ts2, 2, Color.white());
      Draw.rect(tileScreenX, tileScreenY, 2, ts2, Color.white());
      Draw.rect(tileScreenX + ts2 - 2, tileScreenY, 2, ts2, Color.white());
    }
  }
}
