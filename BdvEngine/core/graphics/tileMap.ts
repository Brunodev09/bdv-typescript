import { gl, GLExt } from '../gl/gl';
import { Shader } from '../gl/shader';
import { Color } from './color';
import { Draw } from './draw';
import { Material } from './material';
import { MaterialManager } from './materialManager';
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
  public get colCount(): number { return this.cols; }
  public get rowCount(): number { return this.rows; }

  public getUV(tileIndex: number): TileUV | null {
    if (tileIndex < 0 || tileIndex >= this.uvs.length) return null;
    return this.uvs[tileIndex];
  }
}

/**
 * Chunked tilemap renderer.
 *
 * The map is divided into CHUNK_SIZE × CHUNK_SIZE chunks; each owns a static
 * VBO + EBO baked once on first render and re-baked only when a tile in that
 * chunk changes. Per-frame work is just AABB-cull → bind buffers → drawElements.
 *
 * Renders directly (does NOT go through SpriteBatcher). Call this BEFORE
 * SpriteBatcher.flush() so terrain ends up below the sprite layers.
 */
export class TileMap {
  public static readonly CHUNK_SIZE = 64;

  public tileSet: TileSet;
  public lodTileSet: TileSet | null = null;
  public lodThreshold: number = 6;
  public heightScale: number = 6;
  public shadowStrength: number = 0.45;
  public importantTiles: Set<number> = new Set();

  private mapWidth: number;
  private mapHeight: number;
  private renderTileSize: number;
  private tiles: Int16Array;
  private heights: Float32Array;

  private chunks: TileChunk[];
  private lodChunks: TileChunk[] | null = null;
  private chunksX: number;
  private chunksY: number;

  constructor(tileSet: TileSet, mapWidth: number, mapHeight: number, renderTileSize: number = 16) {
    this.tileSet = tileSet;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.renderTileSize = renderTileSize;
    this.tiles = new Int16Array(mapWidth * mapHeight);
    this.tiles.fill(-1);
    this.heights = new Float32Array(mapWidth * mapHeight);

    this.chunksX = Math.ceil(mapWidth / TileMap.CHUNK_SIZE);
    this.chunksY = Math.ceil(mapHeight / TileMap.CHUNK_SIZE);
    this.chunks = new Array(this.chunksX * this.chunksY);
    for (let cy = 0; cy < this.chunksY; cy++) {
      for (let cx = 0; cx < this.chunksX; cx++) {
        this.chunks[cy * this.chunksX + cx] = new TileChunk(cx, cy);
      }
    }
  }

  public setTile(x: number, y: number, tileIndex: number): void {
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) return;
    this.tiles[y * this.mapWidth + x] = tileIndex;
    let cx = Math.floor(x / TileMap.CHUNK_SIZE);
    let cy = Math.floor(y / TileMap.CHUNK_SIZE);
    let i = cy * this.chunksX + cx;
    this.chunks[i].markDirty();
    if (this.lodChunks) this.lodChunks[i].markDirty();
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

  public fill(tileIndex: number): void {
    this.tiles.fill(tileIndex);
    for (let c of this.chunks) c.markDirty();
    if (this.lodChunks) for (let c of this.lodChunks) c.markDirty();
  }

  public get width(): number { return this.mapWidth; }
  public get height(): number { return this.mapHeight; }
  public get tileSize(): number { return this.renderTileSize; }

  /**
   * Render visible chunks in WORLD SPACE.
   * Tile positions: tile (x,y) renders at (x * tileSize, y * tileSize).
   */
  public render(camera: Camera2D, screenW: number, screenH: number): void {
    if (!this.tileSet.computeUVs()) return;

    let ts = this.renderTileSize;
    let zoom = camera.zoom;
    let screenTs = ts * zoom;

    let activeSet = this.tileSet;
    let activeChunks = this.chunks;
    if (this.lodTileSet && screenTs < this.lodThreshold && this.lodTileSet.computeUVs()) {
      activeSet = this.lodTileSet;
      if (!this.lodChunks) this.lodChunks = this.buildChunkArray();
      activeChunks = this.lodChunks;
    }

    let halfW = screenW / 2 / zoom;
    let halfH = screenH / 2 / zoom;
    let minX = camera.x - halfW, minY = camera.y - halfH;
    let maxX = camera.x + halfW, maxY = camera.y + halfH;

    let chunkPx = TileMap.CHUNK_SIZE * ts;
    let cMinX = Math.max(0, Math.floor(minX / chunkPx));
    let cMinY = Math.max(0, Math.floor(minY / chunkPx));
    let cMaxX = Math.min(this.chunksX, Math.ceil(maxX / chunkPx));
    let cMaxY = Math.min(this.chunksY, Math.ceil(maxY / chunkPx));

    let shader = TileChunk.getShader();
    shader.use();
    gl.uniformMatrix4fv(shader.getUniformLocation("u_proj"), false, new Float32Array(Draw.getProjection().mData));
    let texture = activeSet.material.diffTexture!;
    texture.activate(0);
    gl.uniform1i(shader.getUniformLocation("u_diffuse"), 0);

    for (let cy = cMinY; cy < cMaxY; cy++) {
      for (let cx = cMinX; cx < cMaxX; cx++) {
        let chunk = activeChunks[cy * this.chunksX + cx];
        if (chunk.dirty) {
          chunk.bake(this.tiles, this.mapWidth, this.mapHeight, ts, activeSet);
        }
        chunk.draw(shader);
      }
    }
  }

