import { gl } from '../gl/gl';
import { glBuffer, glAttrInfo } from '../gl/glBuffer';
import { Vertex } from './vertex';
import { MaterialManager } from './materialManager';
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
    update(tick) { }
    render(shader, modelMatrix) {
        const transformLocation = shader.getUniformLocation("u_transf");
        gl.uniformMatrix4fv(transformLocation, false, modelMatrix.toFloat32Array());
        const colorLocation = shader.getUniformLocation("u_color");
        gl.uniform4fv(colorLocation, this.material.diffColor.toArrayFloat32());
        if (this.material.diffTexture) {
            this.material.diffTexture.activate(0);
            const diffuseLocation = shader.getUniformLocation("u_diffuse");
            gl.uniform1i(diffuseLocation, 0);
        }
        this.buffer.bind();
        this.buffer.draw();
    }
}
//# sourceMappingURL=sprite.js.map