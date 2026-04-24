import { gl } from './gl';
export class glAttrInfo {
    constructor() {
        this.offset = 0;
    }
}
export class glBuffer {
    constructor(dataType = gl.FLOAT, targetBufferType = gl.ARRAY_BUFFER, mode = gl.TRIANGLES) {
        this.hasAttrLocation = false;
        this.data = [];
        this.attrInfo = [];
        this.elementSize = 0;
        this.type = dataType;
        this.targetBufferType = targetBufferType;
        this.mode = mode;
        switch (this.type) {
            case gl.UNSIGNED_INT:
            case gl.INT:
            case gl.FLOAT: {
                this.typeSize = 4;
                break;
            }
            case gl.UNSIGNED_SHORT:
            case gl.SHORT: {
                this.typeSize = 2;
                break;
            }
            case gl.UNSIGNED_BYTE:
            case gl.BYTE: {
                this.typeSize = 1;
                break;
            }
            default: {
                throw new Error(`Unable to determine byte size for type ${this.type}.`);
            }
        }
        this.buffer = gl.createBuffer();
    }
    destroy() {
        gl.deleteBuffer(this.buffer);
    }
    bind(normalized = false) {
        gl.bindBuffer(this.targetBufferType, this.buffer);
        if (this.hasAttrLocation) {
            for (let attr of this.attrInfo) {
                gl.vertexAttribPointer(attr.location, attr.size, this.type, normalized, this.stride, attr.offset * this.typeSize);
                gl.enableVertexAttribArray(attr.location);
            }
        }
    }
    unbind() {
        for (let attr of this.attrInfo) {
            gl.disableVertexAttribArray(attr.location);
        }
        gl.bindBuffer(this.targetBufferType, null);
    }
    addAttrLocation(info) {
        this.hasAttrLocation = true;
        info.offset = this.elementSize;
        this.attrInfo.push(info);
        this.elementSize += info.size;
        this.stride = this.elementSize * this.typeSize;
    }
    setData(data) {
        this.clearData();
        this.pushBack(data);
    }
    clearData() {
        this.data.length = 0;
    }
    pushBack(data) {
        for (let each of data) {
            this.data.push(each);
        }
    }
    upload() {
        gl.bindBuffer(this.targetBufferType, this.buffer);
        let bufferData;
        switch (this.type) {
            case gl.FLOAT: {
                bufferData = new Float32Array(this.data);
                break;
            }
            case gl.INT: {
                bufferData = new Int32Array(this.data);
                break;
            }
            case gl.UNSIGNED_INT: {
                bufferData = new Uint32Array(this.data);
                break;
            }
            case gl.SHORT: {
                bufferData = new Int16Array(this.data);
                break;
            }
            case gl.UNSIGNED_SHORT: {
                bufferData = new Uint16Array(this.data);
                break;
            }
            case gl.BYTE: {
                bufferData = new Int8Array(this.data);
                break;
            }
            case gl.UNSIGNED_BYTE: {
                bufferData = new Uint8Array(this.data);
                break;
            }
            default: {
                throw new Error(`Unable to determine byte size for type ${this.type}.`);
            }
        }
        gl.bufferData(this.targetBufferType, bufferData, gl.STATIC_DRAW);
    }
    draw() {
        if (this.targetBufferType === gl.ARRAY_BUFFER) {
            gl.drawArrays(this.mode, 0, this.data.length / this.elementSize);
        }
        else if (this.targetBufferType === gl.ELEMENT_ARRAY_BUFFER) {
            gl.drawElements(this.mode, this.data.length, this.type, 0);
        }
    }
}
//# sourceMappingURL=glBuffer.js.map