  private buildChunkArray(): TileChunk[] {
    let arr = new Array<TileChunk>(this.chunksX * this.chunksY);
    for (let cy = 0; cy < this.chunksY; cy++) {
      for (let cx = 0; cx < this.chunksX; cx++) {
        arr[cy * this.chunksX + cx] = new TileChunk(cx, cy);
      }
    }
    return arr;
  }

  public dispose(): void {
    for (let c of this.chunks) c.dispose();
    if (this.lodChunks) for (let c of this.lodChunks) c.dispose();
  }
}

class TileChunk {
  private chunkX: number;
  private chunkY: number;
  private vbo: WebGLBuffer | null = null;
  private ebo: WebGLBuffer | null = null;
  private indexCount: number = 0;
  private initialized: boolean = false;
  public dirty: boolean = true;

  private static shader: TileChunkShader | null = null;
  public static getShader(): Shader {
    if (!TileChunk.shader) TileChunk.shader = new TileChunkShader();
    return TileChunk.shader;
  }

  constructor(cx: number, cy: number) {
    this.chunkX = cx;
    this.chunkY = cy;
  }

  public markDirty(): void { this.dirty = true; }

  public bake(tiles: Int16Array, mapW: number, mapH: number, tileSize: number, set: TileSet): void {
    if (!this.initialized) {
      this.vbo = gl.createBuffer();
      this.ebo = gl.createBuffer();
      this.initialized = true;
    }

    let baseX = this.chunkX * TileMap.CHUNK_SIZE;
    let baseY = this.chunkY * TileMap.CHUNK_SIZE;
    let endX = Math.min(baseX + TileMap.CHUNK_SIZE, mapW);
    let endY = Math.min(baseY + TileMap.CHUNK_SIZE, mapH);

    let verts: number[] = [];
    let indices: number[] = [];
    let quad = 0;
    const r = 1, g = 1, b = 1, a = 1;

    for (let y = baseY; y < endY; y++) {
      for (let x = baseX; x < endX; x++) {
        let tileIdx = tiles[y * mapW + x];
        if (tileIdx < 0) continue;
        let uv = set.getUV(tileIdx);
        if (!uv) continue;
        let x1 = x * tileSize, y1 = y * tileSize;
        let x2 = x1 + tileSize, y2 = y1 + tileSize;

        verts.push(
          x1, y1, 0, uv.u0, uv.v0, r, g, b, a,
          x1, y2, 0, uv.u0, uv.v1, r, g, b, a,
          x2, y2, 0, uv.u1, uv.v1, r, g, b, a,
          x2, y1, 0, uv.u1, uv.v0, r, g, b, a,
        );
        let v0i = quad * 4;
        indices.push(v0i + 0, v0i + 1, v0i + 2, v0i + 2, v0i + 3, v0i + 0);
        quad++;
      }
    }

    this.indexCount = indices.length;
    if (verts.length > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
      // Indices fit in uint16 (max 4*4096 = 16384 < 65536) at CHUNK_SIZE=64.
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    }
    this.dirty = false;
  }

  public draw(shader: Shader): void {
    if (this.indexCount === 0 || !this.initialized) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    const stride = 9 * 4;

    let posLoc = shader.getAttribLocation("a_pos");
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(posLoc);

    let texLoc = shader.getAttribLocation("a_textCoord");
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, stride, 3 * 4);
    gl.enableVertexAttribArray(texLoc);

    let colLoc = shader.getAttribLocation("a_color");
    gl.vertexAttribPointer(colLoc, 4, gl.FLOAT, false, stride, 5 * 4);
    gl.enableVertexAttribArray(colLoc);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);

    gl.disableVertexAttribArray(posLoc);
    gl.disableVertexAttribArray(texLoc);
    gl.disableVertexAttribArray(colLoc);
  }

  public dispose(): void {
    if (!this.initialized) return;
    if (this.vbo) gl.deleteBuffer(this.vbo);
    if (this.ebo) gl.deleteBuffer(this.ebo);
    this.vbo = null;
    this.ebo = null;
    this.initialized = false;
  }
}

class TileChunkShader extends Shader {
  constructor() {
    super("tile_chunk");
    this.load(this.vertSrc(), this.fragSrc());
  }
  private vertSrc(): string {
    return `
      attribute vec3 a_pos;
      attribute vec2 a_textCoord;
      attribute vec4 a_color;
      uniform mat4 u_proj;
      varying vec2 v_textCoord;
      varying vec4 v_color;
      void main() {
        gl_Position = u_proj * vec4(a_pos, 1.0);
        v_textCoord = a_textCoord;
        v_color = a_color;
      }`;
  }
  private fragSrc(): string {
    return `
      precision mediump float;
      uniform sampler2D u_diffuse;
      varying vec2 v_textCoord;
      varying vec4 v_color;
      void main() {
        gl_FragColor = v_color * texture2D(u_diffuse, v_textCoord);
      }`;
  }
}
