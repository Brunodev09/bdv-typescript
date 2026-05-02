export let gl: WebGLRenderingContext;

/** Common WebGL1 extensions, lazily resolved on init. */
export class GLExt {
  /** OES_element_index_uint — lets us use Uint32Array indices (>65535 verts/draw). */
  public static elementIndexUint: any = null;
  /** OES_vertex_array_object — lets us cache VAO state. */
  public static vertexArrayObject: any = null;
}

export class GLUTools {
  public static init(canvas: HTMLCanvasElement): void {
    gl = canvas.getContext("webgl")!;
    if (!gl) throw new Error(`Unable to initialize WebGL.`);

    GLExt.elementIndexUint = gl.getExtension('OES_element_index_uint');
    GLExt.vertexArrayObject = gl.getExtension('OES_vertex_array_object');
  }
}
