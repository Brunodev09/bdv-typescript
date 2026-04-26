import { m4x4 } from './utils/m4x4';

/**
 * 2D camera with position, zoom, and viewport.
 *
 * The camera defines a view into the world. All rendering (tilemaps,
 * scenes, Draw primitives) is transformed through this camera's
 * projection matrix automatically by the engine.
 *
 * Usage from Game.init():
 *   engine.camera.x = 5000;
 *   engine.camera.y = 3000;
 *   engine.camera.zoom = 2;
 *
 * The engine applies the camera projection every frame before
 * calling game.render().
 */
export class Camera2D {
  /** Camera center X in world pixels. */
  public x: number = 0;

  /** Camera center Y in world pixels. */
  public y: number = 0;

  /** Zoom factor. 1 = 1:1, 2 = 2x zoom in, 0.5 = zoomed out. */
  public zoom: number = 1;

  /**
   * Compute the orthographic projection that maps world coordinates
   * to screen coordinates based on camera position, zoom, and viewport size.
   */
  public getProjection(viewportWidth: number, viewportHeight: number): m4x4 {
    let halfW = viewportWidth / 2 / this.zoom;
    let halfH = viewportHeight / 2 / this.zoom;

    return m4x4.ortho(
      this.x - halfW,  // left
      this.x + halfW,  // right
      this.y + halfH,  // bottom
      this.y - halfH,  // top
      -100, 100,
    );
  }

  /** Convert screen pixel coordinates to world coordinates. */
  public screenToWorld(screenX: number, screenY: number, viewportWidth: number, viewportHeight: number): { x: number; y: number } {
    return {
      x: this.x + (screenX - viewportWidth / 2) / this.zoom,
      y: this.y + (screenY - viewportHeight / 2) / this.zoom,
    };
  }

  /** Convert world coordinates to screen pixel coordinates. */
  public worldToScreen(worldX: number, worldY: number, viewportWidth: number, viewportHeight: number): { x: number; y: number } {
    return {
      x: (worldX - this.x) * this.zoom + viewportWidth / 2,
      y: (worldY - this.y) * this.zoom + viewportHeight / 2,
    };
  }
}
