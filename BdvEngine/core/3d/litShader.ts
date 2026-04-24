import { Shader } from '../gl/shader';

/**
 * Phong-style lit shader for 3D rendering.
 * Supports: directional light, ambient, diffuse texture, color tinting.
 */
export class LitShader extends Shader {
  constructor() {
    super("lit3d");
    this.load(this.vertSrc(), this.fragSrc());
  }

  private vertSrc(): string {
    return `
      attribute vec3 a_pos;
      attribute vec3 a_normal;
      attribute vec2 a_textCoord;

      uniform mat4 u_proj;
      uniform mat4 u_view;
      uniform mat4 u_model;
      uniform mat4 u_normalMatrix;

      varying vec3 v_normal;
      varying vec2 v_textCoord;
      varying vec3 v_fragPos;

      void main() {
          vec4 worldPos = u_model * vec4(a_pos, 1.0);
          gl_Position = u_proj * u_view * worldPos;
          v_fragPos = worldPos.xyz;
          v_normal = (u_normalMatrix * vec4(a_normal, 0.0)).xyz;
          v_textCoord = a_textCoord;
      }`;
  }

  private fragSrc(): string {
    return `
      precision mediump float;

      uniform vec4 u_color;
      uniform sampler2D u_diffuse;
      uniform vec3 u_lightDir;
      uniform vec3 u_lightColor;
      uniform vec3 u_ambientColor;
      uniform vec3 u_viewPos;

      varying vec3 v_normal;
      varying vec2 v_textCoord;
      varying vec3 v_fragPos;

      void main() {
          vec4 texColor = texture2D(u_diffuse, v_textCoord) * u_color;
          vec3 normal = normalize(v_normal);
          vec3 lightDir = normalize(u_lightDir);

          // Diffuse
          float diff = max(dot(normal, lightDir), 0.0);
          vec3 diffuse = diff * u_lightColor;

          // Specular (Blinn-Phong)
          vec3 viewDir = normalize(u_viewPos - v_fragPos);
          vec3 halfDir = normalize(lightDir + viewDir);
          float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
          vec3 specular = spec * u_lightColor * 0.5;

          vec3 result = (u_ambientColor + diffuse + specular) * texColor.rgb;
          gl_FragColor = vec4(result, texColor.a);
      }`;
  }
}
