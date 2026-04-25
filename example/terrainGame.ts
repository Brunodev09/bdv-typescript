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
} from '../BdvEngine';

// ---- Seeded RNG ----

class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed % 2147483647;
    if (this.state <= 0) this.state += 2147483646;
  }

  /** Returns float in [0, 1) */
  next(): number {
    this.state = (this.state * 16807) % 2147483647;
    return (this.state - 1) / 2147483646;
  }

  /** Returns int in [min, max] inclusive */
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

  private hash(x: number, y: number): number {
    return this.perm[(this.perm[x & 255] + y) & 511];
  }

  private lerp(a: number, b: number, t: number): number { return a + t * (b - a); }
  private smooth(t: number): number { return t * t * t * (t * (t * 6 - 15) + 10); }

  get(x: number, y: number): number {
    let xi = Math.floor(x), yi = Math.floor(y);
    let xf = x - xi, yf = y - yi;
    let sx = this.smooth(xf), sy = this.smooth(yf);
    let a = this.hash(xi, yi) / 255;
    let b = this.hash(xi + 1, yi) / 255;
    let c = this.hash(xi, yi + 1) / 255;
    let d = this.hash(xi + 1, yi + 1) / 255;
    return this.lerp(this.lerp(a, b, sx), this.lerp(c, d, sx), sy);
  }

  fbm(x: number, y: number, octaves: number = 4): number {
    let val = 0, amp = 0.5, freq = 1, max = 0;
    for (let i = 0; i < octaves; i++) {
      val += this.get(x * freq, y * freq) * amp;
      max += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return val / max;
  }
}

// ---- Tile indices ----
// Row 0: 0=deep water, 1=water, 2=shallow, 3=shore, 4=wet sand, 5=sand
// Row 1: 6=dark sand, 7=sand-grass, 8=light grass, 9=grass, 10=dark grass, 11=dense grass
// Row 2: 12=light forest, 13=dense forest, 14=dark forest, 15=dirt, 16=rock, 17=light rock
// Row 3: 18=mountain base, 19=mountain, 20=mountain peak, 21=snow-rock, 22=snow, 23=bright snow
// Row 4: 24=dirt road, 25=cobblestone, 26=fortress wall, 27=fortress floor, 28=fortress tower, 29=fortress gate

const TILE_ROAD       = 25;
const TILE_HOUSE      = 26;
const TILE_BARRACKS   = 27;
const TILE_TOWER      = 28;
const TILE_CASTLE     = 29;
const TILE_OAK        = 30;
const TILE_PINE       = 31;
const TILE_AUTUMN     = 32;
const TILE_SNOW_PINE  = 33;
const TILE_ROCK       = 34;
const TILE_BUSH       = 35;

function heightToTile(h: number): number {
  if (h < 0.20) return 0;
  if (h < 0.28) return 1;
  if (h < 0.33) return 2;
  if (h < 0.36) return 3;
  if (h < 0.39) return 4;
  if (h < 0.42) return 5;
  if (h < 0.45) return 7;
  if (h < 0.50) return 8;
  if (h < 0.56) return 9;
  if (h < 0.62) return 10;
  if (h < 0.67) return 11;
  if (h < 0.72) return 12;
  if (h < 0.76) return 13;
  if (h < 0.80) return 16;
  if (h < 0.84) return 19;
  if (h < 0.88) return 20;
  if (h < 0.92) return 21;
  if (h < 0.96) return 22;
  return 23;
}

function isLand(tileIdx: number): boolean {
  return tileIdx >= 4; // anything above shore
}

function isWater(tileIdx: number): boolean {
  return tileIdx <= 3;
}

// ---- Fortress / Road generation ----

interface Fortress {
  x: number;
  y: number;
  size: number; // half-width of the outer wall
}

