namespace BdvEngine {
  export class DefaultShader extends Shader {
    public constructor() {
      super("default");
      this.load(this.getVertexSource(), this.getFragmentSource());
    }

    private getVertexSource(): string {
      return `
      attribute vec3 a_pos;
      attribute vec2 a_textCoord;

      uniform mat4 u_proj;
      uniform mat4 u_transf;

      varying vec2 v_textCoord;

      void main() {
          gl_Position = u_proj * u_transf * vec4(a_pos, 1.0);
          v_textCoord = a_textCoord;
      }`;
    }

    private getFragmentSource(): string {
      // Retrieving the color information of a texture is called sampling
      // That is why we're using 'sampler2D' type on the 'u_diffuse' uniform
      // texture(): vec4

      // Fragment shader doesn't have access to attributes, that is why we need to copy the reference of
      // a_textCoord to the type of 'varying' which will give the Fragment shader access to it.
      return `
      precision mediump float;
      uniform vec4 u_color;
      uniform sampler2D u_diffuse;

      varying vec2 v_textCoord;

      void main() {
          gl_FragColor = u_color * texture2D(u_diffuse, v_textCoord);
      }`;
    }
  }
}
