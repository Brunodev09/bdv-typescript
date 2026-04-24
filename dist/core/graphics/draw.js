import { gl } from '../gl/gl';
import { Shader } from '../gl/shader';
import { m4x4 } from '../utils/m4x4';
export class Draw {
    static setProjection(proj) {
        Draw.projectionMatrix = proj;
    }
    static ensureInit() {
        if (Draw.whiteTexture)
            return;
        Draw.whiteTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, Draw.whiteTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        Draw.triBuf = gl.createBuffer();
        Draw.lineBuf = gl.createBuffer();
        Draw.batchShader = new BatchColorShader();
    }
    static pushVert(buf, x, y, z, c) {
        buf.push(x, y, z, 0, 0, c.rFloat, c.gFloat, c.bFloat, c.aFloat);
    }
    static rect(x, y, w, h, color) {
        let b = Draw.triVerts, c = color;
        Draw.pushVert(b, x, y, 0, c);
        Draw.pushVert(b, x, y + h, 0, c);
        Draw.pushVert(b, x + w, y + h, 0, c);
        Draw.pushVert(b, x + w, y + h, 0, c);
        Draw.pushVert(b, x + w, y, 0, c);
        Draw.pushVert(b, x, y, 0, c);
    }
    static rectOutline(x, y, w, h, color) {
        Draw.line(x, y, x + w, y, color);
        Draw.line(x + w, y, x + w, y + h, color);
        Draw.line(x + w, y + h, x, y + h, color);
        Draw.line(x, y + h, x, y, color);
    }
    static circle(cx, cy, radius, color, segments = 32) {
        let b = Draw.triVerts;
        for (let i = 0; i < segments; i++) {
            let a0 = (i / segments) * Math.PI * 2;
            let a1 = ((i + 1) / segments) * Math.PI * 2;
            Draw.pushVert(b, cx, cy, 0, color);
            Draw.pushVert(b, cx + Math.cos(a0) * radius, cy + Math.sin(a0) * radius, 0, color);
            Draw.pushVert(b, cx + Math.cos(a1) * radius, cy + Math.sin(a1) * radius, 0, color);
        }
    }
    static circleOutline(cx, cy, radius, color, segments = 32) {
        for (let i = 0; i < segments; i++) {
            let a0 = (i / segments) * Math.PI * 2;
            let a1 = ((i + 1) / segments) * Math.PI * 2;
            Draw.line(cx + Math.cos(a0) * radius, cy + Math.sin(a0) * radius, cx + Math.cos(a1) * radius, cy + Math.sin(a1) * radius, color);
        }
    }
    static triangle(x1, y1, x2, y2, x3, y3, color) {
        let b = Draw.triVerts;
        Draw.pushVert(b, x1, y1, 0, color);
        Draw.pushVert(b, x2, y2, 0, color);
        Draw.pushVert(b, x3, y3, 0, color);
    }
    static triangleOutline(x1, y1, x2, y2, x3, y3, color) {
        Draw.line(x1, y1, x2, y2, color);
        Draw.line(x2, y2, x3, y3, color);
        Draw.line(x3, y3, x1, y1, color);
    }
    static point(x, y, color, size = 4) {
        let h = size / 2;
        Draw.rect(x - h, y - h, size, size, color);
    }
    static line(x1, y1, x2, y2, color) {
        let b = Draw.lineVerts;
        Draw.pushVert(b, x1, y1, 0, color);
        Draw.pushVert(b, x2, y2, 0, color);
    }
    static ray(ox, oy, dirX, dirY, length, color) {
        let mag = Math.sqrt(dirX * dirX + dirY * dirY);
        if (mag === 0)
            return;
        Draw.line(ox, oy, ox + (dirX / mag) * length, oy + (dirY / mag) * length, color);
    }
    static polygon(points, color) {
        for (let i = 0; i < points.length; i++) {
            let [x1, y1] = points[i];
            let [x2, y2] = points[(i + 1) % points.length];
            Draw.line(x1, y1, x2, y2, color);
        }
    }
    static polygonFilled(points, color) {
        if (points.length < 3)
            return;
        for (let i = 1; i < points.length - 1; i++) {
            Draw.triangle(points[0][0], points[0][1], points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], color);
        }
    }
    static flush(parentShader) {
        if (Draw.triVerts.length === 0 && Draw.lineVerts.length === 0)
            return;
        Draw.ensureInit();
        let shader = Draw.batchShader;
        shader.use();
        let projLoc = shader.getUniformLocation("u_proj");
        gl.uniformMatrix4fv(projLoc, false, new Float32Array(Draw.projectionMatrix.mData));
        if (Draw.triVerts.length > 0) {
            Draw.submitBatch(shader, Draw.triBuf, Draw.triVerts, gl.TRIANGLES);
            Draw.triVerts.length = 0;
        }
        if (Draw.lineVerts.length > 0) {
            Draw.submitBatch(shader, Draw.lineBuf, Draw.lineVerts, gl.LINES);
            Draw.lineVerts.length = 0;
        }
        parentShader.use();
    }
    static submitBatch(shader, buffer, verts, mode) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
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
        gl.drawArrays(mode, 0, verts.length / 9);
        gl.disableVertexAttribArray(posLoc);
        gl.disableVertexAttribArray(texLoc);
        gl.disableVertexAttribArray(colLoc);
    }
}
Draw.triVerts = [];
Draw.lineVerts = [];
Draw.whiteTexture = null;
Draw.triBuf = null;
Draw.lineBuf = null;
Draw.batchShader = null;
Draw.projectionMatrix = m4x4.identity();
class BatchColorShader extends Shader {
    constructor() {
        super("batch_color");
        this.load(this.vertSrc(), this.fragSrc());
    }
    vertSrc() {
        return `
      attribute vec3 a_pos;
      attribute vec2 a_textCoord;
      attribute vec4 a_color;

      uniform mat4 u_proj;

      varying vec4 v_color;

      void main() {
          gl_Position = u_proj * vec4(a_pos, 1.0);
          v_color = a_color;
      }`;
    }
    fragSrc() {
        return `
      precision mediump float;
      varying vec4 v_color;

      void main() {
          gl_FragColor = v_color;
      }`;
    }
}
//# sourceMappingURL=draw.js.map