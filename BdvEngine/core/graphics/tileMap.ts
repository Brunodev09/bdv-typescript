import { gl } from '../gl/gl';
import { Shader } from '../gl/shader';
import { Texture } from './texture';
import { TextureManager } from './textureManager';
import { Color } from './color';
import { Draw } from './draw';
import { SpriteBatcher } from './spriteBatcher';
import { Vertex } from './vertex';
import { Material } from './material';
import { MaterialManager } from './materialManager';
import { m4x4 } from '../utils/m4x4';
import { Camera2D } from '../camera2d';

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

  public filtering: 'nearest' | 'linear' = 'nearest';

  constructor(config: TileSetConfig) {
    this.tileWidth = config.tileWidth;
    this.tileHeight = config.tileHeight;
    this.material = new Material(config.materialName, config.imagePath, Color.white());
    MaterialManager.register(this.material);
  }

  public computeUVs(): boolean {
    if (this.ready) return true;

    let tex = this.material.diffTexture;
    if (!tex || !tex.textureIsLoaded) return false;

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

export class TileMap {
  public tileSet: TileSet;

  private mapWidth: number;
  private mapHeight: number;
  private tiles: Int16Array;
  private heights: Float32Array;
  private renderTileSize: number;

  public heightScale: number = 6;
  public shadowStrength: number = 0.45;
  public lodTileSet: TileSet | null = null;
  public lodThreshold: number = 6;
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

  /**
   * Render visible tiles in WORLD SPACE.
   * Tile positions are in world pixels: tile (x,y) renders at
   * (x * tileSize, y * tileSize). The engine's camera projection
   * handles the world-to-screen transform.
   */
  public render(camera: Camera2D, screenW: number, screenH: number): void {
    if (!this.tileSet.computeUVs()) return;

    let ts = this.renderTileSize;
    let zoom = camera.zoom;
    let screenTs = ts * zoom; // tile size on screen for LOD decisions

    // Pick tileset: use LOD version when zoomed out
    let useLod = this.lodTileSet && screenTs < this.lodThreshold;
    let activeTileSet = useLod ? this.lodTileSet! : this.tileSet;
    if (useLod && !activeTileSet.computeUVs()) {
      activeTileSet = this.tileSet;
    }

    // LOD step based on screen size of tiles
    let step = 1;
    if (screenTs < 4)      step = 8;
    else if (screenTs < 6)  step = 4;
    else if (screenTs < 10) step = 2;

    // Compute visible tile range from camera
    let halfW = screenW / 2 / zoom;
    let halfH = screenH / 2 / zoom;
    let camTX = camera.x / ts;
    let camTY = camera.y / ts;

    let margin = 2;
    let startX = Math.max(0, Math.floor(camTX - halfW / ts) - 1);
    let startY = Math.max(0, Math.floor(camTY - halfH / ts) - margin);
    let endX = Math.min(this.mapWidth, Math.ceil(camTX + halfW / ts) + 1);
    let endY = Math.min(this.mapHeight, Math.ceil(camTY + halfH / ts) + 2);

    // Snap to step grid
    startX = Math.floor(startX / step) * step;
    startY = Math.floor(startY / step) * step;

    let mat = activeTileSet.material;
    let baseR = mat.diffColor.rFloat;
    let baseG = mat.diffColor.gFloat;
    let baseB = mat.diffColor.bFloat;
    let baseA = mat.diffColor.aFloat;

    let texture = mat.diffTexture;
    if (!texture) return;

    let key = "__default_batch__:" + mat.diffTextureName;
    let batches = (SpriteBatcher as any).batches as Map<string, any>;
    if (!batches) {
      (SpriteBatcher as any).ensureInit();
      batches = (SpriteBatcher as any).batches;
    }

    let batchEntry = batches.get(key);
    if (!batchEntry) {
      batchEntry = { verts: [] as number[], texture: texture, material: null };
      batches.set(key, batchEntry);
    }
    let buf: number[] = batchEntry.verts;

    let hasImportant = this.importantTiles.size > 0 && step > 1;
    let showImportant = hasImportant && step <= 2;
    let iterStep = showImportant ? 1 : step;

    for (let y = startY; y < endY; y += iterStep) {
      for (let x = startX; x < endX; x += iterStep) {
        let tileIdx = this.tiles[y * this.mapWidth + x];
        if (tileIdx < 0) continue;

        let onGrid = (x % step === 0) && (y % step === 0);
        let isImportantTile = this.importantTiles.has(tileIdx);

        if (isImportantTile) {
          if (!showImportant) continue;
        } else {
          if (!onGrid) continue;
        }

        let uv = activeTileSet.getUV(tileIdx);
        if (!uv) continue;

        let r = baseR, g = baseG, b = baseB;
        let tileStep = (onGrid && !isImportantTile) ? step : 1;

        let wx = x * ts;
        let wy = y * ts;
        let wx2 = (x + tileStep) * ts;
        let wy2 = (y + tileStep) * ts;

        buf.push(
          wx,  wy,  0, uv.u0, uv.v0, r, g, b, baseA,
          wx,  wy2, 0, uv.u0, uv.v1, r, g, b, baseA,
          wx2, wy2, 0, uv.u1, uv.v1, r, g, b, baseA,
          wx2, wy2, 0, uv.u1, uv.v1, r, g, b, baseA,
          wx2, wy,  0, uv.u1, uv.v0, r, g, b, baseA,
          wx,  wy,  0, uv.u0, uv.v0, r, g, b, baseA,
        );

      }
    }
  }
}
