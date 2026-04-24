import { gl } from '../gl/gl';
import { Shader } from '../gl/shader';
import { Draw } from './draw';
export class SpriteBatcher {
    static ensureInit() {
        if (SpriteBatcher.buffer)
            return;
        SpriteBatcher.buffer = gl.createBuffer();
        SpriteBatcher.batchShader = new BatchSpriteShader();
    }
    static push(vertices, material, worldMatrix) {
        let texture = material.diffTexture;
        if (!texture)
            return;
        let shaderName = material.hasCustomShader ? material.shader.name : "__default_batch__";
        let key = shaderName + ":" + material.diffTextureName;
        let batch = SpriteBatcher.batches.get(key);
        if (!batch) {
            batch = {
                verts: [],
                texture: texture,
                material: material.hasCustomShader ? material : null,
            };
            SpriteBatcher.batches.set(key, batch);
        }
        let color = material.diffColor;
        let r = color.rFloat, g = color.gFloat, b = color.bFloat, a = color.aFloat;
        let m = worldMatrix.mData;
        let buf = batch.verts;
        for (let i = 0; i < vertices.length; i++) {
            let v = vertices[i];
            let px = v.position.vx, py = v.position.vy, pz = v.position.vz;
            let wx = m[0] * px + m[4] * py + m[8] * pz + m[12];
            let wy = m[1] * px + m[5] * py + m[9] * pz + m[13];
            let wz = m[2] * px + m[6] * py + m[10] * pz + m[14];
            buf.push(wx, wy, wz, v.texCoords.vx, v.texCoords.vy, r, g, b, a);
        }
    }
    static flush() {
        if (SpriteBatcher.batches.size === 0)
            return;
        SpriteBatcher.ensureInit();
        SpriteBatcher.batches.forEach((batch, key) => {
            if (batch.verts.length === 0)
                return;
            let shader;
            if (batch.material && batch.material.hasCustomShader) {
                shader = batch.material.shader;
                shader.use();
                let projLoc = shader.getUniformLocation("u_proj");
                gl.uniformMatrix4fv(projLoc, false, new Float32Array(Draw.getProjection().mData));
                batch.material.applyUniforms(shader);
            }
            else {
                shader = SpriteBatcher.batchShader;
                shader.use();
                let projLoc = shader.getUniformLocation("u_proj");
                gl.uniformMatrix4fv(projLoc, false, new Float32Array(Draw.getProjection().mData));
            }
            batch.texture.activate(0);
            let diffLoc = shader.getUniformLocation("u_diffuse");
            gl.uniform1i(diffLoc, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, SpriteBatcher.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(batch.verts), gl.DYNAMIC_DRAW);
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
            let vertexCount = batch.verts.length / 9;
            gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
            gl.disableVertexAttribArray(posLoc);
            gl.disableVertexAttribArray(texLoc);
            gl.disableVertexAttribArray(colLoc);
            batch.verts.length = 0;
        });
    }
}
SpriteBatcher.batches = new Map();
SpriteBatcher.buffer = null;
SpriteBatcher.batchShader = null;
class BatchSpriteShader extends Shader {
    constructor() {
        super("batch_sprite");
        this.load(this.vertSrc(), this.fragSrc());
    }
    vertSrc() {
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
    fragSrc() {
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
//# sourceMappingURL=spriteBatcher.js.map