
namespace BdvEngine {

    export let gl: WebGLRenderingContext;

    export class GLUTools {
        public static init(canvas: HTMLCanvasElement): void {
            gl = canvas.getContext("webgl");
            if (!gl) throw new Error(`Unable to initialize WebGL.`);
        }
    }
}