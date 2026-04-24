import { gl } from '../gl/gl';
import { glBuffer, glAttrInfo } from '../gl/glBuffer';
import { Vertex } from './vertex';
import { MaterialManager } from './materialManager';
import { Draw } from './draw';
import { SpriteBatcher } from './spriteBatcher';
export class Sprite {
    constructor(name, materialName, width = 100, height = 100) {
        this.vertices = [];
        this.name = name;
        this.width = width;
        this.height = height;
        this.materialName = materialName;
        this.material = MaterialManager.get(this.materialName);
    }
    destructor() {
        this.buffer.destroy();
        MaterialManager.flush(this.materialName);
        this.material = undefined;
        this.materialName = undefined;
    }
    get getName() {
        return this.name;
    }
    load() {
        this.buffer = new glBuffer();
        let positionAttr = new glAttrInfo();
        positionAttr.location = 0;
        positionAttr.size = 3;
        this.buffer.addAttrLocation(positionAttr);
        let textCoordAttr = new glAttrInfo();
        textCoordAttr.location = 1;
        textCoordAttr.size = 2;
        this.buffer.addAttrLocation(textCoordAttr);
        this.vertices =
            [
                new Vertex(0, 0, 0, 0, 0),
                new Vertex(0, this.height, 0, 0, 1.0),
                new Vertex(this.width, this.height, 0, 1.0, 1.0),
                new Vertex(this.width, this.height, 0, 1.0, 1.0),
                new Vertex(this.width, 0, 0, 1.0, 0),
                new Vertex(0, 0, 0, 0, 0),
            ];
        for (let v of this.vertices) {
            this.buffer.pushBack(v.toArray());
        }
        this.buffer.upload();
        this.buffer.unbind();
    }
    get hasCustomShader() {
        return this.material.hasCustomShader;
    }
    pushToBatch(worldMatrix) {
        SpriteBatcher.push(this.vertices, this.material, worldMatrix);
    }
    update(tick) { }
    render(shader, modelMatrix) {
        let activeShader = shader;
        if (this.material.hasCustomShader) {
            activeShader = this.material.shader;
            activeShader.use();
            const projLoc = activeShader.getUniformLocation("u_proj");
            gl.uniformMatrix4fv(projLoc, false, new Float32Array(Draw.getProjection().mData));
        }
        const transformLocation = activeShader.getUniformLocation("u_transf");
        gl.uniformMatrix4fv(transformLocation, false, modelMatrix.toFloat32Array());
        const colorLocation = activeShader.getUniformLocation("u_color");
        gl.uniform4fv(colorLocation, this.material.diffColor.toArrayFloat32());
        if (this.material.diffTexture) {
            this.material.diffTexture.activate(0);
            const diffuseLocation = activeShader.getUniformLocation("u_diffuse");
            gl.uniform1i(diffuseLocation, 0);
        }
        this.material.applyUniforms(activeShader);
        this.buffer.bind();
        this.buffer.draw();
        if (this.material.hasCustomShader) {
            shader.use();
        }
    }
}
//# sourceMappingURL=sprite.js.map