function spawnFortresses(
  tileMap: TileMap,
  heightMap: Float32Array,
  mapSize: number,
  count: number,
  rng: SeededRng,
): Fortress[] {
  let forts: Fortress[] = [];
  let minDist = 80;
  let attempts = 0;

  while (forts.length < count && attempts < count * 100) {
    attempts++;
    let margin = 30;
    let x = rng.nextInt(margin, mapSize - margin);
    let y = rng.nextInt(margin, mapSize - margin);
    let h = heightMap[y * mapSize + x];

    if (h < 0.42 || h > 0.78) continue;

    let tooClose = false;
    for (let f of forts) {
      let dx = f.x - x, dy = f.y - y;
      if (dx * dx + dy * dy < minDist * minDist) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    let size = rng.nextInt(5, 9); // half-width varies per fortress
    forts.push({ x, y, size });
  }

  return forts;
}

function placeFortress(terrainMap: TileMap, overlayMap: TileMap, fx: number, fy: number, half: number, rng: SeededRng): void {
  // Place the main castle on the overlay
  overlayMap.setTile(fx, fy, TILE_CASTLE);

  // Scatter houses and towers on the overlay
  let buildingCount = rng.nextInt(3, Math.max(4, half));
  for (let i = 0; i < buildingCount; i++) {
    let dx = rng.nextInt(-half, half);
    let dy = rng.nextInt(-half, half);
    if (dx === 0 && dy === 0) continue;

    let tx = fx + dx, ty = fy + dy;
    let terrain = terrainMap.getTile(tx, ty);
    if (isWater(terrain)) continue;
    if (overlayMap.getTile(tx, ty) >= 0) continue; // already has a building

    let dist = Math.sqrt(dx * dx + dy * dy);
    let type: number;
    if (dist < half * 0.4) {
      type = rng.next() > 0.5 ? TILE_BARRACKS : TILE_TOWER;
    } else {
      type = TILE_HOUSE;
    }
    overlayMap.setTile(tx, ty, type);
  }
}

function placeRoadTile(tileMap: TileMap, x: number, y: number): void {
  let current = tileMap.getTile(x, y);
  if (current === TILE_HOUSE || current === TILE_BARRACKS ||
      current === TILE_TOWER || current === TILE_CASTLE || isWater(current)) return;
  tileMap.setTile(x, y, TILE_ROAD);
}

function drawRoad(tileMap: TileMap, x0: number, y0: number, x1: number, y1: number, rng: SeededRng): void {
  // L-shaped road: horizontal first then vertical, or vice versa (random)
  let horizontalFirst = rng.next() > 0.5;

  let x = x0, y = y0;

  if (horizontalFirst) {
    // Horizontal leg
    let sx = x0 < x1 ? 1 : -1;
    while (x !== x1) {
      placeRoadTile(tileMap, x, y);
      x += sx;
    }
    // Vertical leg
    let sy = y0 < y1 ? 1 : -1;
    while (y !== y1) {
      placeRoadTile(tileMap, x, y);
      y += sy;
    }
  } else {
    // Vertical leg
    let sy = y0 < y1 ? 1 : -1;
    while (y !== y1) {
      placeRoadTile(tileMap, x, y);
      y += sy;
    }
    // Horizontal leg
    let sx = x0 < x1 ? 1 : -1;
    while (x !== x1) {
      placeRoadTile(tileMap, x, y);
      x += sx;
    }
  }
  placeRoadTile(tileMap, x1, y1);
}

function connectFortresses(
  tileMap: TileMap,
  forts: Fortress[],
  rng: SeededRng,
): void {
  if (forts.length < 2) return;

  for (let i = 0; i < forts.length; i++) {
    // 30% chance this fortress has no roads at all
    if (rng.next() < 0.3) continue;

    let distances: { idx: number; dist: number }[] = [];
    for (let j = 0; j < forts.length; j++) {
      if (i === j) continue;
      let dx = forts[i].x - forts[j].x;
      let dy = forts[i].y - forts[j].y;
      distances.push({ idx: j, dist: Math.sqrt(dx * dx + dy * dy) });
    }
    distances.sort((a, b) => a.dist - b.dist);

    // Try to connect to 1-2 nearest, each with a 60% chance
    let maxConnections = rng.nextInt(1, 2);
    for (let c = 0; c < Math.min(maxConnections, distances.length); c++) {
      if (rng.next() < 0.4) continue; // skip this connection
      let target = forts[distances[c].idx];
      drawRoad(tileMap, forts[i].x, forts[i].y, target.x, target.y, rng);
    }
  }
}

// ---- Tile names ----

const TILE_NAMES: { [idx: number]: string } = {
  0: "Deep Water", 1: "Water", 2: "Shallow", 3: "Shore",
  4: "Wet Sand", 5: "Sand", 6: "Dark Sand", 7: "Sand-Grass",
  8: "Light Grass", 9: "Grass", 10: "Dark Grass", 11: "Dense Grass",
  12: "Light Forest", 13: "Dense Forest", 14: "Dark Forest", 15: "Dirt",
  16: "Rock", 17: "Light Rock", 18: "Mountain Base", 19: "Mountain",
  20: "Mountain Peak", 21: "Snow Rock", 22: "Snow", 23: "Bright Snow",
  24: "Dirt Road", 25: "Cobblestone", 26: "House", 27: "Barracks",
  28: "Tower", 29: "Castle",
  30: "Oak Tree", 31: "Pine Tree", 32: "Autumn Tree", 33: "Snow Pine",
  34: "Rock", 35: "Bush",
};

function tileIndexName(idx: number): string {
  return TILE_NAMES[idx] || `Tile ${idx}`;
}

// ---- Game ----

const MAP_SIZE = 1024;
const TILE_RENDER_SIZE = 64;
const NOISE_SCALE = 0.006;
const FORTRESS_COUNT = 60;

export class TerrainGame extends Game implements IMessageHandler {
  private tileSet!: TileSet;
  private tileMap!: TileMap;
  private overlayMap!: TileMap; // buildings layer (rendered on top of terrain)
  private heightMap!: Float32Array;

  private camX: number = MAP_SIZE * TILE_RENDER_SIZE / 2;
  private camY: number = MAP_SIZE * TILE_RENDER_SIZE / 2;
  private zoom: number = 1;
  private camSpeed: number = 0.6;

  private coordsText!: HTMLDivElement;
  private tileInfoText!: HTMLDivElement;
  private seed: number = 54321;

  // Hover / selection
  private hoverTileX: number = -1;
  private hoverTileY: number = -1;
  private selectedTileX: number = -1;
  private selectedTileY: number = -1;

  init(): void {
    this.tileSet = new TileSet({
      imagePath: "assets/textures/terrain.png",
      tileWidth: 64,
      tileHeight: 64,
      materialName: "terrain_tiles",
    });
    this.tileSet.filtering = 'nearest';

    let lodTileSet = new TileSet({
      imagePath: "assets/textures/terrain_lod.png",
      tileWidth: 16,
      tileHeight: 16,
      materialName: "terrain_lod",
    });

    this.tileMap = new TileMap(this.tileSet, MAP_SIZE, MAP_SIZE, TILE_RENDER_SIZE);
    this.tileMap.lodTileSet = lodTileSet;
    // Roads must always render, even when zoomed out
    this.tileMap.importantTiles.add(TILE_ROAD);

    // Overlay layer for buildings (same tileset, rendered on top)
    this.overlayMap = new TileMap(this.tileSet, MAP_SIZE, MAP_SIZE, TILE_RENDER_SIZE);
    this.overlayMap.heightScale = 0;
    this.overlayMap.shadowStrength = 0;
    // Buildings are important — never skip them
    this.overlayMap.importantTiles.add(TILE_HOUSE);
    this.overlayMap.importantTiles.add(TILE_BARRACKS);
    this.overlayMap.importantTiles.add(TILE_TOWER);
    this.overlayMap.importantTiles.add(TILE_CASTLE);
    // Trees/rocks are decorative — can be skipped at extreme zoom
    // (not added to importantTiles)

    this.heightMap = new Float32Array(MAP_SIZE * MAP_SIZE);

    this.generateWorld(this.seed);

    // UI
    let panel = UI.panel(10, 40, {
      width: "280px",
      padding: "10px",
      background: "rgba(0,0,0,0.7)",
      borderRadius: "6px",
    });

    UI.heading(panel, "Terrain Generator", { color: "#4af" });
    UI.text(panel, `${MAP_SIZE}×${MAP_SIZE} tiles, ${FORTRESS_COUNT} fortresses`);
    UI.text(panel, "WASD to move, scroll to zoom");
    UI.spacer(panel);

    let seedRow = UI.row(panel);
    UI.text(seedRow, "Seed:", { marginRight: "4px" });
    let seedInput = UI.input(seedRow, String(this.seed), () => {}, { width: "80px" });
    seedInput.value = String(this.seed);
    UI.button(seedRow, "Generate", () => {
      let val = parseInt(seedInput.value);
      if (!isNaN(val) && val > 0) {
        this.seed = val;
        this.generateWorld(this.seed);
      }
    });

    UI.button(panel, "Random Seed", () => {
      this.seed = Math.floor(Math.random() * 999999) + 1;
      seedInput.value = String(this.seed);
      this.generateWorld(this.seed);
    });

    UI.spacer(panel);
    this.coordsText = UI.text(panel, "", { fontSize: "12px", fontFamily: "monospace" });
    this.tileInfoText = UI.text(panel, "", { fontSize: "12px", fontFamily: "monospace" });

    // Listen for mouse clicks to select tiles
    Message.subscribe("MOUSE_DOWN", this);
  }

  public onMessage(message: Message): void {
    if (message.code === "MOUSE_DOWN") {
      // Select the currently hovered tile
      if (this.hoverTileX >= 0 && this.hoverTileY >= 0) {
        this.selectedTileX = this.hoverTileX;
        this.selectedTileY = this.hoverTileY;
      }
    }
  }

  private generateWorld(seed: number): void {
    let noise = new Noise(seed);
    let rng = new SeededRng(seed);

    // Clear overlay
    this.overlayMap.fill(-1);

    // Generate heightmap — lower island falloff = more land
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        let dx = (x / MAP_SIZE - 0.5) * 2;
        let dy = (y / MAP_SIZE - 0.5) * 2;
        let distSq = dx * dx + dy * dy;
        let island = 1 - Math.min(1, distSq * 0.8); // was 1.3, now 0.8 = much more land

        let h = noise.fbm(x * NOISE_SCALE, y * NOISE_SCALE, 6) * island;
        // Boost land: push values up so less water
        h = h * 0.85 + 0.15;

        // Latitude-based biome: snow at north and south poles
        let latitude = Math.abs(dy); // 0 at equator, 1 at poles
        let snowLine = 0.7; // latitude where snow starts
        if (latitude > snowLine && h > 0.30) {
          // Blend towards snow based on how far past the snow line
          let snowBlend = (latitude - snowLine) / (1.0 - snowLine);
          snowBlend = snowBlend * snowBlend; // ease in
          h = h + snowBlend * (1.0 - h) * 0.8; // push height toward snow range
        }

        this.heightMap[y * MAP_SIZE + x] = h;
        this.tileMap.setTile(x, y, heightToTile(h));
        this.tileMap.setHeight(x, y, h);
      }
    }

    // Scatter trees and rocks based on biome
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        let h = this.heightMap[y * MAP_SIZE + x];
        let tile = this.tileMap.getTile(x, y);
        if (isWater(tile)) continue;

        let latitude = Math.abs((y / MAP_SIZE - 0.5) * 2);
        let roll = rng.next();

        // Grass biomes: oak trees and bushes
        if (tile >= 8 && tile <= 11) {
          if (roll < 0.08) {
            this.overlayMap.setTile(x, y, rng.next() > 0.3 ? TILE_OAK : TILE_BUSH);
          }
        }
        // Forest biomes: dense trees
        else if (tile >= 12 && tile <= 14) {
          if (roll < 0.25) {
            this.overlayMap.setTile(x, y, rng.next() > 0.4 ? TILE_PINE : TILE_OAK);
          }
        }
        // Sand/dirt: occasional rocks
        else if (tile >= 4 && tile <= 7) {
          if (roll < 0.02) {
            this.overlayMap.setTile(x, y, TILE_ROCK);
          }
        }
        // Mountain/rock: rocks
        else if (tile >= 16 && tile <= 20) {
          if (roll < 0.06) {
            this.overlayMap.setTile(x, y, TILE_ROCK);
          }
        }
        // Snow: snow pines near the snow line, nothing deep in snow
        else if (tile >= 21 && tile <= 23) {
          if (latitude < 0.85 && roll < 0.05) {
            this.overlayMap.setTile(x, y, TILE_SNOW_PINE);
          }
        }
      }
    }

    // Spawn fortresses on land
    let forts = spawnFortresses(this.tileMap, this.heightMap, MAP_SIZE, FORTRESS_COUNT, rng);

    // Place buildings on the overlay layer
    for (let f of forts) {
      placeFortress(this.tileMap, this.overlayMap, f.x, f.y, f.size, rng);
    }

    // Roads go on the terrain layer (they're ground-level, opaque)
    connectFortresses(this.tileMap, forts, rng);

    // Center camera
    this.camX = MAP_SIZE * TILE_RENDER_SIZE / 2;
    this.camY = MAP_SIZE * TILE_RENDER_SIZE / 2;
  }

  update(deltaTime: number): void {
    let speed = this.camSpeed * deltaTime / this.zoom;

    if (InputManager.isKeyDown(Keys.W) || InputManager.isKeyDown(Keys.UP))
      this.camY -= speed;
    if (InputManager.isKeyDown(Keys.S) || InputManager.isKeyDown(Keys.DOWN))
      this.camY += speed;
    if (InputManager.isKeyDown(Keys.A) || InputManager.isKeyDown(Keys.LEFT))
      this.camX -= speed;
    if (InputManager.isKeyDown(Keys.D) || InputManager.isKeyDown(Keys.RIGHT))
      this.camX += speed;

    let wheel = InputManager.consumeWheelDelta();
    if (wheel !== 0) {
      this.zoom = Math.max(0.02, Math.min(12, this.zoom * (wheel > 0 ? 0.85 : 1.15)));
    }

    let worldSize = MAP_SIZE * TILE_RENDER_SIZE;
    this.camX = Math.max(0, Math.min(worldSize, this.camX));
    this.camY = Math.max(0, Math.min(worldSize, this.camY));

    // Convert mouse screen position to tile coordinates
    let mouse = InputManager.getMousePosition();
    let screenW = window.innerWidth;
    let screenH = window.innerHeight;
    let offsetX = screenW / 2 - this.camX * this.zoom;
    let offsetY = screenH / 2 - this.camY * this.zoom;
    let ts = TILE_RENDER_SIZE * this.zoom;

    this.hoverTileX = Math.floor((mouse.vx - offsetX) / ts);
    this.hoverTileY = Math.floor((mouse.vy - offsetY) / ts);

    // Clamp to map bounds
    if (this.hoverTileX < 0 || this.hoverTileX >= MAP_SIZE ||
        this.hoverTileY < 0 || this.hoverTileY >= MAP_SIZE) {
      this.hoverTileX = -1;
      this.hoverTileY = -1;
    }

    // Update UI
    let camTileX = Math.floor(this.camX / TILE_RENDER_SIZE);
    let camTileY = Math.floor(this.camY / TILE_RENDER_SIZE);
    UI.setText(this.coordsText,
      `Cam: ${camTileX},${camTileY} | Zoom: ${this.zoom.toFixed(1)}x | Seed: ${this.seed}`);

    // Tile info
    if (this.hoverTileX >= 0) {
      let tileIdx = this.tileMap.getTile(this.hoverTileX, this.hoverTileY);
      let h = this.heightMap[this.hoverTileY * MAP_SIZE + this.hoverTileX] || 0;
      let tileName = tileIndexName(tileIdx);
      UI.setText(this.tileInfoText,
        `Hover: ${this.hoverTileX},${this.hoverTileY} | ${tileName} (h:${h.toFixed(2)})`);
    } else {
      UI.setText(this.tileInfoText, "");
    }
  }

  render(shader: Shader): void {
    let screenW = window.innerWidth;
    let screenH = window.innerHeight;

    // Render terrain base layer
    this.tileMap.render(this.camX, this.camY, this.zoom, screenW, screenH);

    // Render building overlay on top (same camera)
    this.overlayMap.render(this.camX, this.camY, this.zoom, screenW, screenH);

    let ts = TILE_RENDER_SIZE * this.zoom;
    let offsetX = screenW / 2 - this.camX * this.zoom;
    let offsetY = screenH / 2 - this.camY * this.zoom;

    let hs = this.tileMap.heightScale * this.zoom;

    // Draw selection highlight (yellow)
    if (this.selectedTileX >= 0) {
      let selH = this.tileMap.getHeight(this.selectedTileX, this.selectedTileY);
      let sx = Math.round(this.selectedTileX * ts + offsetX);
      let sy = Math.round(this.selectedTileY * ts + offsetY - selH * hs);
      let sw = Math.round((this.selectedTileX + 1) * ts + offsetX) - sx;
      let sh = Math.round((this.selectedTileY + 1) * ts + offsetY - selH * hs) - sy;
      Draw.rectOutline(sx, sy, sw, sh, new Color(255, 255, 0, 255));
      Draw.rectOutline(sx + 1, sy + 1, sw - 2, sh - 2, new Color(255, 255, 0, 120));
    }

    // Draw hover highlight (white)
    if (this.hoverTileX >= 0) {
      let hovH = this.tileMap.getHeight(this.hoverTileX, this.hoverTileY);
      let hx = Math.round(this.hoverTileX * ts + offsetX);
      let hy = Math.round(this.hoverTileY * ts + offsetY - hovH * hs);
      let hw = Math.round((this.hoverTileX + 1) * ts + offsetX) - hx;
      let hh = Math.round((this.hoverTileY + 1) * ts + offsetY - hovH * hs) - hy;
      Draw.rectOutline(hx, hy, hw, hh, new Color(255, 255, 255, 200));
    }

    Draw.flush(shader);
  }
}
