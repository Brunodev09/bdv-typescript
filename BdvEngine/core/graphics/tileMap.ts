import { gl } from '../gl/gl';
import { Color } from './color';
import { SpriteBatcher } from './spriteBatcher';
import { Material } from './material';
import { MaterialManager } from './materialManager';

export interface TileSetConfig {
  imagePath: string;
  tileWidth: number;
  tileHeight: number;
  materialName: string;
}

interface TileUV {
  u0: number; v0: number;
  u1: number; v1: number;
}

export class TileSet {
  public material: Material;
  public tileWidth: number;
  public tileHeight: number;

  private uvs: TileUV[] = [];
  private cols: number = 0;
  private rows: number = 0;
  private ready: boolean = false;

  constructor(config: TileSetConfig) {
    this.tileWidth = config.tileWidth;
    this.tileHeight = config.tileHeight;

    this.material = new Material(config.materialName, config.imagePath, Color.white());
    MaterialManager.register(this.material);
  }

  /** Set texture filtering. Call after texture loads. 'linear' for smooth terrain, 'nearest' for pixel art. */
  public filtering: 'nearest' | 'linear' = 'nearest';

  public computeUVs(): boolean {
    if (this.ready) return true;

    let tex = this.material.diffTexture;
    if (!tex || !tex.textureIsLoaded) return false;

    // Apply filtering preference
    if (this.filtering === 'linear') {
      tex.bind();
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    let texW = tex.textureWidth;
    let texH = tex.textureHeight;
    this.cols = Math.floor(texW / this.tileWidth);
    this.rows = Math.floor(texH / this.tileHeight);

    this.uvs = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        let u0 = (c * this.tileWidth) / texW;
        let v0 = (r * this.tileHeight) / texH;
        let u1 = ((c + 1) * this.tileWidth) / texW;
        let v1 = ((r + 1) * this.tileHeight) / texH;
        this.uvs.push({ u0, v0, u1, v1 });
      }
    }
    this.ready = true;
    return true;
  }

  public get tileCount(): number { return this.uvs.length; }
  public get isReady(): boolean { return this.ready; }

  public getUV(tileIndex: number): TileUV | null {
    if (tileIndex < 0 || tileIndex >= this.uvs.length) return null;
    return this.uvs[tileIndex];
  }
}

/**
 * TileMap with layered 2.5D perspective.
 *
 * Each tile has an index and an elevation value (0-1).
 * Higher tiles shift upward, creating a depth illusion.
 * South-facing elevation drops render a darkened cliff face.
 * Tiles are rendered back-to-front (north-to-south) for correct overlap.
 */
export class TileMap {
  public tileSet: TileSet;

  private mapWidth: number;
  private mapHeight: number;
  private tiles: Int16Array;
  private heights: Float32Array;

  private renderTileSize: number;

  /** Pixels of vertical offset per unit of height. Controls how "tall" the terrain looks. */
  public heightScale: number = 6;

  /** How dark cliff faces get (0 = no shadow, 1 = black). */
  public shadowStrength: number = 0.45;

  /** Optional low-detail tileset used when zoomed out. Same tile indices. */
  public lodTileSet: TileSet | null = null;

  /** Tile screen size threshold below which the LOD tileset is used. */
  public lodThreshold: number = 6;

  /** Tile indices that are always rendered, never skipped by LOD. */
  public importantTiles: Set<number> = new Set();

  constructor(tileSet: TileSet, mapWidth: number, mapHeight: number, renderTileSize: number = 16) {
    this.tileSet = tileSet;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.renderTileSize = renderTileSize;
    this.tiles = new Int16Array(mapWidth * mapHeight);
    this.tiles.fill(-1);
    this.heights = new Float32Array(mapWidth * mapHeight);
  }

  public setTile(x: number, y: number, tileIndex: number): void {
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return;
    this.tiles[y * this.mapWidth + x] = tileIndex;
  }

  public getTile(x: number, y: number): number {
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return -1;
    return this.tiles[y * this.mapWidth + x];
  }

