import { gl } from './gl';

/**
 * Tracks WebGL draw call count per frame.
 * Call install() once after GL init to hook into drawArrays/drawElements.
 * Call reset() at the start of each frame, read drawCalls after rendering.
 */
export class GLStats {
  static drawCalls: number = 0;
  private static installed: boolean = false;

  static install(): void {
    if (GLStats.installed) return;
    GLStats.installed = true;

    let origDrawArrays = gl.drawArrays.bind(gl);
    let origDrawElements = gl.drawElements.bind(gl);

    gl.drawArrays = function (mode: number, first: number, count: number) {
      GLStats.drawCalls++;
      origDrawArrays(mode, first, count);
    };

    gl.drawElements = function (mode: number, count: number, type: number, offset: number) {
      GLStats.drawCalls++;
      origDrawElements(mode, count, type, offset);
    };
  }

  static reset(): void {
    GLStats.drawCalls = 0;
  }
}
