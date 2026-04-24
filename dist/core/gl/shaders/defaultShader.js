import { Shader } from '../shader';
export class DefaultShader extends Shader {
    constructor() {
        super("default");
        this.load(this.getVertexSource(), this.getFragmentSource());
    }
    getVertexSource() {
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
    getFragmentSource() {
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
//# sourceMappingURL=defaultShader.js.map