  public setHeight(x: number, y: number, height: number): void {
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return;
    this.heights[y * this.mapWidth + x] = height;
  }

  public getHeight(x: number, y: number): number {
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return 0;
    return this.heights[y * this.mapWidth + x];
  }

  public fill(tileIndex: number): void { this.tiles.fill(tileIndex); }

  public get width(): number { return this.mapWidth; }
  public get height(): number { return this.mapHeight; }
  public get tileSize(): number { return this.renderTileSize; }

  public render(camX: number, camY: number, zoom: number, screenW: number, screenH: number): void {
    if (!this.tileSet.computeUVs()) return;

    let ts = this.renderTileSize * zoom;

    // Pick tileset: use LOD version when zoomed out
    let useLod = this.lodTileSet && ts < this.lodThreshold;
    let activeTileSet = useLod ? this.lodTileSet! : this.tileSet;
    if (useLod && !activeTileSet.computeUVs()) {
      activeTileSet = this.tileSet; // fallback
    }

    let hs = this.heightScale * zoom;

    // LOD: when tiles are sub-pixel, skip tiles to cap the rendered count.
    // step=1 renders every tile, step=2 every other tile, etc.
    let step = 1;
    if (ts < 4)      step = 8;
    else if (ts < 6)  step = 4;
    else if (ts < 10) step = 2;

    let effectiveTs = ts * step;

    let halfW = screenW / 2 / effectiveTs;
    let halfH = screenH / 2 / effectiveTs;
    let camTX = camX / (this.renderTileSize * step);
    let camTY = camY / (this.renderTileSize * step);

    let margin = (hs > 0) ? Math.ceil(hs * 1.5 / effectiveTs) + 2 : 2;
    let startX = Math.max(0, Math.floor((camTX - halfW) - 1) * step);
    let startY = Math.max(0, Math.floor((camTY - halfH) - margin) * step);
    let endX = Math.min(this.mapWidth, Math.ceil((camTX + halfW) + 1) * step);
    let endY = Math.min(this.mapHeight, Math.ceil((camTY + halfH) + 2) * step);

    let offsetX = screenW / 2 - camX * zoom;
    let offsetY = screenH / 2 - camY * zoom;

    let mat = activeTileSet.material;
    let baseR = mat.diffColor.rFloat;
    let baseG = mat.diffColor.gFloat;
    let baseB = mat.diffColor.bFloat;
    let baseA = mat.diffColor.aFloat;

    let texture = mat.diffTexture;
    if (!texture) return;

    let key = "__default_batch__:" + mat.diffTextureName;
    let batch = (SpriteBatcher as any).batches as Map<string, any>;
    if (!batch) {
      (SpriteBatcher as any).ensureInit();
      batch = (SpriteBatcher as any).batches;
    }

    let batchEntry = batch.get(key);
    if (!batchEntry) {
      batchEntry = { verts: [] as number[], texture: texture, material: null };
      batch.set(key, batchEntry);
    }
    let buf: number[] = batchEntry.verts;

    // Disable 2.5D effects at extreme zoom to avoid visual noise
    let enable3d = ts >= 3;

    let hasImportant = this.importantTiles.size > 0 && step > 1;

    // Render back-to-front (north to south) for correct overlap
    // When step > 1 (zoomed out LOD), iterate every tile but only render
    // LOD-sampled tiles OR important tiles (roads, buildings).
    // At extreme zoom (step >= 8), skip even important tiles — they'd be invisible.
    let showImportant = hasImportant && step <= 2;
    let iterStep = showImportant ? 1 : step;
    for (let y = startY; y < endY; y += iterStep) {
      for (let x = startX; x < endX; x += iterStep) {
        let tileIdx = this.tiles[y * this.mapWidth + x];
        if (tileIdx < 0) continue;

        let onGrid = (x % step === 0) && (y % step === 0);
        let isImportantTile = this.importantTiles.has(tileIdx);

        if (isImportantTile) {
          // Important tiles: render only when showImportant, skip entirely otherwise
          if (!showImportant) continue;
        } else {
          // Normal tiles: render only when on LOD grid
          if (!onGrid) continue;
        }

        let uv = activeTileSet.getUV(tileIdx);
        if (!uv) continue;

        let h = this.heights[y * this.mapWidth + x];
        let yOffset = enable3d ? -h * hs : 0;

        // Compute shadow from height difference with south neighbor
        let hSouth = (y + 1 < this.mapHeight) ? this.heights[(y + 1) * this.mapWidth + x] : h;
        let hNorth = (y - 1 >= 0) ? this.heights[(y - 1) * this.mapWidth + x] : h;
        let hEast = (x + 1 < this.mapWidth) ? this.heights[y * this.mapWidth + x + 1] : h;
        let hWest = (x - 1 >= 0) ? this.heights[y * this.mapWidth + x - 1] : h;

        // Ambient occlusion: tiles surrounded by higher terrain get darker
        let avgNeighbor = (hSouth + hNorth + hEast + hWest) / 4;
        let ao = Math.max(0, (avgNeighbor - h) * this.shadowStrength * 0.5);

        // Directional shadow: light comes from top-left, so south and east facing slopes darken
        let slopeS = Math.max(0, h - hSouth);
        let slopeE = Math.max(0, h - hEast);
        let light = 1.0 - Math.min(0.3, (slopeS + slopeE) * 0.1) - ao;

        // Highlight for north-facing (catching light from above)
        let slopeN = Math.max(0, h - hNorth);
        light += slopeN * 0.08;
        light = Math.max(0.5, Math.min(1.15, light));

        let r = baseR * light;
        let g = baseG * light;
        let b = baseB * light;

        let isImportant = this.importantTiles.has(tileIdx);
        let tileStep = (onGrid && !isImportant) ? step : 1;
        let sx = Math.floor(x * ts + offsetX);
        let sy = Math.floor(y * ts + offsetY + yOffset);
        let sx2 = Math.floor((x + tileStep) * ts + offsetX) + 1;
        let sy2 = Math.floor((y + tileStep) * ts + offsetY + yOffset) + 1;

        // Main tile face
        buf.push(
          sx,  sy,  0, uv.u0, uv.v0, r, g, b, baseA,
          sx,  sy2, 0, uv.u0, uv.v1, r, g, b, baseA,
          sx2, sy2, 0, uv.u1, uv.v1, r, g, b, baseA,
          sx2, sy2, 0, uv.u1, uv.v1, r, g, b, baseA,
          sx2, sy,  0, uv.u1, uv.v0, r, g, b, baseA,
          sx,  sy,  0, uv.u0, uv.v0, r, g, b, baseA,
        );

        if (!enable3d) continue;

        // South-facing cliff face: only for significant height drops
        let dropS = (h - hSouth) * hs;
        if (dropS > 2) {
          let cliffBottom = sy2 + Math.round(dropS);
          // Use the tile's lit color darkened, not the raw base color
          let cr = r * 0.6;
          let cg = g * 0.6;
          let cb = b * 0.6;
          let crBot = r * 0.4;
          let cgBot = g * 0.4;
          let cbBot = b * 0.4;

          buf.push(
            sx,  sy2,        0, uv.u0, uv.v1, cr, cg, cb, baseA,
            sx,  cliffBottom, 0, uv.u0, uv.v1, crBot, cgBot, cbBot, baseA,
            sx2, cliffBottom, 0, uv.u1, uv.v1, crBot, cgBot, cbBot, baseA,
            sx2, cliffBottom, 0, uv.u1, uv.v1, crBot, cgBot, cbBot, baseA,
            sx2, sy2,        0, uv.u1, uv.v1, cr, cg, cb, baseA,
            sx,  sy2,        0, uv.u0, uv.v1, cr, cg, cb, baseA,
          );
        }
      }
    }
  }
}
