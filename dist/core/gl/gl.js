export let gl;
export class GLUTools {
    static init(canvas) {
        gl = canvas.getContext("webgl");
        if (!gl)
            throw new Error(`Unable to initialize WebGL.`);
    }
}
//# sourceMappingURL=gl.js.map