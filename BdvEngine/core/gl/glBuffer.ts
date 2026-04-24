namespace BdvEngine {
  export class glAttrInfo {
    public location!: number;
    public size!: number;
    public offset: number = 0;
  }

  export class glBuffer {
    private hasAttrLocation: boolean = false;
    private elementSize: number;
    private stride!: number;
    private buffer: WebGLBuffer;

    private targetBufferType: number;
    private type: number;
    private mode: number;
    private typeSize: number;

    private data: number[] = [];
    private attrInfo: glAttrInfo[] = [];

    public constructor(
      dataType: number = gl.FLOAT,
      targetBufferType: number = gl.ARRAY_BUFFER,
      mode: number = gl.TRIANGLES,
    ) {
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
          throw new Error(
            `Unable to determine byte size for type ${this.type}.`,
          );
        }
      }

      this.buffer = gl.createBuffer();
    }

    public destroy(): void {
      gl.deleteBuffer(this.buffer);
    }

    public bind(normalized: boolean = false): void {
      gl.bindBuffer(this.targetBufferType, this.buffer);
      if (this.hasAttrLocation) {
        for (let attr of this.attrInfo) {
          gl.vertexAttribPointer(
            attr.location,
            attr.size,
            this.type,
            normalized,
            this.stride,
            attr.offset * this.typeSize,
          );
          gl.enableVertexAttribArray(attr.location);
        }
      }
    }

    public unbind(): void {
      for (let attr of this.attrInfo) {
        gl.disableVertexAttribArray(attr.location);
      }
      gl.bindBuffer(this.targetBufferType, null);
    }

    public addAttrLocation(info: glAttrInfo): void {
      this.hasAttrLocation = true;
      info.offset = this.elementSize;
      this.attrInfo.push(info);
      this.elementSize += info.size;
      this.stride = this.elementSize * this.typeSize;
    }

    public setData(data: number[]): void {
      this.clearData();
      this.pushBack(data);
    }

    public clearData(): void {
      this.data.length = 0;
    }

    public pushBack(data: number[]): void {
      for (let each of data) {
        this.data.push(each);
      }
    }

    public upload(): void {
      gl.bindBuffer(this.targetBufferType, this.buffer);

      // WebGL accepts ArrayBufferView inputs (typed arrays) here.
      let bufferData: ArrayBufferView;

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
          throw new Error(
            `Unable to determine byte size for type ${this.type}.`,
          );
        }
      }
      gl.bufferData(this.targetBufferType, bufferData, gl.STATIC_DRAW);
    }

    public draw(): void {
      if (this.targetBufferType === gl.ARRAY_BUFFER) {
        gl.drawArrays(this.mode, 0, this.data.length / this.elementSize);
      } else if (this.targetBufferType === gl.ELEMENT_ARRAY_BUFFER) {
        gl.drawElements(this.mode, this.data.length, this.type, 0);
      }
    }
  }
}
