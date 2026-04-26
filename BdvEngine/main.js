/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./BdvEngine/core/3d/camera.ts"
/*!*************************************!*\
  !*** ./BdvEngine/core/3d/camera.ts ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Camera: () => (/* binding */ Camera)
/* harmony export */ });
/* harmony import */ var _utils_vec3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/vec3 */ "./BdvEngine/core/utils/vec3.ts");
/* harmony import */ var _utils_m4x4__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/m4x4 */ "./BdvEngine/core/utils/m4x4.ts");


class Camera {
    constructor(position = new _utils_vec3__WEBPACK_IMPORTED_MODULE_0__.vec3(0, 2, 5), target = new _utils_vec3__WEBPACK_IMPORTED_MODULE_0__.vec3(0, 0, 0), up = new _utils_vec3__WEBPACK_IMPORTED_MODULE_0__.vec3(0, 1, 0), fov = Math.PI / 4, near = 0.1, far = 1000) {
        this.position = position;
        this.target = target;
        this.up = up;
        this.fov = fov;
        this.near = near;
        this.far = far;
    }
    getViewMatrix() {
        return _utils_m4x4__WEBPACK_IMPORTED_MODULE_1__.m4x4.lookAt(this.position, this.target, this.up);
    }
    getProjectionMatrix(aspect) {
        return _utils_m4x4__WEBPACK_IMPORTED_MODULE_1__.m4x4.perspective(this.fov, aspect, this.near, this.far);
    }
    getViewProjection(aspect) {
        return _utils_m4x4__WEBPACK_IMPORTED_MODULE_1__.m4x4.multiply(this.getProjectionMatrix(aspect), this.getViewMatrix());
    }
}


/***/ },

/***/ "./BdvEngine/core/3d/litShader.ts"
/*!****************************************!*\
  !*** ./BdvEngine/core/3d/litShader.ts ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LitShader: () => (/* binding */ LitShader)
/* harmony export */ });
/* harmony import */ var _gl_shader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../gl/shader */ "./BdvEngine/core/gl/shader.ts");

class LitShader extends _gl_shader__WEBPACK_IMPORTED_MODULE_0__.Shader {
    constructor() {
        super("lit3d");
        this.load(this.vertSrc(), this.fragSrc());
    }
    vertSrc() {
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
    fragSrc() {
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


/***/ },

/***/ "./BdvEngine/core/3d/mesh.ts"
/*!***********************************!*\
  !*** ./BdvEngine/core/3d/mesh.ts ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Mesh: () => (/* binding */ Mesh)
/* harmony export */ });
/* harmony import */ var _gl_gl__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../gl/gl */ "./BdvEngine/core/gl/gl.ts");

class Mesh {
    constructor(vertices, indices) {
        this.ibo = null;
        this.indexCount = 0;
        this.initialized = false;
        this.indexData = null;
        this.vertexData = new Float32Array(vertices);
        this.vertexCount = vertices.length / Mesh.FLOATS_PER_VERTEX;
        this.vbo = null;
        if (indices && indices.length > 0) {
            this.indexData = new Uint16Array(indices);
            this.indexCount = indices.length;
        }
    }
    ensureGl() {
        if (this.initialized)
            return;
        this.initialized = true;
        this.vbo = _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.createBuffer();
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.bindBuffer(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.ARRAY_BUFFER, this.vbo);
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.bufferData(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.ARRAY_BUFFER, this.vertexData, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.STATIC_DRAW);
        if (this.indexData) {
            this.ibo = _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.createBuffer();
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.bindBuffer(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.ELEMENT_ARRAY_BUFFER, this.ibo);
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.bufferData(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.ELEMENT_ARRAY_BUFFER, this.indexData, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.STATIC_DRAW);
        }
    }
    bind(posLoc, normalLoc, texLoc) {
        this.ensureGl();
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.bindBuffer(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.ARRAY_BUFFER, this.vbo);
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.vertexAttribPointer(posLoc, 3, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.FLOAT, false, Mesh.STRIDE, 0);
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.enableVertexAttribArray(posLoc);
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.vertexAttribPointer(normalLoc, 3, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.FLOAT, false, Mesh.STRIDE, 3 * 4);
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.enableVertexAttribArray(normalLoc);
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.vertexAttribPointer(texLoc, 2, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.FLOAT, false, Mesh.STRIDE, 6 * 4);
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.enableVertexAttribArray(texLoc);
        if (this.ibo) {
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.bindBuffer(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.ELEMENT_ARRAY_BUFFER, this.ibo);
        }
    }
    draw() {
        if (this.ibo) {
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.drawElements(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TRIANGLES, this.indexCount, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.UNSIGNED_SHORT, 0);
        }
        else {
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.drawArrays(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TRIANGLES, 0, this.vertexCount);
        }
    }
    unbind(posLoc, normalLoc, texLoc) {
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.disableVertexAttribArray(posLoc);
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.disableVertexAttribArray(normalLoc);
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.disableVertexAttribArray(texLoc);
    }
    destroy() {
        if (this.vbo)
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.deleteBuffer(this.vbo);
        if (this.ibo)
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.deleteBuffer(this.ibo);
    }
    static cube() {
        let v = [];
        let idx = [];
        function face(p0, p1, p2, p3, n) {
            let base = v.length / 8;
            v.push(...p0, ...n, 0, 0);
            v.push(...p1, ...n, 1, 0);
            v.push(...p2, ...n, 1, 1);
            v.push(...p3, ...n, 0, 1);
            idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }
        face([-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5], [0, 0, 1]);
        face([0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5], [0, 0, -1]);
        face([-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5], [0, 1, 0]);
        face([-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5], [0, -1, 0]);
        face([0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5], [1, 0, 0]);
        face([-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5], [-1, 0, 0]);
        return new Mesh(v, idx);
    }
    static plane(size = 1) {
        let h = size / 2;
        let v = [
            -h, 0, -h, 0, 1, 0, 0, 0,
            h, 0, -h, 0, 1, 0, 1, 0,
            h, 0, h, 0, 1, 0, 1, 1,
            -h, 0, h, 0, 1, 0, 0, 1,
            -h, 0, h, 0, -1, 0, 0, 0,
            h, 0, h, 0, -1, 0, 1, 0,
            h, 0, -h, 0, -1, 0, 1, 1,
            -h, 0, -h, 0, -1, 0, 0, 1,
        ];
        let idx = [
            0, 1, 2, 0, 2, 3,
            4, 5, 6, 4, 6, 7,
        ];
        return new Mesh(v, idx);
    }
    static sphere(segments = 16, rings = 12) {
        let v = [];
        let idx = [];
        for (let r = 0; r <= rings; r++) {
            let phi = (r / rings) * Math.PI;
            let sp = Math.sin(phi), cp = Math.cos(phi);
            for (let s = 0; s <= segments; s++) {
                let theta = (s / segments) * Math.PI * 2;
                let st = Math.sin(theta), ct = Math.cos(theta);
                let x = ct * sp;
                let y = cp;
                let z = st * sp;
                let u = s / segments;
                let vv = r / rings;
                v.push(x * 0.5, y * 0.5, z * 0.5, x, y, z, u, vv);
            }
        }
        for (let r = 0; r < rings; r++) {
            for (let s = 0; s < segments; s++) {
                let a = r * (segments + 1) + s;
                let b = a + segments + 1;
                idx.push(a, b, a + 1);
                idx.push(a + 1, b, b + 1);
            }
        }
        return new Mesh(v, idx);
    }
}
Mesh.FLOATS_PER_VERTEX = 8;
Mesh.STRIDE = 8 * 4;


/***/ },

/***/ "./BdvEngine/core/3d/meshComponent.ts"
/*!********************************************!*\
  !*** ./BdvEngine/core/3d/meshComponent.ts ***!
  \********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MeshComponent: () => (/* binding */ MeshComponent),
/* harmony export */   MeshComponentData: () => (/* binding */ MeshComponentData)
/* harmony export */ });
/* harmony import */ var _gl_gl__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../gl/gl */ "./BdvEngine/core/gl/gl.ts");
/* harmony import */ var _components_baseComponent__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../components/baseComponent */ "./BdvEngine/core/components/baseComponent.ts");
/* harmony import */ var _graphics_materialManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../graphics/materialManager */ "./BdvEngine/core/graphics/materialManager.ts");



class MeshComponentData {
    constructor() {
        this.name = '';
        this.materialName = '';
    }
    setFromJson(json) {
        if (json.name !== undefined)
            this.name = String(json.name);
        if (json.materialName !== undefined)
            this.materialName = String(json.materialName);
    }
}
class MeshComponent extends _components_baseComponent__WEBPACK_IMPORTED_MODULE_1__.BaseComponent {
    constructor(mesh, materialName) {
        let data = new MeshComponentData();
        data.name = 'mesh';
        data.materialName = materialName;
        super(data);
        this.mesh = mesh;
        this.material = _graphics_materialManager__WEBPACK_IMPORTED_MODULE_2__.MaterialManager.get(materialName);
    }
    render(shader) {
        let activeShader = shader;
        if (this.material.hasCustomShader) {
            activeShader = this.material.shader;
            activeShader.use();
        }
        let model = this.owner.getWorldMatrix;
        let modelLoc = activeShader.getUniformLocation("u_model");
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniformMatrix4fv(modelLoc, false, model.toFloat32Array());
        let normalMatLoc = activeShader.getUniformLocation("u_normalMatrix");
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniformMatrix4fv(normalMatLoc, false, model.toFloat32Array());
        let colorLoc = activeShader.getUniformLocation("u_color");
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniform4fv(colorLoc, this.material.diffColor.toArrayFloat32());
        if (this.material.diffTexture) {
            this.material.diffTexture.activate(0);
            let diffLoc = activeShader.getUniformLocation("u_diffuse");
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniform1i(diffLoc, 0);
        }
        this.material.applyUniforms(activeShader);
        let posLoc = activeShader.getAttribLocation("a_pos");
        let normalLoc = activeShader.getAttribLocation("a_normal");
        let texLoc = activeShader.getAttribLocation("a_textCoord");
        this.mesh.bind(posLoc, normalLoc, texLoc);
        this.mesh.draw();
        this.mesh.unbind(posLoc, normalLoc, texLoc);
        if (this.material.hasCustomShader) {
            shader.use();
        }
    }
}


/***/ },

/***/ "./BdvEngine/core/3d/objLoader.ts"
/*!****************************************!*\
  !*** ./BdvEngine/core/3d/objLoader.ts ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ObjLoader: () => (/* binding */ ObjLoader)
/* harmony export */ });
/* harmony import */ var _mesh__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./mesh */ "./BdvEngine/core/3d/mesh.ts");

class ObjLoader {
    static parse(objText) {
        let positions = [];
        let normals = [];
        let texcoords = [];
        let vertices = [];
        let vertexMap = new Map();
        let indices = [];
        let lines = objText.split('\n');
        for (let line of lines) {
            line = line.trim();
            if (line.length === 0 || line[0] === '#')
                continue;
            let parts = line.split(/\s+/);
            let cmd = parts[0];
            if (cmd === 'v') {
                positions.push([
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3]),
                ]);
            }
            else if (cmd === 'vn') {
                normals.push([
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3]),
                ]);
            }
            else if (cmd === 'vt') {
                texcoords.push([
                    parseFloat(parts[1]),
                    parseFloat(parts[2] || '0'),
                ]);
            }
            else if (cmd === 'f') {
                let faceVerts = [];
                for (let i = 1; i < parts.length; i++) {
                    let key = parts[i];
                    let existing = vertexMap.get(key);
                    if (existing !== undefined) {
                        faceVerts.push(existing);
                        continue;
                    }
                    let segs = key.split('/');
                    let pi = parseInt(segs[0]) - 1;
                    let ti = segs.length > 1 && segs[1] ? parseInt(segs[1]) - 1 : -1;
                    let ni = segs.length > 2 && segs[2] ? parseInt(segs[2]) - 1 : -1;
                    let pos = positions[pi] || [0, 0, 0];
                    let nor = ni >= 0 ? normals[ni] : [0, 0, 0];
                    let tex = ti >= 0 ? texcoords[ti] : [0, 0];
                    let idx = vertices.length / 8;
                    vertices.push(pos[0], pos[1], pos[2], nor[0], nor[1], nor[2], tex[0], tex[1]);
                    vertexMap.set(key, idx);
                    faceVerts.push(idx);
                }
                for (let i = 1; i < faceVerts.length - 1; i++) {
                    indices.push(faceVerts[0], faceVerts[i], faceVerts[i + 1]);
                }
            }
        }
        if (normals.length === 0) {
            ObjLoader.generateFlatNormals(vertices, indices);
        }
        return new _mesh__WEBPACK_IMPORTED_MODULE_0__.Mesh(vertices, indices);
    }
    static generateFlatNormals(vertices, indices) {
        for (let i = 0; i < vertices.length; i += 8) {
            vertices[i + 3] = 0;
            vertices[i + 4] = 0;
            vertices[i + 5] = 0;
        }
        for (let i = 0; i < indices.length; i += 3) {
            let a = indices[i] * 8, b = indices[i + 1] * 8, c = indices[i + 2] * 8;
            let ax = vertices[a], ay = vertices[a + 1], az = vertices[a + 2];
            let bx = vertices[b], by = vertices[b + 1], bz = vertices[b + 2];
            let cx = vertices[c], cy = vertices[c + 1], cz = vertices[c + 2];
            let e1x = bx - ax, e1y = by - ay, e1z = bz - az;
            let e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
            let nx = e1y * e2z - e1z * e2y;
            let ny = e1z * e2x - e1x * e2z;
            let nz = e1x * e2y - e1y * e2x;
            for (let vi of [a, b, c]) {
                vertices[vi + 3] += nx;
                vertices[vi + 4] += ny;
                vertices[vi + 5] += nz;
            }
        }
        for (let i = 0; i < vertices.length; i += 8) {
            let nx = vertices[i + 3], ny = vertices[i + 4], nz = vertices[i + 5];
            let len = Math.sqrt(nx * nx + ny * ny + nz * nz);
            if (len > 0) {
                vertices[i + 3] /= len;
                vertices[i + 4] /= len;
                vertices[i + 5] /= len;
            }
        }
    }
}


/***/ },

/***/ "./BdvEngine/core/assets/assetManager.ts"
/*!***********************************************!*\
  !*** ./BdvEngine/core/assets/assetManager.ts ***!
  \***********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AssetManager: () => (/* binding */ AssetManager),
/* harmony export */   MESSAGE_ASSET_LOADER_LOADED: () => (/* binding */ MESSAGE_ASSET_LOADER_LOADED)
/* harmony export */ });
/* harmony import */ var _com_message__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../com/message */ "./BdvEngine/core/com/message.ts");
/* harmony import */ var _imageAssetLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./imageAssetLoader */ "./BdvEngine/core/assets/imageAssetLoader.ts");
/* harmony import */ var _jsonAssetLoader__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./jsonAssetLoader */ "./BdvEngine/core/assets/jsonAssetLoader.ts");



const MESSAGE_ASSET_LOADER_LOADED = "MESSAGE_ASSET_LOADER_LOADED";
class AssetManager {
    constructor() { }
    static init() {
        AssetManager.loaders.push(new _imageAssetLoader__WEBPACK_IMPORTED_MODULE_1__.ImageAssetLoader());
        AssetManager.loaders.push(new _jsonAssetLoader__WEBPACK_IMPORTED_MODULE_2__.JsonAssetLoader());
    }
    static register(loader) {
        AssetManager.loaders.push(loader);
    }
    static onLoaded(asset) {
        AssetManager.assetsPool[asset.name] = asset;
        _com_message__WEBPACK_IMPORTED_MODULE_0__.Message.send(`${MESSAGE_ASSET_LOADER_LOADED}::${asset.name}`, this, asset);
    }
    static loadAsset(assetName) {
        let ext = assetName.split(".").pop().toLowerCase();
        for (let loader of AssetManager.loaders) {
            if (loader.supportedExtensions.indexOf(ext) !== -1) {
                loader.loadAsset(assetName);
                return;
            }
        }
        console.log(`AssetManager::Unable to load asset with the defined extension ${ext}.`);
    }
    static isLoaded(assetName) {
        return !!AssetManager.assetsPool[assetName];
    }
    static get(assetName) {
        if (AssetManager.assetsPool[assetName] !== undefined) {
            return AssetManager.assetsPool[assetName];
        }
        else
            AssetManager.loadAsset(assetName);
        return undefined;
    }
}
AssetManager.loaders = [];
AssetManager.assetsPool = {};


/***/ },

/***/ "./BdvEngine/core/assets/imageAssetLoader.ts"
/*!***************************************************!*\
  !*** ./BdvEngine/core/assets/imageAssetLoader.ts ***!
  \***************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ImageAsset: () => (/* binding */ ImageAsset),
/* harmony export */   ImageAssetLoader: () => (/* binding */ ImageAssetLoader)
/* harmony export */ });
/* harmony import */ var _assetManager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./assetManager */ "./BdvEngine/core/assets/assetManager.ts");

class ImageAsset {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }
    get width() {
        return this.data.width;
    }
    get height() {
        return this.data.height;
    }
}
class ImageAssetLoader {
    get supportedExtensions() {
        return ["png", "gif", "jpg"];
    }
    loadAsset(assetName) {
        let image = new Image();
        image.onload = this.onImageLoaded.bind(this, assetName, image);
        image.src = assetName;
    }
    onImageLoaded(assetName, image) {
        console.log("onImageLoaded: assetName/image", assetName, image);
        let asset = new ImageAsset(assetName, image);
        _assetManager__WEBPACK_IMPORTED_MODULE_0__.AssetManager.onLoaded(asset);
    }
}


/***/ },

/***/ "./BdvEngine/core/assets/jsonAssetLoader.ts"
/*!**************************************************!*\
  !*** ./BdvEngine/core/assets/jsonAssetLoader.ts ***!
  \**************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   JsonAsset: () => (/* binding */ JsonAsset),
/* harmony export */   JsonAssetLoader: () => (/* binding */ JsonAssetLoader)
/* harmony export */ });
/* harmony import */ var _assetManager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./assetManager */ "./BdvEngine/core/assets/assetManager.ts");

class JsonAsset {
    constructor(name, data) {
        this.name = name;
        this.data = data;
    }
}
class JsonAssetLoader {
    get supportedExtensions() {
        return ["json"];
    }
    loadAsset(assetName) {
        let request = new XMLHttpRequest();
        request.open("GET", assetName);
        request.addEventListener("load", this.onJsonLoaded.bind(this, assetName, request));
        request.send();
    }
    onJsonLoaded(assetName, request) {
        console.log("onJsonLoaded: assetName/request", assetName, request);
        if (request.readyState === request.DONE) {
            let json = JSON.parse(request.responseText);
            let asset = new JsonAsset(assetName, json);
            _assetManager__WEBPACK_IMPORTED_MODULE_0__.AssetManager.onLoaded(asset);
        }
    }
}


/***/ },

/***/ "./BdvEngine/core/behaviors/baseBehavior.ts"
/*!**************************************************!*\
  !*** ./BdvEngine/core/behaviors/baseBehavior.ts ***!
  \**************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BaseBehavior: () => (/* binding */ BaseBehavior)
/* harmony export */ });
class BaseBehavior {
    constructor(data) {
        this._data = data;
        this.name = this._data.name;
    }
    setOwner(owner) {
        this._owner = owner;
    }
    update(time) { }
    apply(userData) { }
}


/***/ },

/***/ "./BdvEngine/core/behaviors/behaviorManager.ts"
/*!*****************************************************!*\
  !*** ./BdvEngine/core/behaviors/behaviorManager.ts ***!
  \*****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BehaviorManager: () => (/* binding */ BehaviorManager)
/* harmony export */ });
class BehaviorManager {
    static registerBuilder(builder) {
        BehaviorManager.registeredBuilders[builder.type] = builder;
    }
    static extractBehavior(json) {
        if (json.type !== undefined) {
            if (BehaviorManager.registeredBuilders[String(json.type)] !== undefined) {
                return BehaviorManager.registeredBuilders[String(json.type)].buildFromJson(json);
            }
            throw new Error("BehaviorManager::Behavior manager error - type is missing or builder is not registered for this type.");
        }
        throw new Error("BehaviorManager::Behavior type is missing.");
    }
}
BehaviorManager.registeredBuilders = {};


/***/ },

/***/ "./BdvEngine/core/behaviors/keyboardMovementBehavior.ts"
/*!**************************************************************!*\
  !*** ./BdvEngine/core/behaviors/keyboardMovementBehavior.ts ***!
  \**************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   KeyboardMovementBehavior: () => (/* binding */ KeyboardMovementBehavior),
/* harmony export */   KeyboardMovementBehaviorBuilder: () => (/* binding */ KeyboardMovementBehaviorBuilder),
/* harmony export */   KeyboardMovementBehaviorData: () => (/* binding */ KeyboardMovementBehaviorData)
/* harmony export */ });
/* harmony import */ var _baseBehavior__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./baseBehavior */ "./BdvEngine/core/behaviors/baseBehavior.ts");
/* harmony import */ var _input_inputManager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../input/inputManager */ "./BdvEngine/core/input/inputManager.ts");
/* harmony import */ var _behaviorManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./behaviorManager */ "./BdvEngine/core/behaviors/behaviorManager.ts");



class KeyboardMovementBehaviorData {
    constructor() {
        this.speed = 0.1;
    }
    setFromJson(json) {
        if (json.name === undefined) {
            throw new Error("Name must be defined in behavior data.");
        }
        this.name = String(json.name);
        if (json.speed !== undefined) {
            this.speed = Number(json.speed);
        }
    }
}
class KeyboardMovementBehaviorBuilder {
    get type() {
        return "keyboardMovement";
    }
    buildFromJson(json) {
        let data = new KeyboardMovementBehaviorData();
        data.setFromJson(json);
        return new KeyboardMovementBehavior(data);
    }
}
class KeyboardMovementBehavior extends _baseBehavior__WEBPACK_IMPORTED_MODULE_0__.BaseBehavior {
    constructor(data) {
        super(data);
        this.speed = 0.1;
        this.speed = data.speed;
    }
    update(time) {
        if (_input_inputManager__WEBPACK_IMPORTED_MODULE_1__.InputManager.isKeyDown(_input_inputManager__WEBPACK_IMPORTED_MODULE_1__.Keys.LEFT)) {
            this._owner.transform.position.vx -= this.speed;
        }
        if (_input_inputManager__WEBPACK_IMPORTED_MODULE_1__.InputManager.isKeyDown(_input_inputManager__WEBPACK_IMPORTED_MODULE_1__.Keys.RIGHT)) {
            this._owner.transform.position.vx += this.speed;
        }
        if (_input_inputManager__WEBPACK_IMPORTED_MODULE_1__.InputManager.isKeyDown(_input_inputManager__WEBPACK_IMPORTED_MODULE_1__.Keys.UP)) {
            this._owner.transform.position.vy -= this.speed;
        }
        if (_input_inputManager__WEBPACK_IMPORTED_MODULE_1__.InputManager.isKeyDown(_input_inputManager__WEBPACK_IMPORTED_MODULE_1__.Keys.DOWN)) {
            this._owner.transform.position.vy += this.speed;
        }
        super.update(time);
    }
}
_behaviorManager__WEBPACK_IMPORTED_MODULE_2__.BehaviorManager.registerBuilder(new KeyboardMovementBehaviorBuilder());


/***/ },

/***/ "./BdvEngine/core/behaviors/rayCastBehavior.ts"
/*!*****************************************************!*\
  !*** ./BdvEngine/core/behaviors/rayCastBehavior.ts ***!
  \*****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RayCastBehavior: () => (/* binding */ RayCastBehavior),
/* harmony export */   RayCastBehaviorBuilder: () => (/* binding */ RayCastBehaviorBuilder),
/* harmony export */   RayCastBehaviorData: () => (/* binding */ RayCastBehaviorData)
/* harmony export */ });
/* harmony import */ var _baseBehavior__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./baseBehavior */ "./BdvEngine/core/behaviors/baseBehavior.ts");
/* harmony import */ var _behaviorManager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./behaviorManager */ "./BdvEngine/core/behaviors/behaviorManager.ts");
/* harmony import */ var _utils_collision__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/collision */ "./BdvEngine/core/utils/collision.ts");
/* harmony import */ var _rigidBodyBehavior__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./rigidBodyBehavior */ "./BdvEngine/core/behaviors/rigidBodyBehavior.ts");
/* harmony import */ var _input_inputManager__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../input/inputManager */ "./BdvEngine/core/input/inputManager.ts");
/* harmony import */ var _graphics_draw__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../graphics/draw */ "./BdvEngine/core/graphics/draw.ts");
/* harmony import */ var _graphics_color__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../graphics/color */ "./BdvEngine/core/graphics/color.ts");







class RayCastBehaviorData {
    constructor() {
        this.name = 'rayCast';
        this.color = new _graphics_color__WEBPACK_IMPORTED_MODULE_6__.Color(255, 255, 0, 150);
        this.hitColor = new _graphics_color__WEBPACK_IMPORTED_MODULE_6__.Color(255, 0, 0, 255);
        this.hitRadius = 5;
        this.useMouseTarget = true;
    }
    setFromJson(json) {
        if (json.name !== undefined)
            this.name = String(json.name);
    }
}
class RayCastBehaviorBuilder {
    get type() { return "rayCast"; }
    buildFromJson(json) {
        let data = new RayCastBehaviorData();
        data.setFromJson(json);
        return new RayCastBehavior(data);
    }
}
class RayCastBehavior extends _baseBehavior__WEBPACK_IMPORTED_MODULE_0__.BaseBehavior {
    constructor(data) {
        super(data);
        this.hitX = 0;
        this.hitY = 0;
        this.hasHit = false;
        this.targetX = 0;
        this.targetY = 0;
        this.rayColor = data.color;
        this.hitColor = data.hitColor;
        this.hitRadius = data.hitRadius;
    }
    update(time) {
        if (!this._owner)
            return;
        let pos = this._owner.transform.position;
        let mouse = _input_inputManager__WEBPACK_IMPORTED_MODULE_4__.InputManager.getMousePosition();
        let dx = this.targetX - pos.vx;
        let dy = this.targetY - pos.vy;
        let len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0)
            return;
        dx /= len;
        dy /= len;
        this.hasHit = false;
        let closestT = Infinity;
        for (let body of _rigidBodyBehavior__WEBPACK_IMPORTED_MODULE_3__.RigidBodyBehavior.allBodies) {
            if (body === this._owner.getBehavior("rigidBody"))
                continue;
            if (!body.collider)
                continue;
            let col = body.collider;
            let t = -1;
            if (col.shape === 'rect') {
                let r = col.getWorldRect();
                t = _utils_collision__WEBPACK_IMPORTED_MODULE_2__.Collision.rayRect(pos.vx, pos.vy, dx, dy, r.x, r.y, r.w, r.h);
            }
            else {
                let c = col.getWorldCircle();
                let ox = pos.vx - c.x, oy = pos.vy - c.y;
                let a = dx * dx + dy * dy;
                let b2 = ox * dx + oy * dy;
                let cc = ox * ox + oy * oy - c.r * c.r;
                let disc = b2 * b2 - a * cc;
                if (disc >= 0) {
                    t = (-b2 - Math.sqrt(disc)) / a;
                    if (t < 0)
                        t = (-b2 + Math.sqrt(disc)) / a;
                }
            }
            if (t >= 0 && t < closestT) {
                closestT = t;
                this.hitX = pos.vx + dx * t;
                this.hitY = pos.vy + dy * t;
                this.hasHit = true;
            }
        }
        if (this.hasHit) {
            _graphics_draw__WEBPACK_IMPORTED_MODULE_5__.Draw.line(pos.vx, pos.vy, this.hitX, this.hitY, this.rayColor);
            _graphics_draw__WEBPACK_IMPORTED_MODULE_5__.Draw.circle(this.hitX, this.hitY, this.hitRadius, this.hitColor);
        }
        else {
            _graphics_draw__WEBPACK_IMPORTED_MODULE_5__.Draw.line(pos.vx, pos.vy, this.targetX, this.targetY, new _graphics_color__WEBPACK_IMPORTED_MODULE_6__.Color(this.rayColor.r, this.rayColor.g, this.rayColor.b, 50));
        }
    }
}
_behaviorManager__WEBPACK_IMPORTED_MODULE_1__.BehaviorManager.registerBuilder(new RayCastBehaviorBuilder());


/***/ },

/***/ "./BdvEngine/core/behaviors/rigidBodyBehavior.ts"
/*!*******************************************************!*\
  !*** ./BdvEngine/core/behaviors/rigidBodyBehavior.ts ***!
  \*******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RigidBodyBehavior: () => (/* binding */ RigidBodyBehavior),
/* harmony export */   RigidBodyBehaviorBuilder: () => (/* binding */ RigidBodyBehaviorBuilder),
/* harmony export */   RigidBodyBehaviorData: () => (/* binding */ RigidBodyBehaviorData)
/* harmony export */ });
/* harmony import */ var _baseBehavior__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./baseBehavior */ "./BdvEngine/core/behaviors/baseBehavior.ts");
/* harmony import */ var _behaviorManager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./behaviorManager */ "./BdvEngine/core/behaviors/behaviorManager.ts");
/* harmony import */ var _components_colliderComponent__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../components/colliderComponent */ "./BdvEngine/core/components/colliderComponent.ts");
/* harmony import */ var _utils_collision__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/collision */ "./BdvEngine/core/utils/collision.ts");




class RigidBodyBehaviorData {
    constructor() {
        this.name = 'rigidBody';
        this.vx = 0;
        this.vy = 0;
        this.gravity = 0;
        this.bounceDamping = 0.7;
        this.friction = 0.99;
        this.kinematic = false;
    }
    setFromJson(json) {
        if (json.name !== undefined)
            this.name = String(json.name);
        if (json.vx !== undefined)
            this.vx = Number(json.vx);
        if (json.vy !== undefined)
            this.vy = Number(json.vy);
        if (json.gravity !== undefined)
            this.gravity = Number(json.gravity);
        if (json.bounceDamping !== undefined)
            this.bounceDamping = Number(json.bounceDamping);
        if (json.friction !== undefined)
            this.friction = Number(json.friction);
        if (json.kinematic !== undefined)
            this.kinematic = Boolean(json.kinematic);
    }
}
class RigidBodyBehaviorBuilder {
    get type() { return "rigidBody"; }
    buildFromJson(json) {
        let data = new RigidBodyBehaviorData();
        data.setFromJson(json);
        return new RigidBodyBehavior(data);
    }
}
class RigidBodyBehavior extends _baseBehavior__WEBPACK_IMPORTED_MODULE_0__.BaseBehavior {
    static beginFrame() {
        RigidBodyBehavior.resolvedPairs.clear();
    }
    constructor(data) {
        super(data);
        this.collider = null;
        this.vx = data.vx;
        this.vy = data.vy;
        this.gravity = data.gravity;
        this.bounceDamping = data.bounceDamping;
        this.friction = data.friction;
        this.kinematic = data.kinematic;
    }
    setOwner(owner) {
        super.setOwner(owner);
        RigidBodyBehavior.allBodies.push(this);
    }
    static clearAll() {
        RigidBodyBehavior.allBodies = [];
    }
    update(time) {
        if (!this._owner)
            return;
        if (!this.collider) {
            let comp = this._owner.getComponent("collider");
            if (comp instanceof _components_colliderComponent__WEBPACK_IMPORTED_MODULE_2__.ColliderComponent) {
                this.collider = comp;
            }
            if (!this.collider)
                return;
        }
        if (this.collider.isStatic)
            return;
        let pos = this._owner.transform.position;
        if (!this.kinematic) {
            this.vy += this.gravity * time;
            pos.vx += this.vx * time;
            pos.vy += this.vy * time;
        }
        let myIdx = RigidBodyBehavior.allBodies.indexOf(this);
        for (let i = 0; i < RigidBodyBehavior.allBodies.length; i++) {
            let other = RigidBodyBehavior.allBodies[i];
            if (other === this || !other.collider)
                continue;
            if (!other.collider.isStatic && !other.kinematic) {
                let lo = Math.min(myIdx, i);
                let hi = Math.max(myIdx, i);
                let pairKey = `${lo}:${hi}`;
                if (RigidBodyBehavior.resolvedPairs.has(pairKey))
                    continue;
                RigidBodyBehavior.resolvedPairs.add(pairKey);
            }
            this.resolveCollision(other);
        }
        for (let other of RigidBodyBehavior.allBodies) {
            if (other === this || !other.collider)
                continue;
            if (!other.collider.isStatic)
                continue;
            if (this.collider.shape === 'rect' && other.collider.shape === 'rect') {
                let a = this.collider.getWorldRect();
                let b = other.collider.getWorldRect();
                let ov = _utils_collision__WEBPACK_IMPORTED_MODULE_3__.Collision.rectOverlap(a.x, a.y, a.w, a.h, b.x, b.y, b.w, b.h);
                if (ov) {
                    pos.vx += ov.x;
                    pos.vy += ov.y;
                    if (ov.x !== 0)
                        this.vx = 0;
                    if (ov.y !== 0)
                        this.vy = 0;
                }
            }
        }
    }
    wouldOverlapStatic(newX, newY, col) {
        for (let body of RigidBodyBehavior.allBodies) {
            if (!body.collider || !body.collider.isStatic)
                continue;
            let s = body.collider;
            if (col.shape === 'rect' && s.shape === 'rect') {
                let sr = s.getWorldRect();
                if (_utils_collision__WEBPACK_IMPORTED_MODULE_3__.Collision.rectRect(newX - col.width / 2, newY - col.height / 2, col.width, col.height, sr.x, sr.y, sr.w, sr.h))
                    return true;
            }
            else if (col.shape === 'circle' && s.shape === 'rect') {
                let sr = s.getWorldRect();
                if (_utils_collision__WEBPACK_IMPORTED_MODULE_3__.Collision.circleRect(newX, newY, col.radius, sr.x, sr.y, sr.w, sr.h))
                    return true;
            }
        }
        return false;
    }
    resolveCollision(other) {
        let myCol = this.collider;
        let otherCol = other.collider;
        let myPos = this._owner.transform.position;
        let otherPos = other._owner.transform.position;
        let isStatic = otherCol.isStatic || other.kinematic;
        if (myCol.shape === 'rect' && otherCol.shape === 'rect') {
            let a = myCol.getWorldRect();
            let b = otherCol.getWorldRect();
            let overlap = _utils_collision__WEBPACK_IMPORTED_MODULE_3__.Collision.rectOverlap(a.x, a.y, a.w, a.h, b.x, b.y, b.w, b.h);
            if (overlap) {
                if (isStatic) {
                    myPos.vx += overlap.x;
                    myPos.vy += overlap.y;
                    if (overlap.x > 0 && this.vx < 0)
                        this.vx = -this.vx * this.bounceDamping;
                    else if (overlap.x < 0 && this.vx > 0)
                        this.vx = -this.vx * this.bounceDamping;
                    if (overlap.y > 0 && this.vy < 0) {
                        this.vy = -this.vy * this.bounceDamping;
                        this.vx *= this.friction;
                    }
                    else if (overlap.y < 0 && this.vy > 0) {
                        this.vy = -this.vy * this.bounceDamping;
                        this.vx *= this.friction;
                    }
                }
                else {
                    myPos.vx += overlap.x / 2;
                    myPos.vy += overlap.y / 2;
                    otherPos.vx -= overlap.x / 2;
                    otherPos.vy -= overlap.y / 2;
                    if (Math.abs(overlap.x) > Math.abs(overlap.y)) {
                        let t = this.vx;
                        this.vx = other.vx;
                        other.vx = t;
                    }
                    else {
                        let t = this.vy;
                        this.vy = other.vy;
                        other.vy = t;
                    }
                }
            }
        }
        else if (myCol.shape === 'circle' && otherCol.shape === 'circle') {
            let a = myCol.getWorldCircle();
            let b = otherCol.getWorldCircle();
            if (_utils_collision__WEBPACK_IMPORTED_MODULE_3__.Collision.circleCircle(a.x, a.y, a.r, b.x, b.y, b.r)) {
                let dx = b.x - a.x, dy = b.y - a.y;
                let dist = Math.sqrt(dx * dx + dy * dy) || 1;
                let nx = dx / dist, ny = dy / dist;
                let pen = (a.r + b.r) - dist;
                if (isStatic) {
                    myPos.vx -= nx * pen;
                    myPos.vy -= ny * pen;
                    let dot = this.vx * nx + this.vy * ny;
                    this.vx -= 2 * dot * nx * this.bounceDamping;
                    this.vy -= 2 * dot * ny * this.bounceDamping;
                }
                else {
                    myPos.vx -= nx * pen / 2;
                    myPos.vy -= ny * pen / 2;
                    otherPos.vx += nx * pen / 2;
                    otherPos.vy += ny * pen / 2;
                    let aVn = this.vx * nx + this.vy * ny;
                    let bVn = other.vx * nx + other.vy * ny;
                    this.vx += (bVn - aVn) * nx;
                    this.vy += (bVn - aVn) * ny;
                    other.vx += (aVn - bVn) * nx;
                    other.vy += (aVn - bVn) * ny;
                }
            }
        }
        else if (myCol.shape === 'circle' && otherCol.shape === 'rect') {
            let c = myCol.getWorldCircle();
            let r = otherCol.getWorldRect();
            if (_utils_collision__WEBPACK_IMPORTED_MODULE_3__.Collision.circleRect(c.x, c.y, c.r, r.x, r.y, r.w, r.h)) {
                let nearestX = Math.max(r.x, Math.min(c.x, r.x + r.w));
                let nearestY = Math.max(r.y, Math.min(c.y, r.y + r.h));
                let dx = c.x - nearestX, dy = c.y - nearestY;
                let dist = Math.sqrt(dx * dx + dy * dy) || 1;
                let nx = dx / dist, ny = dy / dist;
                let pen = c.r - dist;
                myPos.vx += nx * pen;
                myPos.vy += ny * pen;
                let dot = this.vx * nx + this.vy * ny;
                let damp = isStatic ? this.bounceDamping : 1.0;
                this.vx -= 2 * dot * nx * damp;
                this.vy -= 2 * dot * ny * damp;
            }
        }
        else if (myCol.shape === 'rect' && otherCol.shape === 'circle') {
            let r = myCol.getWorldRect();
            let c = otherCol.getWorldCircle();
            if (_utils_collision__WEBPACK_IMPORTED_MODULE_3__.Collision.circleRect(c.x, c.y, c.r, r.x, r.y, r.w, r.h)) {
                let nearestX = Math.max(r.x, Math.min(c.x, r.x + r.w));
                let nearestY = Math.max(r.y, Math.min(c.y, r.y + r.h));
                let dx = myPos.vx - c.x, dy = myPos.vy - c.y;
                let dist = Math.sqrt(dx * dx + dy * dy) || 1;
                let nx = dx / dist, ny = dy / dist;
                let overlap = _utils_collision__WEBPACK_IMPORTED_MODULE_3__.Collision.rectOverlap(r.x, r.y, r.w, r.h, c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
                if (overlap) {
                    myPos.vx += overlap.x;
                    myPos.vy += overlap.y;
                    if (isStatic) {
                        if (overlap.x !== 0)
                            this.vx = -this.vx * this.bounceDamping;
                        if (overlap.y !== 0)
                            this.vy = -this.vy * this.bounceDamping;
                    }
                    else {
                        if (overlap.x !== 0) {
                            let t = this.vx;
                            this.vx = other.vx;
                            other.vx = t;
                        }
                        if (overlap.y !== 0) {
                            let t = this.vy;
                            this.vy = other.vy;
                            other.vy = t;
                        }
                    }
                }
            }
        }
    }
}
RigidBodyBehavior.allBodies = [];
RigidBodyBehavior.resolvedPairs = new Set();
_behaviorManager__WEBPACK_IMPORTED_MODULE_1__.BehaviorManager.registerBuilder(new RigidBodyBehaviorBuilder());


/***/ },

/***/ "./BdvEngine/core/behaviors/rotationBehavior.ts"
/*!******************************************************!*\
  !*** ./BdvEngine/core/behaviors/rotationBehavior.ts ***!
  \******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RotationBehavior: () => (/* binding */ RotationBehavior),
/* harmony export */   RotationBehaviorBuilder: () => (/* binding */ RotationBehaviorBuilder),
/* harmony export */   RotationBehaviorData: () => (/* binding */ RotationBehaviorData)
/* harmony export */ });
/* harmony import */ var _baseBehavior__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./baseBehavior */ "./BdvEngine/core/behaviors/baseBehavior.ts");
/* harmony import */ var _utils_vec3__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/vec3 */ "./BdvEngine/core/utils/vec3.ts");
/* harmony import */ var _behaviorManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./behaviorManager */ "./BdvEngine/core/behaviors/behaviorManager.ts");



class RotationBehaviorData {
    constructor() {
        this.rotation = _utils_vec3__WEBPACK_IMPORTED_MODULE_1__.vec3.zero;
    }
    setFromJson(json) {
        if (json.name === undefined) {
            throw new Error("Name must be defined in behavior data.");
        }
        this.name = String(json.name);
        if (json.rotation !== undefined) {
            this.rotation.setFromJson(json.rotation);
        }
    }
}
class RotationBehaviorBuilder {
    get type() {
        return "rotation";
    }
    buildFromJson(json) {
        let data = new RotationBehaviorData();
        data.setFromJson(json);
        return new RotationBehavior(data);
    }
}
class RotationBehavior extends _baseBehavior__WEBPACK_IMPORTED_MODULE_0__.BaseBehavior {
    constructor(data) {
        super(data);
        this.rotation = data.rotation;
    }
    update(time) {
        this._owner.transform.rotation.add(this.rotation);
        super.update(time);
    }
}
_behaviorManager__WEBPACK_IMPORTED_MODULE_2__.BehaviorManager.registerBuilder(new RotationBehaviorBuilder());


/***/ },

/***/ "./BdvEngine/core/behaviors/statefulAnimationBehavior.ts"
/*!***************************************************************!*\
  !*** ./BdvEngine/core/behaviors/statefulAnimationBehavior.ts ***!
  \***************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   StatefulAnimationBehavior: () => (/* binding */ StatefulAnimationBehavior),
/* harmony export */   StatefulAnimationBehaviorBuilder: () => (/* binding */ StatefulAnimationBehaviorBuilder),
/* harmony export */   StatefulAnimationBehaviorData: () => (/* binding */ StatefulAnimationBehaviorData)
/* harmony export */ });
/* harmony import */ var _baseBehavior__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./baseBehavior */ "./BdvEngine/core/behaviors/baseBehavior.ts");
/* harmony import */ var _behaviorManager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./behaviorManager */ "./BdvEngine/core/behaviors/behaviorManager.ts");
/* harmony import */ var _components_animatedSpriteComponent__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../components/animatedSpriteComponent */ "./BdvEngine/core/components/animatedSpriteComponent.ts");



class StatefulAnimationBehaviorData {
    constructor() {
        this.componentName = "";
        this.states = {};
        this.defaultState = "";
        this.frameTime = 100;
    }
    setFromJson(json) {
        if (json.name === undefined)
            throw new Error("Name must be defined in behavior data.");
        this.name = String(json.name);
        if (json.componentName !== undefined)
            this.componentName = String(json.componentName);
        if (json.states !== undefined)
            this.states = json.states;
        if (json.defaultState !== undefined)
            this.defaultState = String(json.defaultState);
        if (json.frameTime !== undefined)
            this.frameTime = Number(json.frameTime);
    }
}
class StatefulAnimationBehaviorBuilder {
    get type() { return "statefulAnimation"; }
    buildFromJson(json) {
        let data = new StatefulAnimationBehaviorData();
        data.setFromJson(json);
        return new StatefulAnimationBehavior(data);
    }
}
class StatefulAnimationBehavior extends _baseBehavior__WEBPACK_IMPORTED_MODULE_0__.BaseBehavior {
    constructor(data) {
        super(data);
        this.states = new Map();
        this.currentState = "";
        this.component = null;
        this.componentName = data.componentName;
        this.frameTime = data.frameTime;
        for (let key in data.states) {
            this.states.set(key, data.states[key]);
        }
        if (data.defaultState) {
            this.currentState = data.defaultState;
        }
    }
    addState(name, frameSequence) {
        this.states.set(name, frameSequence);
        if (this.currentState === "")
            this.currentState = name;
    }
    setState(name) {
        if (name === this.currentState)
            return;
        if (!this.states.has(name))
            return;
        this.currentState = name;
        this.resolveComponent();
        if (this.component) {
            let seq = this.states.get(name);
            this.component.sprite.setFrameSequence(seq);
            this.component.sprite.setFrameTime(this.frameTime);
        }
    }
    getState() {
        return this.currentState;
    }
    update(time) {
        if (!this.component) {
            this.resolveComponent();
            if (this.component && this.currentState) {
                let seq = this.states.get(this.currentState);
                if (seq) {
                    this.component.sprite.setFrameSequence(seq);
                    this.component.sprite.setFrameTime(this.frameTime);
                }
            }
        }
    }
    resolveComponent() {
        if (this.component || !this._owner)
            return;
        let comp = this._owner.getComponent(this.componentName);
        if (comp && comp instanceof _components_animatedSpriteComponent__WEBPACK_IMPORTED_MODULE_2__.AnimatedSpriteComponent) {
            this.component = comp;
        }
    }
}
_behaviorManager__WEBPACK_IMPORTED_MODULE_1__.BehaviorManager.registerBuilder(new StatefulAnimationBehaviorBuilder());


/***/ },

/***/ "./BdvEngine/core/camera2d.ts"
/*!************************************!*\
  !*** ./BdvEngine/core/camera2d.ts ***!
  \************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Camera2D: () => (/* binding */ Camera2D)
/* harmony export */ });
/* harmony import */ var _utils_m4x4__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils/m4x4 */ "./BdvEngine/core/utils/m4x4.ts");

class Camera2D {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
    }
    getProjection(viewportWidth, viewportHeight) {
        let halfW = viewportWidth / 2 / this.zoom;
        let halfH = viewportHeight / 2 / this.zoom;
        return _utils_m4x4__WEBPACK_IMPORTED_MODULE_0__.m4x4.ortho(this.x - halfW, this.x + halfW, this.y + halfH, this.y - halfH, -100, 100);
    }
    screenToWorld(screenX, screenY, viewportWidth, viewportHeight) {
        return {
            x: this.x + (screenX - viewportWidth / 2) / this.zoom,
            y: this.y + (screenY - viewportHeight / 2) / this.zoom,
        };
    }
    worldToScreen(worldX, worldY, viewportWidth, viewportHeight) {
        return {
            x: (worldX - this.x) * this.zoom + viewportWidth / 2,
            y: (worldY - this.y) * this.zoom + viewportHeight / 2,
        };
    }
}


/***/ },

/***/ "./BdvEngine/core/com/message.ts"
/*!***************************************!*\
  !*** ./BdvEngine/core/com/message.ts ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Message: () => (/* binding */ Message),
/* harmony export */   MessagePriority: () => (/* binding */ MessagePriority)
/* harmony export */ });
/* harmony import */ var _messageBus__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./messageBus */ "./BdvEngine/core/com/messageBus.ts");

var MessagePriority;
(function (MessagePriority) {
    MessagePriority[MessagePriority["DEFAULT"] = 0] = "DEFAULT";
    MessagePriority[MessagePriority["CRITICAL"] = 1] = "CRITICAL";
})(MessagePriority || (MessagePriority = {}));
class Message {
    constructor(code, sender, context, priority = MessagePriority.DEFAULT) {
        this.code = code;
        this.sender = sender;
        this.context = context;
        this.priority = priority;
    }
    static send(code, sender, context) {
        _messageBus__WEBPACK_IMPORTED_MODULE_0__.MessageBus.emit(new Message(code, sender, context, MessagePriority.DEFAULT));
    }
    static sendCritical(code, sender, context) {
        _messageBus__WEBPACK_IMPORTED_MODULE_0__.MessageBus.emit(new Message(code, sender, context, MessagePriority.CRITICAL));
    }
    static subscribe(code, handler) {
        _messageBus__WEBPACK_IMPORTED_MODULE_0__.MessageBus.subscribe(code, handler);
    }
    static unsubscribe(code, handler) {
        _messageBus__WEBPACK_IMPORTED_MODULE_0__.MessageBus.unsubscribe(code, handler);
    }
}


/***/ },

/***/ "./BdvEngine/core/com/messageBus.ts"
/*!******************************************!*\
  !*** ./BdvEngine/core/com/messageBus.ts ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MessageBus: () => (/* binding */ MessageBus)
/* harmony export */ });
/* harmony import */ var _message__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./message */ "./BdvEngine/core/com/message.ts");
/* harmony import */ var _subscriptionNode__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./subscriptionNode */ "./BdvEngine/core/com/subscriptionNode.ts");


class MessageBus {
    constructor() { }
    static subscribe(code, handler) {
        if (!MessageBus.subs[code]) {
            MessageBus.subs[code] = [];
        }
        if (MessageBus.subs[code].indexOf(handler) !== -1) {
            console.log(`MessageBus::Attempting to push duplicate handler to messaging code ${code}. No subscription added.`);
        }
        else {
            MessageBus.subs[code].push(handler);
        }
    }
    static unsubscribe(code, handler) {
        if (!MessageBus.subs[code]) {
            console.log(`MessageBus::There is no such handler subscribed to code ${code}.`);
            return;
        }
        if (MessageBus.subs[code].indexOf(handler) !== -1) {
            MessageBus.subs[code].splice(MessageBus.subs[code].indexOf(handler), 1);
        }
    }
    static emit(message) {
        console.log(`MessageBus::Message Emitted: ${JSON.stringify(message)}`);
        let handlers = MessageBus.subs[message.code];
        if (!handlers)
            return;
        for (let handler of handlers) {
            if (message.priority === _message__WEBPACK_IMPORTED_MODULE_0__.MessagePriority.CRITICAL) {
                handler.onMessage(message);
            }
            else {
                MessageBus.messageQueue.push(new _subscriptionNode__WEBPACK_IMPORTED_MODULE_1__.SubscriptionNode(message, handler));
            }
        }
    }
    static update(time) {
        if (!MessageBus.messageQueue.length)
            return;
        let limit = Math.min(MessageBus.queueMessageTick, MessageBus.messageQueue.length);
        for (let i = 0; i < limit; i++) {
            let node = MessageBus.messageQueue.shift();
            node.handler.onMessage(node.message);
        }
    }
}
MessageBus.subs = {};
MessageBus.queueMessageTick = 10;
MessageBus.messageQueue = [];


/***/ },

/***/ "./BdvEngine/core/com/subscriptionNode.ts"
/*!************************************************!*\
  !*** ./BdvEngine/core/com/subscriptionNode.ts ***!
  \************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SubscriptionNode: () => (/* binding */ SubscriptionNode)
/* harmony export */ });
class SubscriptionNode {
    constructor(message, handler) {
        this.message = message;
        this.handler = handler;
    }
}


/***/ },

/***/ "./BdvEngine/core/components/animatedSpriteComponent.ts"
/*!**************************************************************!*\
  !*** ./BdvEngine/core/components/animatedSpriteComponent.ts ***!
  \**************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AnimatedSpriteComponent: () => (/* binding */ AnimatedSpriteComponent),
/* harmony export */   AnimatedSpriteComponentBuilder: () => (/* binding */ AnimatedSpriteComponentBuilder),
/* harmony export */   AnimatedSpriteComponentData: () => (/* binding */ AnimatedSpriteComponentData)
/* harmony export */ });
/* harmony import */ var _spriteComponent__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./spriteComponent */ "./BdvEngine/core/components/spriteComponent.ts");
/* harmony import */ var _baseComponent__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./baseComponent */ "./BdvEngine/core/components/baseComponent.ts");
/* harmony import */ var _graphics_animatedSprite__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../graphics/animatedSprite */ "./BdvEngine/core/graphics/animatedSprite.ts");
/* harmony import */ var _componentManager__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./componentManager */ "./BdvEngine/core/components/componentManager.ts");




class AnimatedSpriteComponentData extends _spriteComponent__WEBPACK_IMPORTED_MODULE_0__.SpriteComponentData {
    constructor() {
        super(...arguments);
        this.frameSequence = [];
    }
    setFromJson(json) {
        super.setFromJson(json);
        if (json.frameWidth === undefined) {
            throw new Error("AnimatedSpriteComponentData requires 'frameWidth' to be defined.");
        }
        else {
            this.frameWidth = Number(json.frameWidth);
        }
        if (json.frameHeight === undefined) {
            throw new Error("AnimatedSpriteComponentData requires 'frameHeight' to be defined.");
        }
        else {
            this.frameHeight = Number(json.frameHeight);
        }
        if (json.frameCount === undefined) {
            throw new Error("AnimatedSpriteComponentData requires 'frameCount' to be defined.");
        }
        else {
            this.frameCount = Number(json.frameCount);
        }
        if (json.frameSequence === undefined) {
            throw new Error("AnimatedSpriteComponentData requires 'frameSequence' to be defined.");
        }
        else {
            this.frameSequence = json.frameSequence;
        }
    }
}
class AnimatedSpriteComponentBuilder {
    get type() {
        return "animatedSprite";
    }
    buildFromJson(json) {
        let data = new AnimatedSpriteComponentData();
        data.setFromJson(json);
        return new AnimatedSpriteComponent(data);
    }
}
class AnimatedSpriteComponent extends _baseComponent__WEBPACK_IMPORTED_MODULE_1__.BaseComponent {
    constructor(data) {
        super(data);
        this.sprite = new _graphics_animatedSprite__WEBPACK_IMPORTED_MODULE_2__.AnimatedSprite(this.name, data.materialName, data.frameWidth, data.frameHeight, data.frameWidth, data.frameHeight, data.frameCount, data.frameSequence);
    }
    load() {
        this.sprite.load();
    }
    update(time) {
        this.sprite.update(time);
        super.update(time);
    }
    render(shader) {
        if (this.sprite.hasCustomShader) {
            this.sprite.render(shader, this.getOwner.getWorldMatrix);
        }
        else {
            this.sprite.pushToBatch(this.getOwner.getWorldMatrix);
        }
        super.render(shader);
    }
}
_componentManager__WEBPACK_IMPORTED_MODULE_3__.ComponentManager.registerBuilder(new AnimatedSpriteComponentBuilder());


/***/ },

/***/ "./BdvEngine/core/components/baseComponent.ts"
/*!****************************************************!*\
  !*** ./BdvEngine/core/components/baseComponent.ts ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BaseComponent: () => (/* binding */ BaseComponent)
/* harmony export */ });
class BaseComponent {
    constructor(data) {
        this.data = data;
        this.name = data.name;
    }
    setOwner(owner) {
        this.owner = owner;
    }
    get getOwner() {
        return this.owner;
    }
    load() { }
    unload() { }
    update(deltaTime) { }
    render(shader) { }
}


/***/ },

/***/ "./BdvEngine/core/components/colliderComponent.ts"
/*!********************************************************!*\
  !*** ./BdvEngine/core/components/colliderComponent.ts ***!
  \********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ColliderComponent: () => (/* binding */ ColliderComponent),
/* harmony export */   ColliderComponentBuilder: () => (/* binding */ ColliderComponentBuilder),
/* harmony export */   ColliderComponentData: () => (/* binding */ ColliderComponentData)
/* harmony export */ });
/* harmony import */ var _baseComponent__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./baseComponent */ "./BdvEngine/core/components/baseComponent.ts");
/* harmony import */ var _componentManager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./componentManager */ "./BdvEngine/core/components/componentManager.ts");
/* harmony import */ var _graphics_draw__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../graphics/draw */ "./BdvEngine/core/graphics/draw.ts");
/* harmony import */ var _graphics_color__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../graphics/color */ "./BdvEngine/core/graphics/color.ts");




class ColliderComponentData {
    constructor() {
        this.name = 'collider';
        this.shape = 'rect';
        this.width = 50;
        this.height = 50;
        this.radius = 25;
        this.isStatic = false;
        this.color = _graphics_color__WEBPACK_IMPORTED_MODULE_3__.Color.white();
        this.debugDraw = true;
    }
    setFromJson(json) {
        if (json.name !== undefined)
            this.name = String(json.name);
        if (json.shape !== undefined)
            this.shape = json.shape;
        if (json.width !== undefined)
            this.width = Number(json.width);
        if (json.height !== undefined)
            this.height = Number(json.height);
        if (json.radius !== undefined)
            this.radius = Number(json.radius);
        if (json.isStatic !== undefined)
            this.isStatic = Boolean(json.isStatic);
    }
}
class ColliderComponentBuilder {
    get type() { return "collider"; }
    buildFromJson(json) {
        let data = new ColliderComponentData();
        data.setFromJson(json);
        return new ColliderComponent(data);
    }
}
class ColliderComponent extends _baseComponent__WEBPACK_IMPORTED_MODULE_0__.BaseComponent {
    constructor(data) {
        super(data);
        this.shape = data.shape;
        this.width = data.width;
        this.height = data.height;
        this.radius = data.radius;
        this.isStatic = data.isStatic;
        this.color = data.color;
        this.debugDraw = data.debugDraw;
    }
    getWorldRect() {
        let pos = this.owner.transform.position;
        return {
            x: pos.vx - this.width / 2,
            y: pos.vy - this.height / 2,
            w: this.width,
            h: this.height,
        };
    }
    getWorldCircle() {
        let pos = this.owner.transform.position;
        return { x: pos.vx, y: pos.vy, r: this.radius };
    }
    render(shader) {
        if (!this.debugDraw)
            return;
        let pos = this.owner.transform.position;
        if (this.shape === 'rect') {
            _graphics_draw__WEBPACK_IMPORTED_MODULE_2__.Draw.rect(pos.vx - this.width / 2, pos.vy - this.height / 2, this.width, this.height, this.color);
        }
        else {
            _graphics_draw__WEBPACK_IMPORTED_MODULE_2__.Draw.circle(pos.vx, pos.vy, this.radius, this.color);
        }
    }
}
_componentManager__WEBPACK_IMPORTED_MODULE_1__.ComponentManager.registerBuilder(new ColliderComponentBuilder());


/***/ },

/***/ "./BdvEngine/core/components/componentManager.ts"
/*!*******************************************************!*\
  !*** ./BdvEngine/core/components/componentManager.ts ***!
  \*******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ComponentManager: () => (/* binding */ ComponentManager)
/* harmony export */ });
class ComponentManager {
    static registerBuilder(builder) {
        ComponentManager.registeredBuilders[builder.type] = builder;
    }
    static extractComponent(json) {
        if (json.type !== undefined) {
            if (ComponentManager.registeredBuilders[String(json.type)] !== undefined) {
                return ComponentManager.registeredBuilders[String(json.type)].buildFromJson(json);
            }
            throw new Error("Component manager error - type is missing or builder is not registered for this type.");
        }
        throw new Error("ComponentManager::Component type is missing.");
    }
}
ComponentManager.registeredBuilders = {};


/***/ },

/***/ "./BdvEngine/core/components/spriteComponent.ts"
/*!******************************************************!*\
  !*** ./BdvEngine/core/components/spriteComponent.ts ***!
  \******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SpriteComponent: () => (/* binding */ SpriteComponent),
/* harmony export */   SpriteComponentBuilder: () => (/* binding */ SpriteComponentBuilder),
/* harmony export */   SpriteComponentData: () => (/* binding */ SpriteComponentData)
/* harmony export */ });
/* harmony import */ var _baseComponent__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./baseComponent */ "./BdvEngine/core/components/baseComponent.ts");
/* harmony import */ var _graphics_sprite__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../graphics/sprite */ "./BdvEngine/core/graphics/sprite.ts");
/* harmony import */ var _componentManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./componentManager */ "./BdvEngine/core/components/componentManager.ts");



class SpriteComponentData {
    setFromJson(json) {
        if (json.name !== undefined) {
            this.name = String(json.name);
        }
        if (json.materialName !== undefined) {
            this.materialName = String(json.materialName);
        }
    }
}
class SpriteComponentBuilder {
    get type() {
        return "sprite";
    }
    buildFromJson(json) {
        let data = new SpriteComponentData();
        data.setFromJson(json);
        return new SpriteComponent(data);
    }
}
class SpriteComponent extends _baseComponent__WEBPACK_IMPORTED_MODULE_0__.BaseComponent {
    constructor(data) {
        super(data);
        this.sprite = new _graphics_sprite__WEBPACK_IMPORTED_MODULE_1__.Sprite(this.name, data.materialName);
    }
    load() {
        this.sprite.load();
    }
    render(shader) {
        if (this.sprite.hasCustomShader) {
            this.sprite.render(shader, this.getOwner.getWorldMatrix);
        }
        else {
            this.sprite.pushToBatch(this.getOwner.getWorldMatrix);
        }
        super.render(shader);
    }
}
_componentManager__WEBPACK_IMPORTED_MODULE_2__.ComponentManager.registerBuilder(new SpriteComponentBuilder());


/***/ },

/***/ "./BdvEngine/core/engine.ts"
/*!**********************************!*\
  !*** ./BdvEngine/core/engine.ts ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Engine: () => (/* binding */ Engine)
/* harmony export */ });
/* harmony import */ var _registrations__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./registrations */ "./BdvEngine/core/registrations.ts");
/* harmony import */ var _gl_gl__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./gl/gl */ "./BdvEngine/core/gl/gl.ts");
/* harmony import */ var _gl_glStats__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./gl/glStats */ "./BdvEngine/core/gl/glStats.ts");
/* harmony import */ var _gl_shaders_defaultShader__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./gl/shaders/defaultShader */ "./BdvEngine/core/gl/shaders/defaultShader.ts");
/* harmony import */ var _assets_assetManager__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./assets/assetManager */ "./BdvEngine/core/assets/assetManager.ts");
/* harmony import */ var _input_inputManager__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./input/inputManager */ "./BdvEngine/core/input/inputManager.ts");
/* harmony import */ var _world_zoneManager__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./world/zoneManager */ "./BdvEngine/core/world/zoneManager.ts");
/* harmony import */ var _com_messageBus__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./com/messageBus */ "./BdvEngine/core/com/messageBus.ts");
/* harmony import */ var _graphics_draw__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./graphics/draw */ "./BdvEngine/core/graphics/draw.ts");
/* harmony import */ var _graphics_spriteBatcher__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./graphics/spriteBatcher */ "./BdvEngine/core/graphics/spriteBatcher.ts");
/* harmony import */ var _camera2d__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./camera2d */ "./BdvEngine/core/camera2d.ts");
/* harmony import */ var _behaviors_rigidBodyBehavior__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./behaviors/rigidBodyBehavior */ "./BdvEngine/core/behaviors/rigidBodyBehavior.ts");













class Engine {
    constructor(canvas, game, config) {
        var _a, _b, _c;
        this.previousTime = 0;
        this.camera = new _camera2d__WEBPACK_IMPORTED_MODULE_10__.Camera2D();
        this.accumulator = 0;
        this.frameCount = 0;
        this.fpsTimer = 0;
        this.currentFps = 0;
        this.currentDrawCalls = 0;
        this.statsElement = null;
        this.canvas = canvas;
        this.game = game;
        this.targetFps = (_a = config === null || config === void 0 ? void 0 : config.targetFps) !== null && _a !== void 0 ? _a : 60;
        this.frameInterval = this.targetFps > 0 ? 1000 / this.targetFps : 0;
        this.showStats = (_c = (_b = config === null || config === void 0 ? void 0 : config.showStats) !== null && _b !== void 0 ? _b : config === null || config === void 0 ? void 0 : config.showFps) !== null && _c !== void 0 ? _c : false;
    }
    get fps() {
        return this.currentFps;
    }
    get drawCalls() {
        return this.currentDrawCalls;
    }
    setTargetFps(fps) {
        this.targetFps = fps;
        this.frameInterval = fps > 0 ? 1000 / fps : 0;
    }
    start() {
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.GLUTools.init(this.canvas);
        _gl_glStats__WEBPACK_IMPORTED_MODULE_2__.GLStats.install();
        _assets_assetManager__WEBPACK_IMPORTED_MODULE_4__.AssetManager.init();
        _input_inputManager__WEBPACK_IMPORTED_MODULE_5__.InputManager.initialize();
        _world_zoneManager__WEBPACK_IMPORTED_MODULE_6__.ZoneManager.init();
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.clearColor(0, 0, 0.3, 1);
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.enable(_gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.BLEND);
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.blendFunc(_gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.SRC_ALPHA, _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.ONE_MINUS_SRC_ALPHA);
        this.defaultShader = new _gl_shaders_defaultShader__WEBPACK_IMPORTED_MODULE_3__.DefaultShader();
        this.defaultShader.use();
        if (this.showStats) {
            this.createStatsOverlay();
        }
        this.game.camera = this.camera;
        this.game.init();
        this.resize();
        this.previousTime = performance.now();
        requestAnimationFrame(this.tick.bind(this));
    }
    getShader() {
        return this.defaultShader;
    }
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    tick() {
        let now = performance.now();
        let elapsed = now - this.previousTime;
        if (this.frameInterval > 0) {
            this.accumulator += elapsed;
            this.previousTime = now;
            if (this.accumulator < this.frameInterval) {
                requestAnimationFrame(this.tick.bind(this));
                return;
            }
            let delta = this.frameInterval;
            this.accumulator -= this.frameInterval;
            if (this.accumulator > this.frameInterval * 3) {
                this.accumulator = 0;
            }
            this.updateStats(delta);
            this.update(delta);
            this.render();
        }
        else {
            this.previousTime = now;
            this.updateStats(elapsed);
            this.update(elapsed);
            this.render();
        }
        requestAnimationFrame(this.tick.bind(this));
    }
    updateStats(delta) {
        this.frameCount++;
        this.fpsTimer += delta;
        if (this.fpsTimer >= 1000) {
            this.currentFps = this.frameCount;
            this.frameCount = 0;
            this.fpsTimer -= 1000;
            if (this.statsElement) {
                this.statsElement.textContent =
                    `${this.currentFps} FPS | ${this.currentDrawCalls} draw calls`;
            }
        }
    }
    update(delta) {
        _behaviors_rigidBodyBehavior__WEBPACK_IMPORTED_MODULE_11__.RigidBodyBehavior.beginFrame();
        _com_messageBus__WEBPACK_IMPORTED_MODULE_7__.MessageBus.update(delta);
        this.game.update(delta);
        _world_zoneManager__WEBPACK_IMPORTED_MODULE_6__.ZoneManager.update(delta);
    }
    render() {
        _gl_glStats__WEBPACK_IMPORTED_MODULE_2__.GLStats.reset();
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.clear(_gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.COLOR_BUFFER_BIT);
        let proj = this.camera.getProjection(this.canvas.width, this.canvas.height);
        this.defaultShader.use();
        let projLoc = this.defaultShader.getUniformLocation("u_proj");
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.uniformMatrix4fv(projLoc, false, proj.toFloat32Array());
        _graphics_draw__WEBPACK_IMPORTED_MODULE_8__.Draw.setProjection(proj);
        this.game.render(this.defaultShader);
        _world_zoneManager__WEBPACK_IMPORTED_MODULE_6__.ZoneManager.render(this.defaultShader);
        _graphics_spriteBatcher__WEBPACK_IMPORTED_MODULE_9__.SpriteBatcher.flush();
        _graphics_draw__WEBPACK_IMPORTED_MODULE_8__.Draw.flush(this.defaultShader);
        this.currentDrawCalls = _gl_glStats__WEBPACK_IMPORTED_MODULE_2__.GLStats.drawCalls;
    }
    createStatsOverlay() {
        this.statsElement = document.createElement("div");
        this.statsElement.style.cssText =
            "position:fixed;top:4px;left:4px;color:#0f0;font:bold 14px monospace;" +
                "background:rgba(0,0,0,0.6);padding:2px 6px;pointer-events:none;z-index:9999;";
        this.statsElement.textContent = "0 FPS | 0 draw calls";
        document.body.appendChild(this.statsElement);
    }
}


/***/ },

/***/ "./BdvEngine/core/engine3d.ts"
/*!************************************!*\
  !*** ./BdvEngine/core/engine3d.ts ***!
  \************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Engine3D: () => (/* binding */ Engine3D)
/* harmony export */ });
/* harmony import */ var _registrations__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./registrations */ "./BdvEngine/core/registrations.ts");
/* harmony import */ var _gl_gl__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./gl/gl */ "./BdvEngine/core/gl/gl.ts");
/* harmony import */ var _assets_assetManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./assets/assetManager */ "./BdvEngine/core/assets/assetManager.ts");
/* harmony import */ var _input_inputManager__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./input/inputManager */ "./BdvEngine/core/input/inputManager.ts");
/* harmony import */ var _world_zoneManager__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./world/zoneManager */ "./BdvEngine/core/world/zoneManager.ts");
/* harmony import */ var _com_messageBus__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./com/messageBus */ "./BdvEngine/core/com/messageBus.ts");
/* harmony import */ var _3d_camera__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./3d/camera */ "./BdvEngine/core/3d/camera.ts");
/* harmony import */ var _3d_litShader__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./3d/litShader */ "./BdvEngine/core/3d/litShader.ts");
/* harmony import */ var _utils_vec3__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./utils/vec3 */ "./BdvEngine/core/utils/vec3.ts");










class Engine3D {
    constructor(canvas, game, config) {
        var _a, _b;
        this.previousTime = 0;
        this.lightDir = new _utils_vec3__WEBPACK_IMPORTED_MODULE_8__.vec3(0.5, 1.0, 0.8);
        this.lightColor = new _utils_vec3__WEBPACK_IMPORTED_MODULE_8__.vec3(1, 1, 1);
        this.ambientColor = new _utils_vec3__WEBPACK_IMPORTED_MODULE_8__.vec3(0.15, 0.15, 0.2);
        this.accumulator = 0;
        this.frameCount = 0;
        this.fpsTimer = 0;
        this.currentFps = 0;
        this.fpsElement = null;
        this.clearColor = [0.1, 0.1, 0.15, 1];
        this.canvas = canvas;
        this.game = game;
        this.camera = new _3d_camera__WEBPACK_IMPORTED_MODULE_6__.Camera();
        this.targetFps = (_a = config === null || config === void 0 ? void 0 : config.targetFps) !== null && _a !== void 0 ? _a : 60;
        this.frameInterval = this.targetFps > 0 ? 1000 / this.targetFps : 0;
        this.showFps = (_b = config === null || config === void 0 ? void 0 : config.showFps) !== null && _b !== void 0 ? _b : false;
        if (config === null || config === void 0 ? void 0 : config.clearColor) {
            this.clearColor = config.clearColor;
        }
    }
    get fps() { return this.currentFps; }
    setTargetFps(fps) {
        this.targetFps = fps;
        this.frameInterval = fps > 0 ? 1000 / fps : 0;
    }
    start() {
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.GLUTools.init(this.canvas);
        _assets_assetManager__WEBPACK_IMPORTED_MODULE_2__.AssetManager.init();
        _input_inputManager__WEBPACK_IMPORTED_MODULE_3__.InputManager.initialize();
        _world_zoneManager__WEBPACK_IMPORTED_MODULE_4__.ZoneManager.init();
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.clearColor(...this.clearColor);
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.enable(_gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.BLEND);
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.blendFunc(_gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.SRC_ALPHA, _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.ONE_MINUS_SRC_ALPHA);
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.enable(_gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.DEPTH_TEST);
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.depthFunc(_gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.LEQUAL);
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.enable(_gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.CULL_FACE);
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.cullFace(_gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.BACK);
        this.litShader = new _3d_litShader__WEBPACK_IMPORTED_MODULE_7__.LitShader();
        if (this.showFps) {
            this.createFpsOverlay();
        }
        this.game.init();
        this.resize();
        this.previousTime = performance.now();
        requestAnimationFrame(this.tick.bind(this));
    }
    getShader() {
        return this.litShader;
    }
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    tick() {
        let now = performance.now();
        let elapsed = now - this.previousTime;
        if (this.frameInterval > 0) {
            this.accumulator += elapsed;
            this.previousTime = now;
            if (this.accumulator < this.frameInterval) {
                requestAnimationFrame(this.tick.bind(this));
                return;
            }
            let delta = this.frameInterval;
            this.accumulator -= this.frameInterval;
            if (this.accumulator > this.frameInterval * 3)
                this.accumulator = 0;
            this.updateFpsCounter(delta);
            this.update(delta);
            this.render();
        }
        else {
            this.previousTime = now;
            this.updateFpsCounter(elapsed);
            this.update(elapsed);
            this.render();
        }
        requestAnimationFrame(this.tick.bind(this));
    }
    updateFpsCounter(delta) {
        this.frameCount++;
        this.fpsTimer += delta;
        if (this.fpsTimer >= 1000) {
            this.currentFps = this.frameCount;
            this.frameCount = 0;
            this.fpsTimer -= 1000;
            if (this.fpsElement)
                this.fpsElement.textContent = `${this.currentFps} FPS`;
        }
    }
    update(delta) {
        _com_messageBus__WEBPACK_IMPORTED_MODULE_5__.MessageBus.update(delta);
        this.game.update(delta);
        _world_zoneManager__WEBPACK_IMPORTED_MODULE_4__.ZoneManager.update(delta);
    }
    render() {
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.clear(_gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.COLOR_BUFFER_BIT | _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.DEPTH_BUFFER_BIT);
        this.litShader.use();
        let aspect = this.canvas.width / this.canvas.height;
        let proj = this.camera.getProjectionMatrix(aspect);
        let view = this.camera.getViewMatrix();
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.uniformMatrix4fv(this.litShader.getUniformLocation("u_proj"), false, proj.toFloat32Array());
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.uniformMatrix4fv(this.litShader.getUniformLocation("u_view"), false, view.toFloat32Array());
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.uniform3f(this.litShader.getUniformLocation("u_lightDir"), this.lightDir.vx, this.lightDir.vy, this.lightDir.vz);
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.uniform3f(this.litShader.getUniformLocation("u_lightColor"), this.lightColor.vx, this.lightColor.vy, this.lightColor.vz);
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.uniform3f(this.litShader.getUniformLocation("u_ambientColor"), this.ambientColor.vx, this.ambientColor.vy, this.ambientColor.vz);
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.uniform3f(this.litShader.getUniformLocation("u_viewPos"), this.camera.position.vx, this.camera.position.vy, this.camera.position.vz);
        this.game.render(this.litShader);
        _world_zoneManager__WEBPACK_IMPORTED_MODULE_4__.ZoneManager.render(this.litShader);
    }
    createFpsOverlay() {
        this.fpsElement = document.createElement("div");
        this.fpsElement.style.cssText =
            "position:fixed;top:4px;left:4px;color:#0f0;font:bold 14px monospace;" +
                "background:rgba(0,0,0,0.6);padding:2px 6px;pointer-events:none;z-index:9999;";
        this.fpsElement.textContent = "0 FPS";
        document.body.appendChild(this.fpsElement);
    }
}


/***/ },

/***/ "./BdvEngine/core/game.ts"
/*!********************************!*\
  !*** ./BdvEngine/core/game.ts ***!
  \********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Game: () => (/* binding */ Game)
/* harmony export */ });
class Game {
}


/***/ },

/***/ "./BdvEngine/core/gl/gl.ts"
/*!*********************************!*\
  !*** ./BdvEngine/core/gl/gl.ts ***!
  \*********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GLUTools: () => (/* binding */ GLUTools),
/* harmony export */   gl: () => (/* binding */ gl)
/* harmony export */ });
let gl;
class GLUTools {
    static init(canvas) {
        gl = canvas.getContext("webgl");
        if (!gl)
            throw new Error(`Unable to initialize WebGL.`);
    }
}


/***/ },

/***/ "./BdvEngine/core/gl/glBuffer.ts"
/*!***************************************!*\
  !*** ./BdvEngine/core/gl/glBuffer.ts ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   glAttrInfo: () => (/* binding */ glAttrInfo),
/* harmony export */   glBuffer: () => (/* binding */ glBuffer)
/* harmony export */ });
/* harmony import */ var _gl__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./gl */ "./BdvEngine/core/gl/gl.ts");

class glAttrInfo {
    constructor() {
        this.offset = 0;
    }
}
class glBuffer {
    constructor(dataType = _gl__WEBPACK_IMPORTED_MODULE_0__.gl.FLOAT, targetBufferType = _gl__WEBPACK_IMPORTED_MODULE_0__.gl.ARRAY_BUFFER, mode = _gl__WEBPACK_IMPORTED_MODULE_0__.gl.TRIANGLES) {
        this.hasAttrLocation = false;
        this.data = [];
        this.attrInfo = [];
        this.elementSize = 0;
        this.type = dataType;
        this.targetBufferType = targetBufferType;
        this.mode = mode;
        switch (this.type) {
            case _gl__WEBPACK_IMPORTED_MODULE_0__.gl.UNSIGNED_INT:
            case _gl__WEBPACK_IMPORTED_MODULE_0__.gl.INT:
            case _gl__WEBPACK_IMPORTED_MODULE_0__.gl.FLOAT: {
                this.typeSize = 4;
                break;
            }
            case _gl__WEBPACK_IMPORTED_MODULE_0__.gl.UNSIGNED_SHORT:
            case _gl__WEBPACK_IMPORTED_MODULE_0__.gl.SHORT: {
                this.typeSize = 2;
                break;
            }
            case _gl__WEBPACK_IMPORTED_MODULE_0__.gl.UNSIGNED_BYTE:
            case _gl__WEBPACK_IMPORTED_MODULE_0__.gl.BYTE: {
                this.typeSize = 1;
                break;
            }
            default: {
                throw new Error(`Unable to determine byte size for type ${this.type}.`);
            }
        }
        this.buffer = _gl__WEBPACK_IMPORTED_MODULE_0__.gl.createBuffer();
    }
    destroy() {
        _gl__WEBPACK_IMPORTED_MODULE_0__.gl.deleteBuffer(this.buffer);
    }
    bind(normalized = false) {
        _gl__WEBPACK_IMPORTED_MODULE_0__.gl.bindBuffer(this.targetBufferType, this.buffer);
        if (this.hasAttrLocation) {
            for (let attr of this.attrInfo) {
                _gl__WEBPACK_IMPORTED_MODULE_0__.gl.vertexAttribPointer(attr.location, attr.size, this.type, normalized, this.stride, attr.offset * this.typeSize);
                _gl__WEBPACK_IMPORTED_MODULE_0__.gl.enableVertexAttribArray(attr.location);
            }
        }
    }
    unbind() {
        for (let attr of this.attrInfo) {
            _gl__WEBPACK_IMPORTED_MODULE_0__.gl.disableVertexAttribArray(attr.location);
        }
        _gl__WEBPACK_IMPORTED_MODULE_0__.gl.bindBuffer(this.targetBufferType, null);
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
        _gl__WEBPACK_IMPORTED_MODULE_0__.gl.bindBuffer(this.targetBufferType, this.buffer);
        let bufferData;
        switch (this.type) {
            case _gl__WEBPACK_IMPORTED_MODULE_0__.gl.FLOAT: {
                bufferData = new Float32Array(this.data);
                break;
            }
            case _gl__WEBPACK_IMPORTED_MODULE_0__.gl.INT: {
                bufferData = new Int32Array(this.data);
                break;
            }
            case _gl__WEBPACK_IMPORTED_MODULE_0__.gl.UNSIGNED_INT: {
                bufferData = new Uint32Array(this.data);
                break;
            }
            case _gl__WEBPACK_IMPORTED_MODULE_0__.gl.SHORT: {
                bufferData = new Int16Array(this.data);
                break;
            }
            case _gl__WEBPACK_IMPORTED_MODULE_0__.gl.UNSIGNED_SHORT: {
                bufferData = new Uint16Array(this.data);
                break;
            }
            case _gl__WEBPACK_IMPORTED_MODULE_0__.gl.BYTE: {
                bufferData = new Int8Array(this.data);
                break;
            }
            case _gl__WEBPACK_IMPORTED_MODULE_0__.gl.UNSIGNED_BYTE: {
                bufferData = new Uint8Array(this.data);
                break;
            }
            default: {
                throw new Error(`Unable to determine byte size for type ${this.type}.`);
            }
        }
        _gl__WEBPACK_IMPORTED_MODULE_0__.gl.bufferData(this.targetBufferType, bufferData, _gl__WEBPACK_IMPORTED_MODULE_0__.gl.STATIC_DRAW);
    }
    draw() {
        if (this.targetBufferType === _gl__WEBPACK_IMPORTED_MODULE_0__.gl.ARRAY_BUFFER) {
            _gl__WEBPACK_IMPORTED_MODULE_0__.gl.drawArrays(this.mode, 0, this.data.length / this.elementSize);
        }
        else if (this.targetBufferType === _gl__WEBPACK_IMPORTED_MODULE_0__.gl.ELEMENT_ARRAY_BUFFER) {
            _gl__WEBPACK_IMPORTED_MODULE_0__.gl.drawElements(this.mode, this.data.length, this.type, 0);
        }
    }
}


/***/ },

/***/ "./BdvEngine/core/gl/glStats.ts"
/*!**************************************!*\
  !*** ./BdvEngine/core/gl/glStats.ts ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GLStats: () => (/* binding */ GLStats)
/* harmony export */ });
/* harmony import */ var _gl__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./gl */ "./BdvEngine/core/gl/gl.ts");

class GLStats {
    static install() {
        if (GLStats.installed)
            return;
        GLStats.installed = true;
        let origDrawArrays = _gl__WEBPACK_IMPORTED_MODULE_0__.gl.drawArrays.bind(_gl__WEBPACK_IMPORTED_MODULE_0__.gl);
        let origDrawElements = _gl__WEBPACK_IMPORTED_MODULE_0__.gl.drawElements.bind(_gl__WEBPACK_IMPORTED_MODULE_0__.gl);
        _gl__WEBPACK_IMPORTED_MODULE_0__.gl.drawArrays = function (mode, first, count) {
            GLStats.drawCalls++;
            origDrawArrays(mode, first, count);
        };
        _gl__WEBPACK_IMPORTED_MODULE_0__.gl.drawElements = function (mode, count, type, offset) {
            GLStats.drawCalls++;
            origDrawElements(mode, count, type, offset);
        };
    }
    static reset() {
        GLStats.drawCalls = 0;
    }
}
GLStats.drawCalls = 0;
GLStats.installed = false;


/***/ },

/***/ "./BdvEngine/core/gl/shader.ts"
/*!*************************************!*\
  !*** ./BdvEngine/core/gl/shader.ts ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Shader: () => (/* binding */ Shader)
/* harmony export */ });
/* harmony import */ var _gl__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./gl */ "./BdvEngine/core/gl/gl.ts");

class Shader {
    constructor(name) {
        this.attributes = {};
        this.uniforms = {};
        this.shaderName = name;
    }
    get name() {
        return this.shaderName;
    }
    use() {
        _gl__WEBPACK_IMPORTED_MODULE_0__.gl.useProgram(this.program);
    }
    getAttribLocation(name) {
        if (this.attributes[name] === null || this.attributes[name] === undefined)
            throw new Error(`Unable to fetch attr with name ${name} in shader ${this.shaderName}.`);
        return this.attributes[name];
    }
    getUniformLocation(name) {
        if (this.uniforms[name] === null || this.uniforms[name] === undefined)
            throw new Error(`Unable to fetch uniform with name ${name} in shader ${this.shaderName}.`);
        return this.uniforms[name];
    }
    load(vertexSource, fragmentSource) {
        let vertexShader = this.loadShader(vertexSource, _gl__WEBPACK_IMPORTED_MODULE_0__.gl.VERTEX_SHADER);
        let fragmentShader = this.loadShader(fragmentSource, _gl__WEBPACK_IMPORTED_MODULE_0__.gl.FRAGMENT_SHADER);
        this.createProgram(vertexShader, fragmentShader);
        this.getAttributes();
        this.getUniforms();
    }
    loadShader(source, shaderType) {
        let shader = _gl__WEBPACK_IMPORTED_MODULE_0__.gl.createShader(shaderType);
        _gl__WEBPACK_IMPORTED_MODULE_0__.gl.shaderSource(shader, source);
        _gl__WEBPACK_IMPORTED_MODULE_0__.gl.compileShader(shader);
        let error = _gl__WEBPACK_IMPORTED_MODULE_0__.gl.getShaderInfoLog(shader);
        if (error !== "") {
            throw new Error(`Error while compiling shader program with name ${this.shaderName}: ${error}`);
        }
        return shader;
    }
    createProgram(vertexShader, fragmentShader) {
        this.program = _gl__WEBPACK_IMPORTED_MODULE_0__.gl.createProgram();
        _gl__WEBPACK_IMPORTED_MODULE_0__.gl.attachShader(this.program, vertexShader);
        _gl__WEBPACK_IMPORTED_MODULE_0__.gl.attachShader(this.program, fragmentShader);
        _gl__WEBPACK_IMPORTED_MODULE_0__.gl.linkProgram(this.program);
        let error = _gl__WEBPACK_IMPORTED_MODULE_0__.gl.getProgramInfoLog(this.program);
        if (error !== "") {
            throw new Error(`Error linking shader with name ${this.shaderName}: ${error}`);
        }
    }
    getAttributes() {
        let attrCount = _gl__WEBPACK_IMPORTED_MODULE_0__.gl.getProgramParameter(this.program, _gl__WEBPACK_IMPORTED_MODULE_0__.gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < attrCount; i++) {
            let attrInfo = _gl__WEBPACK_IMPORTED_MODULE_0__.gl.getActiveAttrib(this.program, i);
            if (!attrInfo)
                break;
            this.attributes[attrInfo.name] = _gl__WEBPACK_IMPORTED_MODULE_0__.gl.getAttribLocation(this.program, attrInfo.name);
        }
    }
    getUniforms() {
        let uniformCount = _gl__WEBPACK_IMPORTED_MODULE_0__.gl.getProgramParameter(this.program, _gl__WEBPACK_IMPORTED_MODULE_0__.gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
            let uniformInfo = _gl__WEBPACK_IMPORTED_MODULE_0__.gl.getActiveUniform(this.program, i);
            if (!uniformInfo)
                break;
            this.uniforms[uniformInfo.name] = _gl__WEBPACK_IMPORTED_MODULE_0__.gl.getUniformLocation(this.program, uniformInfo.name);
        }
    }
}


/***/ },

/***/ "./BdvEngine/core/gl/shaders/defaultShader.ts"
/*!****************************************************!*\
  !*** ./BdvEngine/core/gl/shaders/defaultShader.ts ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DefaultShader: () => (/* binding */ DefaultShader)
/* harmony export */ });
/* harmony import */ var _shader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../shader */ "./BdvEngine/core/gl/shader.ts");

class DefaultShader extends _shader__WEBPACK_IMPORTED_MODULE_0__.Shader {
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


/***/ },

/***/ "./BdvEngine/core/graphics/animatedEntity.ts"
/*!***************************************************!*\
  !*** ./BdvEngine/core/graphics/animatedEntity.ts ***!
  \***************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AnimatedEntity: () => (/* binding */ AnimatedEntity)
/* harmony export */ });
/* harmony import */ var _spriteBatcher__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./spriteBatcher */ "./BdvEngine/core/graphics/spriteBatcher.ts");

class AnimatedEntity {
    constructor(materialName, gridCols, gridRows, frameWidth = 0, frameHeight = 0) {
        this.states = new Map();
        this.currentState = "";
        this.currentFrame = 0;
        this.frameTime = 100;
        this.elapsed = 0;
        this.playing = true;
        this.materialName = materialName;
        this.gridCols = gridCols;
        this.gridRows = gridRows;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
    }
    addState(name, row, startFrame, endFrame) {
        this.states.set(name, { row, startFrame, endFrame });
        if (this.currentState === "") {
            this.currentState = name;
            this.currentFrame = startFrame;
        }
    }
    setState(name) {
        if (name === this.currentState)
            return;
        let state = this.states.get(name);
        if (!state)
            return;
        this.currentState = name;
        this.currentFrame = state.startFrame;
        this.elapsed = 0;
    }
    getState() {
        return this.currentState;
    }
    setFrameTime(ms) {
        this.frameTime = ms;
    }
    setPaused(paused) {
        this.playing = !paused;
    }
    update(deltaTime) {
        if (!this.playing)
            return;
        let state = this.states.get(this.currentState);
        if (!state)
            return;
        if (state.startFrame === state.endFrame) {
            this.currentFrame = state.startFrame;
            return;
        }
        this.elapsed += deltaTime;
        if (this.elapsed >= this.frameTime) {
            this.elapsed -= this.frameTime;
            this.currentFrame++;
            if (this.currentFrame > state.endFrame) {
                this.currentFrame = state.startFrame;
            }
        }
    }
    render(material, x, y, width, height, tint) {
        let state = this.states.get(this.currentState);
        if (!state)
            return;
        _spriteBatcher__WEBPACK_IMPORTED_MODULE_0__.SpriteBatcher.drawTexture(material, this.currentFrame, state.row, this.gridCols, this.gridRows, x, y, width, height, tint);
    }
}


/***/ },

/***/ "./BdvEngine/core/graphics/animatedSprite.ts"
/*!***************************************************!*\
  !*** ./BdvEngine/core/graphics/animatedSprite.ts ***!
  \***************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AnimatedSprite: () => (/* binding */ AnimatedSprite)
/* harmony export */ });
/* harmony import */ var _sprite__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./sprite */ "./BdvEngine/core/graphics/sprite.ts");
/* harmony import */ var _com_message__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../com/message */ "./BdvEngine/core/com/message.ts");
/* harmony import */ var _assets_assetManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../assets/assetManager */ "./BdvEngine/core/assets/assetManager.ts");
/* harmony import */ var _utils_vec2__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/vec2 */ "./BdvEngine/core/utils/vec2.ts");




class UVInfo {
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }
}
class AnimatedSprite extends _sprite__WEBPACK_IMPORTED_MODULE_0__.Sprite {
    constructor(name, materialName, width = 100, height = 100, frameWidth = 10, frameHeight = 10, frameCount = 1, frameSequence = []) {
        super(name, materialName, width, height);
        this._frameTime = 333;
        this._frameUVs = [];
        this._currentFrame = 0;
        this._currentTime = 0;
        this._assetLoaded = false;
        this._assetWidth = 2;
        this._assetHeight = 2;
        this._frameWidth = frameWidth;
        this._frameHeight = frameHeight;
        this._frameCount = frameCount;
        this._frameSequence = frameSequence;
        _com_message__WEBPACK_IMPORTED_MODULE_1__.Message.subscribe(`${_assets_assetManager__WEBPACK_IMPORTED_MODULE_2__.MESSAGE_ASSET_LOADER_LOADED}::${this.material.diffTextureName}`, this);
        let asset = _assets_assetManager__WEBPACK_IMPORTED_MODULE_2__.AssetManager.get(this.material.diffTextureName);
        if (asset) {
            this._assetLoaded = true;
            this._assetWidth = asset.width;
            this._assetHeight = asset.height;
            this.calculateUVs();
        }
    }
    destructor() {
        super.destructor();
    }
    onMessage(message) {
        if (message.code ===
            `${_assets_assetManager__WEBPACK_IMPORTED_MODULE_2__.MESSAGE_ASSET_LOADER_LOADED}::${this.material.diffTextureName}`) {
            this._assetLoaded = true;
            let asset = message.context;
            this._assetHeight = asset.height;
            this._assetWidth = asset.width;
            this.calculateUVs();
        }
    }
    setFrameSequence(sequence) {
        if (this._frameSequence.length === sequence.length &&
            this._frameSequence.every((v, i) => v === sequence[i]))
            return;
        this._frameSequence = sequence;
        this._currentFrame = 0;
        this._currentTime = 0;
    }
    setFrameTime(ms) {
        this._frameTime = ms;
    }
    get frameSequence() {
        return this._frameSequence;
    }
    load() {
        super.load();
    }
    update(time) {
        if (!this._assetLoaded) {
            return;
        }
        this._currentTime += time;
        if (this._currentTime > this._frameTime) {
            this._currentFrame++;
            this._currentTime = 0;
            if (this._currentFrame >= this._frameSequence.length) {
                this._currentFrame = 0;
            }
            let frameUVs = this._frameSequence[this._currentFrame];
            this.vertices[0].texCoords.copyFrom(this._frameUVs[frameUVs].min);
            this.vertices[1].texCoords = new _utils_vec2__WEBPACK_IMPORTED_MODULE_3__.vec2(this._frameUVs[frameUVs].min.vx, this._frameUVs[frameUVs].max.vy);
            this.vertices[2].texCoords.copyFrom(this._frameUVs[frameUVs].max);
            this.vertices[3].texCoords.copyFrom(this._frameUVs[frameUVs].max);
            this.vertices[4].texCoords = new _utils_vec2__WEBPACK_IMPORTED_MODULE_3__.vec2(this._frameUVs[frameUVs].max.vx, this._frameUVs[frameUVs].min.vy);
            this.vertices[5].texCoords.copyFrom(this._frameUVs[frameUVs].min);
            this.buffer.clearData();
            for (let v of this.vertices) {
                this.buffer.pushBack(v.toArray());
            }
            this.buffer.upload();
            this.buffer.unbind();
        }
        super.update(time);
    }
    calculateUVs() {
        let colsPerRow = Math.floor(this._assetWidth / this._frameWidth);
        for (let i = 0; i < this._frameCount; ++i) {
            let col = i % colsPerRow;
            let row = Math.floor(i / colsPerRow);
            let u = (col * this._frameWidth) / this._assetWidth;
            let v = (row * this._frameHeight) / this._assetHeight;
            let uMax = ((col + 1) * this._frameWidth) / this._assetWidth;
            let vMax = ((row + 1) * this._frameHeight) / this._assetHeight;
            this._frameUVs.push(new UVInfo(new _utils_vec2__WEBPACK_IMPORTED_MODULE_3__.vec2(u, v), new _utils_vec2__WEBPACK_IMPORTED_MODULE_3__.vec2(uMax, vMax)));
        }
    }
}


/***/ },

/***/ "./BdvEngine/core/graphics/color.ts"
/*!******************************************!*\
  !*** ./BdvEngine/core/graphics/color.ts ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Color: () => (/* binding */ Color)
/* harmony export */ });
class Color {
    constructor(r = 255, g = 255, b = 255, a = 255) {
        this.red = r;
        this.green = g;
        this.blue = b;
        this.alpha = a;
    }
    get r() {
        return this.red;
    }
    get rFloat() {
        return this.red / 255.0;
    }
    set r(value) {
        this.red = value;
    }
    get g() {
        return this.green;
    }
    get gFloat() {
        return this.green / 255.0;
    }
    set g(value) {
        this.green = value;
    }
    get b() {
        return this.blue;
    }
    get bFloat() {
        return this.blue / 255.0;
    }
    set b(value) {
        this.blue = value;
    }
    get a() {
        return this.alpha;
    }
    get aFloat() {
        return this.alpha / 255.0;
    }
    set a(value) {
        this.alpha = value;
    }
    toArray() {
        return [this.red, this.green, this.blue, this.alpha];
    }
    toArrayFloat() {
        return [
            this.red / 255.0,
            this.green / 255.0,
            this.blue / 255.0,
            this.alpha / 255.0,
        ];
    }
    toArrayFloat32() {
        return new Float32Array(this.toArrayFloat());
    }
    static white() {
        return new Color(255, 255, 255, 255);
    }
    static black() {
        return new Color(0, 0, 0, 255);
    }
    static red() {
        return new Color(255, 0, 0, 255);
    }
    static green() {
        return new Color(0, 255, 0, 255);
    }
    static blue() {
        return new Color(0, 0, 255, 255);
    }
}


/***/ },

/***/ "./BdvEngine/core/graphics/draw.ts"
/*!*****************************************!*\
  !*** ./BdvEngine/core/graphics/draw.ts ***!
  \*****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Draw: () => (/* binding */ Draw)
/* harmony export */ });
/* harmony import */ var _gl_gl__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../gl/gl */ "./BdvEngine/core/gl/gl.ts");
/* harmony import */ var _gl_shader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../gl/shader */ "./BdvEngine/core/gl/shader.ts");
/* harmony import */ var _utils_m4x4__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/m4x4 */ "./BdvEngine/core/utils/m4x4.ts");



class Draw {
    static setProjection(proj) {
        Draw.projectionMatrix = proj;
    }
    static getProjection() {
        return Draw.projectionMatrix;
    }
    static ensureInit() {
        if (Draw.whiteTexture)
            return;
        Draw.whiteTexture = _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.createTexture();
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.bindTexture(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_2D, Draw.whiteTexture);
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.texImage2D(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_2D, 0, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.RGBA, 1, 1, 0, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.RGBA, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.texParameteri(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_2D, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_MIN_FILTER, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.NEAREST);
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.texParameteri(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_2D, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_MAG_FILTER, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.NEAREST);
        Draw.triBuf = _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.createBuffer();
        Draw.lineBuf = _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.createBuffer();
        Draw.batchShader = new BatchColorShader();
    }
    static grow(arr, needed) {
        if (needed <= arr.length)
            return arr;
        let newSize = arr.length;
        while (newSize < needed)
            newSize *= 2;
        let newArr = new Float32Array(newSize);
        newArr.set(arr);
        return newArr;
    }
    static pushTriVert(x, y, z, r, g, b, a) {
        let i = Draw.triCount;
        Draw.triData = Draw.grow(Draw.triData, i + 7);
        let d = Draw.triData;
        d[i] = x;
        d[i + 1] = y;
        d[i + 2] = z;
        d[i + 3] = r;
        d[i + 4] = g;
        d[i + 5] = b;
        d[i + 6] = a;
        Draw.triCount = i + 7;
    }
    static pushLineVert(x, y, z, r, g, b, a) {
        let i = Draw.lineCount;
        Draw.lineData = Draw.grow(Draw.lineData, i + 7);
        let d = Draw.lineData;
        d[i] = x;
        d[i + 1] = y;
        d[i + 2] = z;
        d[i + 3] = r;
        d[i + 4] = g;
        d[i + 5] = b;
        d[i + 6] = a;
        Draw.lineCount = i + 7;
    }
    static rect(x, y, w, h, color) {
        let r = color.rFloat, g = color.gFloat, b = color.bFloat, a = color.aFloat;
        let x2 = x + w, y2 = y + h;
        let needed = Draw.triCount + 42;
        Draw.triData = Draw.grow(Draw.triData, needed);
        let d = Draw.triData;
        let i = Draw.triCount;
        d[i] = x;
        d[i + 1] = y;
        d[i + 2] = 0;
        d[i + 3] = r;
        d[i + 4] = g;
        d[i + 5] = b;
        d[i + 6] = a;
        d[i + 7] = x;
        d[i + 8] = y2;
        d[i + 9] = 0;
        d[i + 10] = r;
        d[i + 11] = g;
        d[i + 12] = b;
        d[i + 13] = a;
        d[i + 14] = x2;
        d[i + 15] = y2;
        d[i + 16] = 0;
        d[i + 17] = r;
        d[i + 18] = g;
        d[i + 19] = b;
        d[i + 20] = a;
        d[i + 21] = x2;
        d[i + 22] = y2;
        d[i + 23] = 0;
        d[i + 24] = r;
        d[i + 25] = g;
        d[i + 26] = b;
        d[i + 27] = a;
        d[i + 28] = x2;
        d[i + 29] = y;
        d[i + 30] = 0;
        d[i + 31] = r;
        d[i + 32] = g;
        d[i + 33] = b;
        d[i + 34] = a;
        d[i + 35] = x;
        d[i + 36] = y;
        d[i + 37] = 0;
        d[i + 38] = r;
        d[i + 39] = g;
        d[i + 40] = b;
        d[i + 41] = a;
        Draw.triCount = i + 42;
    }
    static rectOutline(x, y, w, h, color) {
        Draw.line(x, y, x + w, y, color);
        Draw.line(x + w, y, x + w, y + h, color);
        Draw.line(x + w, y + h, x, y + h, color);
        Draw.line(x, y + h, x, y, color);
    }
    static circle(cx, cy, radius, color, segments = 32) {
        let r = color.rFloat, g = color.gFloat, b = color.bFloat, a = color.aFloat;
        let needed = Draw.triCount + segments * 21;
        Draw.triData = Draw.grow(Draw.triData, needed);
        let d = Draw.triData;
        let idx = Draw.triCount;
        for (let i = 0; i < segments; i++) {
            let a0 = (i / segments) * Math.PI * 2;
            let a1 = ((i + 1) / segments) * Math.PI * 2;
            let cos0 = Math.cos(a0), sin0 = Math.sin(a0);
            let cos1 = Math.cos(a1), sin1 = Math.sin(a1);
            d[idx] = cx;
            d[idx + 1] = cy;
            d[idx + 2] = 0;
            d[idx + 3] = r;
            d[idx + 4] = g;
            d[idx + 5] = b;
            d[idx + 6] = a;
            d[idx + 7] = cx + cos0 * radius;
            d[idx + 8] = cy + sin0 * radius;
            d[idx + 9] = 0;
            d[idx + 10] = r;
            d[idx + 11] = g;
            d[idx + 12] = b;
            d[idx + 13] = a;
            d[idx + 14] = cx + cos1 * radius;
            d[idx + 15] = cy + sin1 * radius;
            d[idx + 16] = 0;
            d[idx + 17] = r;
            d[idx + 18] = g;
            d[idx + 19] = b;
            d[idx + 20] = a;
            idx += 21;
        }
        Draw.triCount = idx;
    }
    static circleOutline(cx, cy, radius, color, segments = 32) {
        for (let i = 0; i < segments; i++) {
            let a0 = (i / segments) * Math.PI * 2;
            let a1 = ((i + 1) / segments) * Math.PI * 2;
            Draw.line(cx + Math.cos(a0) * radius, cy + Math.sin(a0) * radius, cx + Math.cos(a1) * radius, cy + Math.sin(a1) * radius, color);
        }
    }
    static triangle(x1, y1, x2, y2, x3, y3, color) {
        let r = color.rFloat, g = color.gFloat, b = color.bFloat, a = color.aFloat;
        Draw.pushTriVert(x1, y1, 0, r, g, b, a);
        Draw.pushTriVert(x2, y2, 0, r, g, b, a);
        Draw.pushTriVert(x3, y3, 0, r, g, b, a);
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
        let r = color.rFloat, g = color.gFloat, b = color.bFloat, a = color.aFloat;
        let needed = Draw.lineCount + 14;
        Draw.lineData = Draw.grow(Draw.lineData, needed);
        let d = Draw.lineData;
        let i = Draw.lineCount;
        d[i] = x1;
        d[i + 1] = y1;
        d[i + 2] = 0;
        d[i + 3] = r;
        d[i + 4] = g;
        d[i + 5] = b;
        d[i + 6] = a;
        d[i + 7] = x2;
        d[i + 8] = y2;
        d[i + 9] = 0;
        d[i + 10] = r;
        d[i + 11] = g;
        d[i + 12] = b;
        d[i + 13] = a;
        Draw.lineCount = i + 14;
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
        if (Draw.triCount === 0 && Draw.lineCount === 0)
            return;
        Draw.ensureInit();
        let shader = Draw.batchShader;
        shader.use();
        let projLoc = shader.getUniformLocation("u_proj");
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniformMatrix4fv(projLoc, false, new Float32Array(Draw.projectionMatrix.mData));
        if (Draw.triCount > 0) {
            Draw.submitBatch(shader, Draw.triBuf, Draw.triData, Draw.triCount, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TRIANGLES);
            Draw.triCount = 0;
        }
        if (Draw.lineCount > 0) {
            Draw.submitBatch(shader, Draw.lineBuf, Draw.lineData, Draw.lineCount, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.LINES);
            Draw.lineCount = 0;
        }
        parentShader.use();
    }
    static submitBatch(shader, buffer, data, floatCount, mode) {
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.bindBuffer(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.ARRAY_BUFFER, buffer);
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.bufferData(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.ARRAY_BUFFER, data.subarray(0, floatCount), _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.DYNAMIC_DRAW);
        const stride = 7 * 4;
        let posLoc = shader.getAttribLocation("a_pos");
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.vertexAttribPointer(posLoc, 3, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.FLOAT, false, stride, 0);
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.enableVertexAttribArray(posLoc);
        let colLoc = shader.getAttribLocation("a_color");
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.vertexAttribPointer(colLoc, 4, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.FLOAT, false, stride, 3 * 4);
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.enableVertexAttribArray(colLoc);
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.drawArrays(mode, 0, floatCount / 7);
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.disableVertexAttribArray(posLoc);
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.disableVertexAttribArray(colLoc);
    }
}
Draw.FLOATS_PER_VERT = 7;
Draw.triData = new Float32Array(7 * 6 * 1024);
Draw.triCount = 0;
Draw.lineData = new Float32Array(7 * 2 * 512);
Draw.lineCount = 0;
Draw.whiteTexture = null;
Draw.triBuf = null;
Draw.lineBuf = null;
Draw.batchShader = null;
Draw.projectionMatrix = _utils_m4x4__WEBPACK_IMPORTED_MODULE_2__.m4x4.identity();
class BatchColorShader extends _gl_shader__WEBPACK_IMPORTED_MODULE_1__.Shader {
    constructor() {
        super("batch_color");
        this.load(this.vertSrc(), this.fragSrc());
    }
    vertSrc() {
        return `
      attribute vec3 a_pos;
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


/***/ },

/***/ "./BdvEngine/core/graphics/material.ts"
/*!*********************************************!*\
  !*** ./BdvEngine/core/graphics/material.ts ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Material: () => (/* binding */ Material)
/* harmony export */ });
/* harmony import */ var _gl_gl__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../gl/gl */ "./BdvEngine/core/gl/gl.ts");
/* harmony import */ var _textureManager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./textureManager */ "./BdvEngine/core/graphics/textureManager.ts");


class Material {
    constructor(name, diffuseTextureName, color, shader) {
        this.uniforms = new Map();
        this.name = name;
        this.diffuseTextureName = diffuseTextureName;
        this.color = color;
        this.customShader = shader || null;
        if (this.diffuseTextureName) {
            this.diffuseTexture = _textureManager__WEBPACK_IMPORTED_MODULE_1__.TextureManager.getTexture(this.diffuseTextureName);
        }
    }
    get materialName() {
        return this.name;
    }
    get diffTexture() {
        return this.diffuseTexture;
    }
    get diffTextureName() {
        return this.diffuseTextureName;
    }
    set diffTextureName(value) {
        if (this.diffuseTexture) {
            _textureManager__WEBPACK_IMPORTED_MODULE_1__.TextureManager.flushTexture(this.diffuseTextureName);
        }
        this.diffuseTextureName = value;
        if (this.diffuseTextureName) {
            this.diffuseTexture = _textureManager__WEBPACK_IMPORTED_MODULE_1__.TextureManager.getTexture(this.diffuseTextureName);
        }
    }
    get diffColor() {
        return this.color;
    }
    set diffColor(color) {
        this.color = color;
    }
    get hasCustomShader() {
        return this.customShader !== null;
    }
    get shader() {
        return this.customShader;
    }
    setUniform(name, value) {
        this.uniforms.set(name, value);
    }
    getUniform(name) {
        return this.uniforms.get(name);
    }
    applyUniforms(shader) {
        this.uniforms.forEach((value, name) => {
            let loc;
            try {
                loc = shader.getUniformLocation(name);
            }
            catch (_a) {
                return;
            }
            if (typeof value === 'number') {
                _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniform1f(loc, value);
            }
            else if (value instanceof Float32Array) {
                switch (value.length) {
                    case 2:
                        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniform2fv(loc, value);
                        break;
                    case 3:
                        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniform3fv(loc, value);
                        break;
                    case 4:
                        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniform4fv(loc, value);
                        break;
                    case 9:
                        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniformMatrix3fv(loc, false, value);
                        break;
                    case 16:
                        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniformMatrix4fv(loc, false, value);
                        break;
                    default:
                        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniform1fv(loc, value);
                        break;
                }
            }
            else if (Array.isArray(value)) {
                let arr = new Float32Array(value);
                switch (arr.length) {
                    case 2:
                        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniform2fv(loc, arr);
                        break;
                    case 3:
                        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniform3fv(loc, arr);
                        break;
                    case 4:
                        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniform4fv(loc, arr);
                        break;
                    case 9:
                        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniformMatrix3fv(loc, false, arr);
                        break;
                    case 16:
                        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniformMatrix4fv(loc, false, arr);
                        break;
                    default:
                        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniform1fv(loc, arr);
                        break;
                }
            }
        });
    }
    destructor() {
        _textureManager__WEBPACK_IMPORTED_MODULE_1__.TextureManager.flushTexture(this.diffuseTextureName);
        this.diffuseTexture = undefined;
    }
}


/***/ },

/***/ "./BdvEngine/core/graphics/materialManager.ts"
/*!****************************************************!*\
  !*** ./BdvEngine/core/graphics/materialManager.ts ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MaterialManager: () => (/* binding */ MaterialManager)
/* harmony export */ });
/* harmony import */ var _materialRefNode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./materialRefNode */ "./BdvEngine/core/graphics/materialRefNode.ts");

class MaterialManager {
    constructor() { }
    static register(material) {
        if (!MaterialManager.materials[material.materialName]) {
            MaterialManager.materials[material.materialName] = new _materialRefNode__WEBPACK_IMPORTED_MODULE_0__.MaterialRefNode(material);
        }
    }
    static get(materialName) {
        if (!MaterialManager.materials[materialName])
            return undefined;
        MaterialManager.materials[materialName].refCount++;
        return MaterialManager.materials[materialName].material;
    }
    static flush(materialName) {
        if (!MaterialManager.materials[materialName]) {
            console.log(`MaterialManager:: Cannot flush material ${materialName} because it hasn't been registered.`);
            return undefined;
        }
        MaterialManager.materials[materialName].refCount--;
        if (MaterialManager.materials[materialName].refCount < 1) {
            MaterialManager.materials[materialName].material.destructor();
            MaterialManager.materials[materialName].material = undefined;
            delete MaterialManager.materials[materialName];
        }
    }
}
MaterialManager.materials = {};


/***/ },

/***/ "./BdvEngine/core/graphics/materialRefNode.ts"
/*!****************************************************!*\
  !*** ./BdvEngine/core/graphics/materialRefNode.ts ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MaterialRefNode: () => (/* binding */ MaterialRefNode)
/* harmony export */ });
class MaterialRefNode {
    constructor(material) {
        this.refCount = 1;
        this.material = material;
    }
}


/***/ },

/***/ "./BdvEngine/core/graphics/particleEmitter.ts"
/*!****************************************************!*\
  !*** ./BdvEngine/core/graphics/particleEmitter.ts ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ParticleEmitter: () => (/* binding */ ParticleEmitter)
/* harmony export */ });
/* harmony import */ var _color__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./color */ "./BdvEngine/core/graphics/color.ts");
/* harmony import */ var _draw__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./draw */ "./BdvEngine/core/graphics/draw.ts");


class ParticleEmitter {
    constructor(x, y, config) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
        this.spawnAccumulator = 0;
        this.x = x;
        this.y = y;
        this.config = {
            maxParticles: (_a = config === null || config === void 0 ? void 0 : config.maxParticles) !== null && _a !== void 0 ? _a : 200,
            spawnRate: (_b = config === null || config === void 0 ? void 0 : config.spawnRate) !== null && _b !== void 0 ? _b : 50,
            lifetimeMin: (_c = config === null || config === void 0 ? void 0 : config.lifetimeMin) !== null && _c !== void 0 ? _c : 500,
            lifetimeMax: (_d = config === null || config === void 0 ? void 0 : config.lifetimeMax) !== null && _d !== void 0 ? _d : 1500,
            speedMin: (_e = config === null || config === void 0 ? void 0 : config.speedMin) !== null && _e !== void 0 ? _e : 0.05,
            speedMax: (_f = config === null || config === void 0 ? void 0 : config.speedMax) !== null && _f !== void 0 ? _f : 0.2,
            direction: (_g = config === null || config === void 0 ? void 0 : config.direction) !== null && _g !== void 0 ? _g : -Math.PI / 2,
            spread: (_h = config === null || config === void 0 ? void 0 : config.spread) !== null && _h !== void 0 ? _h : Math.PI,
            sizeMin: (_j = config === null || config === void 0 ? void 0 : config.sizeMin) !== null && _j !== void 0 ? _j : 2,
            sizeMax: (_k = config === null || config === void 0 ? void 0 : config.sizeMax) !== null && _k !== void 0 ? _k : 6,
            colorStart: (_l = config === null || config === void 0 ? void 0 : config.colorStart) !== null && _l !== void 0 ? _l : new _color__WEBPACK_IMPORTED_MODULE_0__.Color(255, 200, 50, 255),
            colorEnd: (_m = config === null || config === void 0 ? void 0 : config.colorEnd) !== null && _m !== void 0 ? _m : new _color__WEBPACK_IMPORTED_MODULE_0__.Color(255, 50, 0, 255),
            alphaStart: (_o = config === null || config === void 0 ? void 0 : config.alphaStart) !== null && _o !== void 0 ? _o : 255,
            alphaEnd: (_p = config === null || config === void 0 ? void 0 : config.alphaEnd) !== null && _p !== void 0 ? _p : 0,
            gravity: (_q = config === null || config === void 0 ? void 0 : config.gravity) !== null && _q !== void 0 ? _q : 0,
            shape: (_r = config === null || config === void 0 ? void 0 : config.shape) !== null && _r !== void 0 ? _r : 'rect',
            emitting: (_s = config === null || config === void 0 ? void 0 : config.emitting) !== null && _s !== void 0 ? _s : true,
        };
        this.emitting = this.config.emitting;
        this.particles = [];
    }
    burst(count) {
        for (let i = 0; i < count; i++) {
            this.spawn();
        }
    }
    update(deltaTime) {
        let cfg = this.config;
        if (this.emitting) {
            this.spawnAccumulator += deltaTime;
            let interval = 1000 / cfg.spawnRate;
            while (this.spawnAccumulator >= interval) {
                this.spawnAccumulator -= interval;
                this.spawn();
            }
        }
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.age += deltaTime;
            if (p.age >= p.lifetime) {
                this.particles[i] = this.particles[this.particles.length - 1];
                this.particles.pop();
                continue;
            }
            p.vy += cfg.gravity * deltaTime;
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
        }
    }
    render() {
        let cfg = this.config;
        for (let p of this.particles) {
            let t = p.age / p.lifetime;
            let cs = cfg.colorStart, ce = cfg.colorEnd;
            let r = cs.r + (ce.r - cs.r) * t;
            let g = cs.g + (ce.g - cs.g) * t;
            let b = cs.b + (ce.b - cs.b) * t;
            let a = cfg.alphaStart + (cfg.alphaEnd - cfg.alphaStart) * t;
            let color = new _color__WEBPACK_IMPORTED_MODULE_0__.Color(r, g, b, a);
            let half = p.size / 2;
            if (cfg.shape === 'circle') {
                _draw__WEBPACK_IMPORTED_MODULE_1__.Draw.circle(p.x, p.y, half, color, 8);
            }
            else {
                _draw__WEBPACK_IMPORTED_MODULE_1__.Draw.rect(p.x - half, p.y - half, p.size, p.size, color);
            }
        }
    }
    get count() {
        return this.particles.length;
    }
    spawn() {
        if (this.particles.length >= this.config.maxParticles)
            return;
        let cfg = this.config;
        let angle = cfg.direction + (Math.random() - 0.5) * cfg.spread;
        let speed = rand(cfg.speedMin, cfg.speedMax);
        this.particles.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: rand(cfg.sizeMin, cfg.sizeMax),
            age: 0,
            lifetime: rand(cfg.lifetimeMin, cfg.lifetimeMax),
            alive: true,
        });
    }
}
function rand(min, max) {
    return min + Math.random() * (max - min);
}


/***/ },

/***/ "./BdvEngine/core/graphics/sprite.ts"
/*!*******************************************!*\
  !*** ./BdvEngine/core/graphics/sprite.ts ***!
  \*******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Sprite: () => (/* binding */ Sprite)
/* harmony export */ });
/* harmony import */ var _gl_gl__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../gl/gl */ "./BdvEngine/core/gl/gl.ts");
/* harmony import */ var _gl_glBuffer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../gl/glBuffer */ "./BdvEngine/core/gl/glBuffer.ts");
/* harmony import */ var _vertex__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./vertex */ "./BdvEngine/core/graphics/vertex.ts");
/* harmony import */ var _materialManager__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./materialManager */ "./BdvEngine/core/graphics/materialManager.ts");
/* harmony import */ var _draw__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./draw */ "./BdvEngine/core/graphics/draw.ts");
/* harmony import */ var _spriteBatcher__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./spriteBatcher */ "./BdvEngine/core/graphics/spriteBatcher.ts");






class Sprite {
    constructor(name, materialName, width = 100, height = 100) {
        this.vertices = [];
        this.name = name;
        this.width = width;
        this.height = height;
        this.materialName = materialName;
        this.material = _materialManager__WEBPACK_IMPORTED_MODULE_3__.MaterialManager.get(this.materialName);
    }
    destructor() {
        this.buffer.destroy();
        _materialManager__WEBPACK_IMPORTED_MODULE_3__.MaterialManager.flush(this.materialName);
        this.material = undefined;
        this.materialName = undefined;
    }
    get getName() {
        return this.name;
    }
    load() {
        this.buffer = new _gl_glBuffer__WEBPACK_IMPORTED_MODULE_1__.glBuffer();
        let positionAttr = new _gl_glBuffer__WEBPACK_IMPORTED_MODULE_1__.glAttrInfo();
        positionAttr.location = 0;
        positionAttr.size = 3;
        this.buffer.addAttrLocation(positionAttr);
        let textCoordAttr = new _gl_glBuffer__WEBPACK_IMPORTED_MODULE_1__.glAttrInfo();
        textCoordAttr.location = 1;
        textCoordAttr.size = 2;
        this.buffer.addAttrLocation(textCoordAttr);
        this.vertices =
            [
                new _vertex__WEBPACK_IMPORTED_MODULE_2__.Vertex(0, 0, 0, 0, 0),
                new _vertex__WEBPACK_IMPORTED_MODULE_2__.Vertex(0, this.height, 0, 0, 1.0),
                new _vertex__WEBPACK_IMPORTED_MODULE_2__.Vertex(this.width, this.height, 0, 1.0, 1.0),
                new _vertex__WEBPACK_IMPORTED_MODULE_2__.Vertex(this.width, this.height, 0, 1.0, 1.0),
                new _vertex__WEBPACK_IMPORTED_MODULE_2__.Vertex(this.width, 0, 0, 1.0, 0),
                new _vertex__WEBPACK_IMPORTED_MODULE_2__.Vertex(0, 0, 0, 0, 0),
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
        _spriteBatcher__WEBPACK_IMPORTED_MODULE_5__.SpriteBatcher.push(this.vertices, this.material, worldMatrix);
    }
    update(tick) { }
    render(shader, modelMatrix) {
        let activeShader = shader;
        if (this.material.hasCustomShader) {
            activeShader = this.material.shader;
            activeShader.use();
            const projLoc = activeShader.getUniformLocation("u_proj");
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniformMatrix4fv(projLoc, false, new Float32Array(_draw__WEBPACK_IMPORTED_MODULE_4__.Draw.getProjection().mData));
        }
        const transformLocation = activeShader.getUniformLocation("u_transf");
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniformMatrix4fv(transformLocation, false, modelMatrix.toFloat32Array());
        const colorLocation = activeShader.getUniformLocation("u_color");
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniform4fv(colorLocation, this.material.diffColor.toArrayFloat32());
        if (this.material.diffTexture) {
            this.material.diffTexture.activate(0);
            const diffuseLocation = activeShader.getUniformLocation("u_diffuse");
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniform1i(diffuseLocation, 0);
        }
        this.material.applyUniforms(activeShader);
        this.buffer.bind();
        this.buffer.draw();
        if (this.material.hasCustomShader) {
            shader.use();
        }
    }
}


/***/ },

/***/ "./BdvEngine/core/graphics/spriteBatcher.ts"
/*!**************************************************!*\
  !*** ./BdvEngine/core/graphics/spriteBatcher.ts ***!
  \**************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SpriteBatcher: () => (/* binding */ SpriteBatcher)
/* harmony export */ });
/* harmony import */ var _gl_gl__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../gl/gl */ "./BdvEngine/core/gl/gl.ts");
/* harmony import */ var _gl_shader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../gl/shader */ "./BdvEngine/core/gl/shader.ts");
/* harmony import */ var _color__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./color */ "./BdvEngine/core/graphics/color.ts");
/* harmony import */ var _draw__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./draw */ "./BdvEngine/core/graphics/draw.ts");




class SpriteBatcher {
    static ensureInit() {
        if (SpriteBatcher.buffer)
            return;
        SpriteBatcher.buffer = _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.createBuffer();
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
    static drawTexture(material, srcCol, srcRow, gridCols, gridRows, x, y, width, height, tint = _color__WEBPACK_IMPORTED_MODULE_2__.Color.white()) {
        let texture = material.diffTexture;
        if (!texture)
            return;
        SpriteBatcher.ensureInit();
        let key = "__default_batch__:" + material.diffTextureName;
        let batch = SpriteBatcher.batches.get(key);
        if (!batch) {
            batch = { verts: [], texture: texture, material: null };
            SpriteBatcher.batches.set(key, batch);
        }
        let u0 = srcCol / gridCols;
        let v0 = srcRow / gridRows;
        let u1 = (srcCol + 1) / gridCols;
        let v1 = (srcRow + 1) / gridRows;
        let r = tint.rFloat, g = tint.gFloat, b = tint.bFloat, a = tint.aFloat;
        let buf = batch.verts;
        buf.push(x, y, 0, u0, v0, r, g, b, a, x, y + height, 0, u0, v1, r, g, b, a, x + width, y + height, 0, u1, v1, r, g, b, a, x + width, y + height, 0, u1, v1, r, g, b, a, x + width, y, 0, u1, v0, r, g, b, a, x, y, 0, u0, v0, r, g, b, a);
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
                _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniformMatrix4fv(projLoc, false, new Float32Array(_draw__WEBPACK_IMPORTED_MODULE_3__.Draw.getProjection().mData));
                batch.material.applyUniforms(shader);
            }
            else {
                shader = SpriteBatcher.batchShader;
                shader.use();
                let projLoc = shader.getUniformLocation("u_proj");
                _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniformMatrix4fv(projLoc, false, new Float32Array(_draw__WEBPACK_IMPORTED_MODULE_3__.Draw.getProjection().mData));
            }
            batch.texture.activate(0);
            let diffLoc = shader.getUniformLocation("u_diffuse");
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniform1i(diffLoc, 0);
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.bindBuffer(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.ARRAY_BUFFER, SpriteBatcher.buffer);
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.bufferData(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.ARRAY_BUFFER, new Float32Array(batch.verts), _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.DYNAMIC_DRAW);
            const stride = 9 * 4;
            let posLoc = shader.getAttribLocation("a_pos");
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.vertexAttribPointer(posLoc, 3, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.FLOAT, false, stride, 0);
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.enableVertexAttribArray(posLoc);
            let texLoc = shader.getAttribLocation("a_textCoord");
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.vertexAttribPointer(texLoc, 2, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.FLOAT, false, stride, 3 * 4);
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.enableVertexAttribArray(texLoc);
            let colLoc = shader.getAttribLocation("a_color");
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.vertexAttribPointer(colLoc, 4, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.FLOAT, false, stride, 5 * 4);
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.enableVertexAttribArray(colLoc);
            let vertexCount = batch.verts.length / 9;
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.drawArrays(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TRIANGLES, 0, vertexCount);
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.disableVertexAttribArray(posLoc);
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.disableVertexAttribArray(texLoc);
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.disableVertexAttribArray(colLoc);
            batch.verts.length = 0;
        });
    }
}
SpriteBatcher.batches = new Map();
SpriteBatcher.buffer = null;
SpriteBatcher.batchShader = null;
class BatchSpriteShader extends _gl_shader__WEBPACK_IMPORTED_MODULE_1__.Shader {
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


/***/ },

/***/ "./BdvEngine/core/graphics/texture.ts"
/*!********************************************!*\
  !*** ./BdvEngine/core/graphics/texture.ts ***!
  \********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Texture: () => (/* binding */ Texture)
/* harmony export */ });
/* harmony import */ var _gl_gl__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../gl/gl */ "./BdvEngine/core/gl/gl.ts");
/* harmony import */ var _com_message__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../com/message */ "./BdvEngine/core/com/message.ts");
/* harmony import */ var _assets_assetManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../assets/assetManager */ "./BdvEngine/core/assets/assetManager.ts");



const LEVEL = 0;
const BORDER = 0;
const TEMP_IMAGE_DATA = new Uint8Array([255, 255, 255, 255]);
class Texture {
    constructor(name, width = 1, height = 1) {
        this.isLoaded = false;
        this.name = name;
        this.width = width;
        this.height = height;
        this.handle = _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.createTexture();
        _com_message__WEBPACK_IMPORTED_MODULE_1__.Message.subscribe(`${_assets_assetManager__WEBPACK_IMPORTED_MODULE_2__.MESSAGE_ASSET_LOADER_LOADED}::${this.name}`, this);
        this.bind();
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.pixelStorei(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.UNPACK_ALIGNMENT, 1);
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.texImage2D(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_2D, LEVEL, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.RGBA, 1, 1, BORDER, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.RGBA, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.UNSIGNED_BYTE, TEMP_IMAGE_DATA);
        let asset = _assets_assetManager__WEBPACK_IMPORTED_MODULE_2__.AssetManager.get(this.name);
        if (asset) {
            this.loadTexture(asset);
        }
    }
    destructor() {
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.deleteTexture(this.handle);
    }
    get textureName() {
        return this.name;
    }
    get textureWidth() {
        return this.width;
    }
    get textureHeight() {
        return this.height;
    }
    get textureIsLoaded() {
        return this.isLoaded;
    }
    activate(textureUnit = 0) {
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.activeTexture(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE0 + textureUnit);
        this.bind();
    }
    bind() {
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.bindTexture(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_2D, this.handle);
    }
    unbind() {
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.bindTexture(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_2D, null);
    }
    onMessage(message) {
        if (message.code === `${_assets_assetManager__WEBPACK_IMPORTED_MODULE_2__.MESSAGE_ASSET_LOADER_LOADED}::${this.name}`) {
            this.loadTexture(message.context);
        }
    }
    loadTexture(asset) {
        this.width = asset.width;
        this.height = asset.height;
        this.bind();
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.texImage2D(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_2D, LEVEL, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.RGBA, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.RGBA, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.UNSIGNED_BYTE, asset.data);
        if (this.isPow2()) {
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.generateMipmap(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_2D);
        }
        else {
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.texParameteri(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_2D, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_WRAP_S, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.CLAMP_TO_EDGE);
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.texParameteri(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_2D, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_WRAP_T, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.CLAMP_TO_EDGE);
        }
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.texParameteri(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_2D, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_MIN_FILTER, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.NEAREST);
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.texParameteri(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_2D, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_MAG_FILTER, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.NEAREST);
        this.isLoaded = true;
    }
    isPow2() {
        return this.isValPow2(this.width) && this.isValPow2(this.height);
    }
    isValPow2(value) {
        return (value & (value - 1)) == 0;
    }
}


/***/ },

/***/ "./BdvEngine/core/graphics/textureManager.ts"
/*!***************************************************!*\
  !*** ./BdvEngine/core/graphics/textureManager.ts ***!
  \***************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   TextureManager: () => (/* binding */ TextureManager)
/* harmony export */ });
/* harmony import */ var _texture__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./texture */ "./BdvEngine/core/graphics/texture.ts");
/* harmony import */ var _textureNode__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./textureNode */ "./BdvEngine/core/graphics/textureNode.ts");


class TextureManager {
    constructor() { }
    static getTexture(name) {
        if (!TextureManager.textures[name]) {
            let texture = new _texture__WEBPACK_IMPORTED_MODULE_0__.Texture(name);
            TextureManager.textures[name] = new _textureNode__WEBPACK_IMPORTED_MODULE_1__.TextureNode(texture);
        }
        else {
            TextureManager.textures[name].count++;
        }
        return TextureManager.textures[name].texture;
    }
    static flushTexture(name) {
        if (!TextureManager.textures[name]) {
            console.log(`TextureManager::Texture ${name} does not exists and cannot be flushed.`);
        }
        else {
            TextureManager.textures[name].count--;
            if (TextureManager.textures[name].count < 1) {
                TextureManager.textures[name].texture.destructor();
                TextureManager.textures[name] = undefined;
                delete TextureManager.textures[name];
            }
        }
    }
}
TextureManager.textures = {};


/***/ },

/***/ "./BdvEngine/core/graphics/textureNode.ts"
/*!************************************************!*\
  !*** ./BdvEngine/core/graphics/textureNode.ts ***!
  \************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   TextureNode: () => (/* binding */ TextureNode)
/* harmony export */ });
class TextureNode {
    constructor(texture) {
        this.count = 1;
        this.texture = texture;
    }
}


/***/ },

/***/ "./BdvEngine/core/graphics/tileMap.ts"
/*!********************************************!*\
  !*** ./BdvEngine/core/graphics/tileMap.ts ***!
  \********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   TileMap: () => (/* binding */ TileMap),
/* harmony export */   TileSet: () => (/* binding */ TileSet)
/* harmony export */ });
/* harmony import */ var _gl_gl__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../gl/gl */ "./BdvEngine/core/gl/gl.ts");
/* harmony import */ var _color__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./color */ "./BdvEngine/core/graphics/color.ts");
/* harmony import */ var _spriteBatcher__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./spriteBatcher */ "./BdvEngine/core/graphics/spriteBatcher.ts");
/* harmony import */ var _material__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./material */ "./BdvEngine/core/graphics/material.ts");
/* harmony import */ var _materialManager__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./materialManager */ "./BdvEngine/core/graphics/materialManager.ts");





class TileSet {
    constructor(config) {
        this.uvs = [];
        this.cols = 0;
        this.rows = 0;
        this.ready = false;
        this.filtering = 'nearest';
        this.tileWidth = config.tileWidth;
        this.tileHeight = config.tileHeight;
        this.material = new _material__WEBPACK_IMPORTED_MODULE_3__.Material(config.materialName, config.imagePath, _color__WEBPACK_IMPORTED_MODULE_1__.Color.white());
        _materialManager__WEBPACK_IMPORTED_MODULE_4__.MaterialManager.register(this.material);
    }
    computeUVs() {
        if (this.ready)
            return true;
        let tex = this.material.diffTexture;
        if (!tex || !tex.textureIsLoaded)
            return false;
        if (this.filtering === 'linear') {
            tex.bind();
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.texParameteri(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_2D, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_MIN_FILTER, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.LINEAR);
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.texParameteri(_gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_2D, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_MAG_FILTER, _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.LINEAR);
        }
        let texW = tex.textureWidth;
        let texH = tex.textureHeight;
        this.cols = Math.floor(texW / this.tileWidth);
        this.rows = Math.floor(texH / this.tileHeight);
        this.uvs = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                let u0 = (c * this.tileWidth) / texW;
                let v0 = (r * this.tileHeight) / texH;
                let u1 = ((c + 1) * this.tileWidth) / texW;
                let v1 = ((r + 1) * this.tileHeight) / texH;
                this.uvs.push({ u0, v0, u1, v1 });
            }
        }
        this.ready = true;
        return true;
    }
    get tileCount() { return this.uvs.length; }
    get isReady() { return this.ready; }
    getUV(tileIndex) {
        if (tileIndex < 0 || tileIndex >= this.uvs.length)
            return null;
        return this.uvs[tileIndex];
    }
}
class TileMap {
    constructor(tileSet, mapWidth, mapHeight, renderTileSize = 16) {
        this.heightScale = 6;
        this.shadowStrength = 0.45;
        this.lodTileSet = null;
        this.lodThreshold = 6;
        this.importantTiles = new Set();
        this.tileSet = tileSet;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.renderTileSize = renderTileSize;
        this.tiles = new Int16Array(mapWidth * mapHeight);
        this.tiles.fill(-1);
        this.heights = new Float32Array(mapWidth * mapHeight);
    }
    setTile(x, y, tileIndex) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight)
            return;
        this.tiles[y * this.mapWidth + x] = tileIndex;
    }
    getTile(x, y) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight)
            return -1;
        return this.tiles[y * this.mapWidth + x];
    }
    setHeight(x, y, height) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight)
            return;
        this.heights[y * this.mapWidth + x] = height;
    }
    getHeight(x, y) {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight)
            return 0;
        return this.heights[y * this.mapWidth + x];
    }
    fill(tileIndex) { this.tiles.fill(tileIndex); }
    get width() { return this.mapWidth; }
    get height() { return this.mapHeight; }
    get tileSize() { return this.renderTileSize; }
    render(camera, screenW, screenH) {
        if (!this.tileSet.computeUVs())
            return;
        let ts = this.renderTileSize;
        let zoom = camera.zoom;
        let screenTs = ts * zoom;
        let useLod = this.lodTileSet && screenTs < this.lodThreshold;
        let activeTileSet = useLod ? this.lodTileSet : this.tileSet;
        if (useLod && !activeTileSet.computeUVs()) {
            activeTileSet = this.tileSet;
        }
        let step = 1;
        if (screenTs < 4)
            step = 8;
        else if (screenTs < 6)
            step = 4;
        else if (screenTs < 10)
            step = 2;
        let halfW = screenW / 2 / zoom;
        let halfH = screenH / 2 / zoom;
        let camTX = camera.x / ts;
        let camTY = camera.y / ts;
        let margin = 2;
        let startX = Math.max(0, Math.floor(camTX - halfW / ts) - 1);
        let startY = Math.max(0, Math.floor(camTY - halfH / ts) - margin);
        let endX = Math.min(this.mapWidth, Math.ceil(camTX + halfW / ts) + 1);
        let endY = Math.min(this.mapHeight, Math.ceil(camTY + halfH / ts) + 2);
        startX = Math.floor(startX / step) * step;
        startY = Math.floor(startY / step) * step;
        let mat = activeTileSet.material;
        let baseR = mat.diffColor.rFloat;
        let baseG = mat.diffColor.gFloat;
        let baseB = mat.diffColor.bFloat;
        let baseA = mat.diffColor.aFloat;
        let texture = mat.diffTexture;
        if (!texture)
            return;
        let key = "__default_batch__:" + mat.diffTextureName;
        let batches = _spriteBatcher__WEBPACK_IMPORTED_MODULE_2__.SpriteBatcher.batches;
        if (!batches) {
            _spriteBatcher__WEBPACK_IMPORTED_MODULE_2__.SpriteBatcher.ensureInit();
            batches = _spriteBatcher__WEBPACK_IMPORTED_MODULE_2__.SpriteBatcher.batches;
        }
        let batchEntry = batches.get(key);
        if (!batchEntry) {
            batchEntry = { verts: [], texture: texture, material: null };
            batches.set(key, batchEntry);
        }
        let buf = batchEntry.verts;
        let hasImportant = this.importantTiles.size > 0 && step > 1;
        let showImportant = hasImportant && step <= 2;
        let iterStep = showImportant ? 1 : step;
        for (let y = startY; y < endY; y += iterStep) {
            for (let x = startX; x < endX; x += iterStep) {
                let tileIdx = this.tiles[y * this.mapWidth + x];
                if (tileIdx < 0)
                    continue;
                let onGrid = (x % step === 0) && (y % step === 0);
                let isImportantTile = this.importantTiles.has(tileIdx);
                if (isImportantTile) {
                    if (!showImportant)
                        continue;
                }
                else {
                    if (!onGrid)
                        continue;
                }
                let uv = activeTileSet.getUV(tileIdx);
                if (!uv)
                    continue;
                let r = baseR, g = baseG, b = baseB;
                let tileStep = (onGrid && !isImportantTile) ? step : 1;
                let wx = x * ts;
                let wy = y * ts;
                let wx2 = (x + tileStep) * ts;
                let wy2 = (y + tileStep) * ts;
                buf.push(wx, wy, 0, uv.u0, uv.v0, r, g, b, baseA, wx, wy2, 0, uv.u0, uv.v1, r, g, b, baseA, wx2, wy2, 0, uv.u1, uv.v1, r, g, b, baseA, wx2, wy2, 0, uv.u1, uv.v1, r, g, b, baseA, wx2, wy, 0, uv.u1, uv.v0, r, g, b, baseA, wx, wy, 0, uv.u0, uv.v0, r, g, b, baseA);
            }
        }
    }
}


/***/ },

/***/ "./BdvEngine/core/graphics/vertex.ts"
/*!*******************************************!*\
  !*** ./BdvEngine/core/graphics/vertex.ts ***!
  \*******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Vertex: () => (/* binding */ Vertex)
/* harmony export */ });
/* harmony import */ var _utils_vec3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/vec3 */ "./BdvEngine/core/utils/vec3.ts");
/* harmony import */ var _utils_vec2__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/vec2 */ "./BdvEngine/core/utils/vec2.ts");


class Vertex {
    constructor(x = 0, y = 0, z = 0, tu = 0, tv = 0) {
        this.position = _utils_vec3__WEBPACK_IMPORTED_MODULE_0__.vec3.zero;
        this.texCoords = _utils_vec2__WEBPACK_IMPORTED_MODULE_1__.vec2.zero;
        this.position.vx = x;
        this.position.vy = y;
        this.position.vz = z;
        this.texCoords.vx = tu;
        this.texCoords.vy = tv;
    }
    toArray() {
        let array = [];
        array = array.concat(this.position.toArray());
        array = array.concat(this.texCoords.toArray());
        return array;
    }
    toFloat32Array() {
        return new Float32Array(this.toArray());
    }
}


/***/ },

/***/ "./BdvEngine/core/input/inputManager.ts"
/*!**********************************************!*\
  !*** ./BdvEngine/core/input/inputManager.ts ***!
  \**********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   InputManager: () => (/* binding */ InputManager),
/* harmony export */   Keys: () => (/* binding */ Keys),
/* harmony export */   MouseContext: () => (/* binding */ MouseContext)
/* harmony export */ });
/* harmony import */ var _utils_vec2__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/vec2 */ "./BdvEngine/core/utils/vec2.ts");
/* harmony import */ var _com_message__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../com/message */ "./BdvEngine/core/com/message.ts");


var Keys;
(function (Keys) {
    Keys[Keys["LEFT"] = 37] = "LEFT";
    Keys[Keys["UP"] = 38] = "UP";
    Keys[Keys["RIGHT"] = 39] = "RIGHT";
    Keys[Keys["DOWN"] = 40] = "DOWN";
    Keys[Keys["W"] = 87] = "W";
    Keys[Keys["A"] = 65] = "A";
    Keys[Keys["S"] = 83] = "S";
    Keys[Keys["D"] = 68] = "D";
    Keys[Keys["SPACE"] = 32] = "SPACE";
    Keys[Keys["SHIFT"] = 16] = "SHIFT";
    Keys[Keys["ENTER"] = 13] = "ENTER";
    Keys[Keys["ESCAPE"] = 27] = "ESCAPE";
    Keys[Keys["Q"] = 81] = "Q";
    Keys[Keys["E"] = 69] = "E";
    Keys[Keys["R"] = 82] = "R";
    Keys[Keys["F"] = 70] = "F";
    Keys[Keys["Z"] = 90] = "Z";
    Keys[Keys["X"] = 88] = "X";
    Keys[Keys["C"] = 67] = "C";
    Keys[Keys["V"] = 86] = "V";
})(Keys || (Keys = {}));
class MouseContext {
    constructor(leftDown, rightDown, position) {
        this.leftDown = leftDown;
        this.rightDown = rightDown;
        this.position = position;
    }
}
class InputManager {
    static initialize() {
        for (let i = 0; i < 255; ++i) {
            InputManager._keys[i] = false;
        }
        window.addEventListener("keydown", InputManager.onKeyDown);
        window.addEventListener("keyup", InputManager.onKeyUp);
        window.addEventListener("mousemove", InputManager.onMouseMove);
        window.addEventListener("mousedown", InputManager.onMouseDown);
        window.addEventListener("mouseup", InputManager.onMouseUp);
        window.addEventListener("wheel", InputManager.onWheel, { passive: false });
    }
    static isKeyDown(key) {
        return InputManager._keys[key];
    }
    static consumeWheelDelta() {
        let d = InputManager._wheelDelta;
        InputManager._wheelDelta = 0;
        return d;
    }
    static getMousePosition() {
        return new _utils_vec2__WEBPACK_IMPORTED_MODULE_0__.vec2(this._mouseX, this._mouseY);
    }
    static onKeyDown(event) {
        InputManager._keys[event.keyCode] = true;
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
    static onKeyUp(event) {
        InputManager._keys[event.keyCode] = false;
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
    static onMouseMove(event) {
        InputManager._previousMouseX = InputManager._mouseX;
        InputManager._previousMouseY = InputManager._mouseY;
        InputManager._mouseX = event.clientX;
        InputManager._mouseY = event.clientY;
    }
    static onMouseDown(event) {
        if (event.button === 0) {
            InputManager._leftDown = true;
        }
        else if (event.button === 2) {
            InputManager._rightDown = true;
        }
        _com_message__WEBPACK_IMPORTED_MODULE_1__.Message.send("MOUSE_DOWN", InputManager, new MouseContext(InputManager._leftDown, InputManager._rightDown, InputManager.getMousePosition()));
    }
    static onMouseUp(event) {
        if (event.button === 0) {
            InputManager._leftDown = false;
        }
        else if (event.button === 2) {
            InputManager._rightDown = false;
        }
        _com_message__WEBPACK_IMPORTED_MODULE_1__.Message.send("MOUSE_UP", InputManager, new MouseContext(InputManager._leftDown, InputManager._rightDown, InputManager.getMousePosition()));
    }
    static onWheel(event) {
        event.preventDefault();
        InputManager._wheelDelta += event.deltaY;
    }
}
InputManager._keys = [];
InputManager._leftDown = false;
InputManager._rightDown = false;
InputManager._wheelDelta = 0;


/***/ },

/***/ "./BdvEngine/core/registrations.ts"
/*!*****************************************!*\
  !*** ./BdvEngine/core/registrations.ts ***!
  \*****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _components_spriteComponent__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./components/spriteComponent */ "./BdvEngine/core/components/spriteComponent.ts");
/* harmony import */ var _components_animatedSpriteComponent__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./components/animatedSpriteComponent */ "./BdvEngine/core/components/animatedSpriteComponent.ts");
/* harmony import */ var _behaviors_keyboardMovementBehavior__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./behaviors/keyboardMovementBehavior */ "./BdvEngine/core/behaviors/keyboardMovementBehavior.ts");
/* harmony import */ var _behaviors_rotationBehavior__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./behaviors/rotationBehavior */ "./BdvEngine/core/behaviors/rotationBehavior.ts");
/* harmony import */ var _behaviors_statefulAnimationBehavior__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./behaviors/statefulAnimationBehavior */ "./BdvEngine/core/behaviors/statefulAnimationBehavior.ts");
/* harmony import */ var _behaviors_rigidBodyBehavior__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./behaviors/rigidBodyBehavior */ "./BdvEngine/core/behaviors/rigidBodyBehavior.ts");
/* harmony import */ var _behaviors_rayCastBehavior__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./behaviors/rayCastBehavior */ "./BdvEngine/core/behaviors/rayCastBehavior.ts");
/* harmony import */ var _components_colliderComponent__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./components/colliderComponent */ "./BdvEngine/core/components/colliderComponent.ts");










/***/ },

/***/ "./BdvEngine/core/ui/ui.ts"
/*!*********************************!*\
  !*** ./BdvEngine/core/ui/ui.ts ***!
  \*********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   UI: () => (/* binding */ UI)
/* harmony export */ });
class UI {
    static ensureRoot() {
        if (!UI.root) {
            UI.root = document.createElement("div");
            UI.root.style.cssText =
                "position:fixed;top:0;left:0;width:100%;height:100%;" +
                    "pointer-events:none;z-index:1000;overflow:hidden;";
            document.body.appendChild(UI.root);
        }
        return UI.root;
    }
    static applyStyles(el, styles) {
        if (!styles)
            return;
        for (let key in styles) {
            el.style[key] = styles[key];
        }
    }
    static clear() {
        if (UI.root) {
            UI.root.innerHTML = "";
        }
    }
    static remove(element) {
        var _a;
        (_a = element.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(element);
    }
    static panel(x, y, styles, parent) {
        let el = document.createElement("div");
        el.style.cssText =
            `position:absolute;left:${x}px;top:${y}px;pointer-events:auto;`;
        UI.applyStyles(el, styles);
        (parent || UI.ensureRoot()).appendChild(el);
        return el;
    }
    static text(parent, content, styles) {
        let el = document.createElement("div");
        el.textContent = content;
        el.style.cssText = "color:white;font:14px sans-serif;pointer-events:none;";
        UI.applyStyles(el, styles);
        parent.appendChild(el);
        return el;
    }
    static heading(parent, content, styles) {
        return UI.text(parent, content, Object.assign({ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }, styles));
    }
    static setText(element, content) {
        element.textContent = content;
    }
    static button(parent, label, onClick, styles) {
        let el = document.createElement("button");
        el.textContent = label;
        el.style.cssText =
            "padding:6px 14px;font:14px sans-serif;cursor:pointer;pointer-events:auto;" +
                "border:1px solid #555;background:#333;color:white;border-radius:3px;margin:2px;";
        el.addEventListener("click", (e) => {
            e.stopPropagation();
            onClick();
        });
        UI.applyStyles(el, styles);
        parent.appendChild(el);
        return el;
    }
    static checkbox(parent, label, checked, onChange, styles) {
        let wrapper = document.createElement("label");
        wrapper.style.cssText =
            "display:flex;align-items:center;gap:6px;color:white;font:14px sans-serif;" +
                "pointer-events:auto;cursor:pointer;margin:2px 0;";
        UI.applyStyles(wrapper, styles);
        let input = document.createElement("input");
        input.type = "checkbox";
        input.checked = checked;
        input.addEventListener("change", (e) => {
            e.stopPropagation();
            onChange(input.checked);
        });
        let span = document.createElement("span");
        span.textContent = label;
        wrapper.appendChild(input);
        wrapper.appendChild(span);
        parent.appendChild(wrapper);
        return wrapper;
    }
    static slider(parent, label, min, max, value, onChange, styles) {
        let wrapper = document.createElement("div");
        wrapper.style.cssText =
            "display:flex;align-items:center;gap:6px;color:white;font:14px sans-serif;" +
                "pointer-events:auto;margin:2px 0;";
        UI.applyStyles(wrapper, styles);
        let span = document.createElement("span");
        span.textContent = label;
        let input = document.createElement("input");
        input.type = "range";
        input.min = String(min);
        input.max = String(max);
        input.value = String(value);
        input.style.cssText = "flex:1;cursor:pointer;";
        let valDisplay = document.createElement("span");
        valDisplay.textContent = String(value);
        valDisplay.style.minWidth = "30px";
        input.addEventListener("input", (e) => {
            e.stopPropagation();
            let v = Number(input.value);
            valDisplay.textContent = String(v);
            onChange(v);
        });
        wrapper.appendChild(span);
        wrapper.appendChild(input);
        wrapper.appendChild(valDisplay);
        parent.appendChild(wrapper);
        return wrapper;
    }
    static input(parent, placeholder, onChange, styles) {
        let el = document.createElement("input");
        el.type = "text";
        el.placeholder = placeholder;
        el.style.cssText =
            "padding:4px 8px;font:14px sans-serif;pointer-events:auto;" +
                "border:1px solid #555;background:#222;color:white;border-radius:3px;margin:2px;";
        el.addEventListener("input", (e) => {
            e.stopPropagation();
            onChange(el.value);
        });
        el.addEventListener("keydown", (e) => e.stopPropagation());
        el.addEventListener("keyup", (e) => e.stopPropagation());
        UI.applyStyles(el, styles);
        parent.appendChild(el);
        return el;
    }
    static select(parent, options, selected, onChange, styles) {
        let el = document.createElement("select");
        el.style.cssText =
            "padding:4px 8px;font:14px sans-serif;pointer-events:auto;" +
                "border:1px solid #555;background:#222;color:white;border-radius:3px;margin:2px;";
        for (let i = 0; i < options.length; i++) {
            let opt = document.createElement("option");
            opt.value = String(i);
            opt.textContent = options[i];
            if (i === selected)
                opt.selected = true;
            el.appendChild(opt);
        }
        el.addEventListener("change", (e) => {
            e.stopPropagation();
            onChange(el.selectedIndex, options[el.selectedIndex]);
        });
        UI.applyStyles(el, styles);
        parent.appendChild(el);
        return el;
    }
    static row(parent, styles) {
        let el = document.createElement("div");
        el.style.cssText = "display:flex;flex-direction:row;gap:4px;align-items:center;";
        UI.applyStyles(el, styles);
        parent.appendChild(el);
        return el;
    }
    static column(parent, styles) {
        let el = document.createElement("div");
        el.style.cssText = "display:flex;flex-direction:column;gap:4px;";
        UI.applyStyles(el, styles);
        parent.appendChild(el);
        return el;
    }
    static spacer(parent, height = 8) {
        let el = document.createElement("div");
        el.style.height = `${height}px`;
        parent.appendChild(el);
        return el;
    }
    static image(parent, src, styles) {
        let el = document.createElement("img");
        el.src = src;
        el.style.cssText = "pointer-events:none;";
        UI.applyStyles(el, styles);
        parent.appendChild(el);
        return el;
    }
    static progressBar(parent, value, styles) {
        let container = document.createElement("div");
        container.style.cssText =
            "width:100%;height:16px;background:#222;border:1px solid #555;border-radius:3px;overflow:hidden;margin:2px 0;";
        UI.applyStyles(container, styles);
        let fill = document.createElement("div");
        fill.style.cssText =
            `width:${Math.max(0, Math.min(100, value))}%;height:100%;background:#4a4;transition:width 0.1s;`;
        container.appendChild(fill);
        parent.appendChild(container);
        return {
            container,
            fill,
            setValue: (v) => {
                fill.style.width = `${Math.max(0, Math.min(100, v))}%`;
            },
        };
    }
}
UI.root = null;


/***/ },

/***/ "./BdvEngine/core/utils/collision.ts"
/*!*******************************************!*\
  !*** ./BdvEngine/core/utils/collision.ts ***!
  \*******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Collision: () => (/* binding */ Collision)
/* harmony export */ });
class Collision {
    static rectRect(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }
    static circleCircle(ax, ay, ar, bx, by, br) {
        let dx = ax - bx, dy = ay - by;
        let dist = dx * dx + dy * dy;
        let radSum = ar + br;
        return dist < radSum * radSum;
    }
    static pointRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    }
    static pointCircle(px, py, cx, cy, cr) {
        let dx = px - cx, dy = py - cy;
        return dx * dx + dy * dy < cr * cr;
    }
    static circleRect(cx, cy, cr, rx, ry, rw, rh) {
        let nearestX = Math.max(rx, Math.min(cx, rx + rw));
        let nearestY = Math.max(ry, Math.min(cy, ry + rh));
        let dx = cx - nearestX, dy = cy - nearestY;
        return dx * dx + dy * dy < cr * cr;
    }
    static lineRect(x1, y1, x2, y2, rx, ry, rw, rh) {
        if (Collision.pointRect(x1, y1, rx, ry, rw, rh))
            return true;
        if (Collision.pointRect(x2, y2, rx, ry, rw, rh))
            return true;
        if (Collision.lineLine(x1, y1, x2, y2, rx, ry, rx + rw, ry))
            return true;
        if (Collision.lineLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh))
            return true;
        if (Collision.lineLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh))
            return true;
        if (Collision.lineLine(x1, y1, x2, y2, rx, ry, rx, ry + rh))
            return true;
        return false;
    }
    static lineLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        let denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (denom === 0)
            return false;
        let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }
    static rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
        let overlapX = Math.min(ax + aw - bx, bx + bw - ax);
        let overlapY = Math.min(ay + ah - by, by + bh - ay);
        if (overlapX <= 0 || overlapY <= 0)
            return null;
        if (overlapX < overlapY) {
            return { x: (ax + aw / 2 < bx + bw / 2) ? -overlapX : overlapX, y: 0 };
        }
        else {
            return { x: 0, y: (ay + ah / 2 < by + bh / 2) ? -overlapY : overlapY };
        }
    }
    static rayRect(originX, originY, dirX, dirY, rx, ry, rw, rh) {
        let tmin = -Infinity, tmax = Infinity;
        if (dirX !== 0) {
            let t1 = (rx - originX) / dirX;
            let t2 = (rx + rw - originX) / dirX;
            tmin = Math.max(tmin, Math.min(t1, t2));
            tmax = Math.min(tmax, Math.max(t1, t2));
        }
        else if (originX < rx || originX > rx + rw) {
            return -1;
        }
        if (dirY !== 0) {
            let t1 = (ry - originY) / dirY;
            let t2 = (ry + rh - originY) / dirY;
            tmin = Math.max(tmin, Math.min(t1, t2));
            tmax = Math.min(tmax, Math.max(t1, t2));
        }
        else if (originY < ry || originY > ry + rh) {
            return -1;
        }
        if (tmax >= tmin && tmax >= 0) {
            return tmin >= 0 ? tmin : tmax;
        }
        return -1;
    }
}


/***/ },

/***/ "./BdvEngine/core/utils/m4x4.ts"
/*!**************************************!*\
  !*** ./BdvEngine/core/utils/m4x4.ts ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   m4x4: () => (/* binding */ m4x4)
/* harmony export */ });
class m4x4 {
    constructor() {
        this.data = [];
        this.data = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    }
    get mData() {
        return this.data;
    }
    static identity() {
        return new m4x4();
    }
    static ortho(left, right, bottom, top, zNear, zFar) {
        let m = new m4x4();
        let lr = 1.0 / (left - right);
        let bt = 1.0 / (bottom - top);
        let nf = 1.0 / (zNear - zFar);
        m.data[0] = -2.0 * lr;
        m.data[5] = -2.0 * bt;
        m.data[10] = 2.0 * nf;
        m.data[12] = (left + right) * lr;
        m.data[13] = (top + bottom) * bt;
        m.data[14] = (zFar + zNear) * nf;
        return m;
    }
    static translation(position) {
        let m = new m4x4();
        m.data[12] = position.vx;
        m.data[13] = position.vy;
        m.data[14] = position.vz;
        return m;
    }
    static rotationX(angleInRadians) {
        let m = new m4x4();
        let c = Math.cos(angleInRadians);
        let s = Math.sin(angleInRadians);
        m.data[5] = c;
        m.data[6] = s;
        m.data[9] = -s;
        m.data[10] = c;
        return m;
    }
    static rotationY(angleInRadians) {
        let m = new m4x4();
        let c = Math.cos(angleInRadians);
        let s = Math.sin(angleInRadians);
        m.data[0] = c;
        m.data[2] = -s;
        m.data[8] = s;
        m.data[10] = c;
        return m;
    }
    static rotationZ(angleInRadians) {
        let m = new m4x4();
        let c = Math.cos(angleInRadians);
        let s = Math.sin(angleInRadians);
        m.data[0] = c;
        m.data[1] = s;
        m.data[4] = -s;
        m.data[5] = c;
        return m;
    }
    static rotationXYZ(xRadians, yRadians, zRadians) {
        let rx = m4x4.rotationX(xRadians);
        let ry = m4x4.rotationY(yRadians);
        let rz = m4x4.rotationZ(zRadians);
        return m4x4.multiply(m4x4.multiply(rz, ry), rx);
    }
    static scale(scale) {
        let m = new m4x4();
        m.data[0] = scale.vx;
        m.data[5] = scale.vy;
        m.data[10] = scale.vz;
        return m;
    }
    static multiply(a, b) {
        let m = new m4x4();
        let b00 = b.data[0 * 4 + 0];
        let b01 = b.data[0 * 4 + 1];
        let b02 = b.data[0 * 4 + 2];
        let b03 = b.data[0 * 4 + 3];
        let b10 = b.data[1 * 4 + 0];
        let b11 = b.data[1 * 4 + 1];
        let b12 = b.data[1 * 4 + 2];
        let b13 = b.data[1 * 4 + 3];
        let b20 = b.data[2 * 4 + 0];
        let b21 = b.data[2 * 4 + 1];
        let b22 = b.data[2 * 4 + 2];
        let b23 = b.data[2 * 4 + 3];
        let b30 = b.data[3 * 4 + 0];
        let b31 = b.data[3 * 4 + 1];
        let b32 = b.data[3 * 4 + 2];
        let b33 = b.data[3 * 4 + 3];
        let a00 = a.data[0 * 4 + 0];
        let a01 = a.data[0 * 4 + 1];
        let a02 = a.data[0 * 4 + 2];
        let a03 = a.data[0 * 4 + 3];
        let a10 = a.data[1 * 4 + 0];
        let a11 = a.data[1 * 4 + 1];
        let a12 = a.data[1 * 4 + 2];
        let a13 = a.data[1 * 4 + 3];
        let a20 = a.data[2 * 4 + 0];
        let a21 = a.data[2 * 4 + 1];
        let a22 = a.data[2 * 4 + 2];
        let a23 = a.data[2 * 4 + 3];
        let a30 = a.data[3 * 4 + 0];
        let a31 = a.data[3 * 4 + 1];
        let a32 = a.data[3 * 4 + 2];
        let a33 = a.data[3 * 4 + 3];
        m.data[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
        m.data[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
        m.data[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
        m.data[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
        m.data[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
        m.data[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
        m.data[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
        m.data[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
        m.data[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
        m.data[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
        m.data[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
        m.data[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
        m.data[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
        m.data[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
        m.data[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
        m.data[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
        return m;
    }
    static perspective(fovRadians, aspect, near, far) {
        let m = new m4x4();
        let f = 1.0 / Math.tan(fovRadians / 2);
        let nf = 1.0 / (near - far);
        m.data[0] = f / aspect;
        m.data[1] = 0;
        m.data[2] = 0;
        m.data[3] = 0;
        m.data[4] = 0;
        m.data[5] = f;
        m.data[6] = 0;
        m.data[7] = 0;
        m.data[8] = 0;
        m.data[9] = 0;
        m.data[10] = (far + near) * nf;
        m.data[11] = -1;
        m.data[12] = 0;
        m.data[13] = 0;
        m.data[14] = 2 * far * near * nf;
        m.data[15] = 0;
        return m;
    }
    static lookAt(eye, target, up) {
        let m = new m4x4();
        let zx = eye.vx - target.vx;
        let zy = eye.vy - target.vy;
        let zz = eye.vz - target.vz;
        let zLen = Math.sqrt(zx * zx + zy * zy + zz * zz);
        zx /= zLen;
        zy /= zLen;
        zz /= zLen;
        let xx = up.vy * zz - up.vz * zy;
        let xy = up.vz * zx - up.vx * zz;
        let xz = up.vx * zy - up.vy * zx;
        let xLen = Math.sqrt(xx * xx + xy * xy + xz * xz);
        xx /= xLen;
        xy /= xLen;
        xz /= xLen;
        let yx = zy * xz - zz * xy;
        let yy = zz * xx - zx * xz;
        let yz = zx * xy - zy * xx;
        m.data[0] = xx;
        m.data[1] = yx;
        m.data[2] = zx;
        m.data[3] = 0;
        m.data[4] = xy;
        m.data[5] = yy;
        m.data[6] = zy;
        m.data[7] = 0;
        m.data[8] = xz;
        m.data[9] = yz;
        m.data[10] = zz;
        m.data[11] = 0;
        m.data[12] = -(xx * eye.vx + xy * eye.vy + xz * eye.vz);
        m.data[13] = -(yx * eye.vx + yy * eye.vy + yz * eye.vz);
        m.data[14] = -(zx * eye.vx + zy * eye.vy + zz * eye.vz);
        m.data[15] = 1;
        return m;
    }
    toFloat32Array() {
        return new Float32Array(this.data);
    }
    copyFrom(m) {
        for (let i = 0; i < 16; i++) {
            this.data[i] = m.data[i];
        }
    }
}


/***/ },

/***/ "./BdvEngine/core/utils/transform.ts"
/*!*******************************************!*\
  !*** ./BdvEngine/core/utils/transform.ts ***!
  \*******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   transform: () => (/* binding */ transform)
/* harmony export */ });
/* harmony import */ var _vec3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./vec3 */ "./BdvEngine/core/utils/vec3.ts");
/* harmony import */ var _m4x4__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./m4x4 */ "./BdvEngine/core/utils/m4x4.ts");


class transform {
    constructor() {
        this.position = _vec3__WEBPACK_IMPORTED_MODULE_0__.vec3.zero;
        this.rotation = _vec3__WEBPACK_IMPORTED_MODULE_0__.vec3.zero;
        this.scale = _vec3__WEBPACK_IMPORTED_MODULE_0__.vec3.one;
    }
    copyFrom(transform) {
        this.position.copyFrom(transform.position);
        this.rotation.copyFrom(transform.rotation);
        this.scale.copyFrom(transform.scale);
    }
    getTransformationMatrix() {
        let translation = _m4x4__WEBPACK_IMPORTED_MODULE_1__.m4x4.translation(this.position);
        let rotation = _m4x4__WEBPACK_IMPORTED_MODULE_1__.m4x4.rotationXYZ(this.rotation.vx, this.rotation.vy, this.rotation.vz);
        let scale = _m4x4__WEBPACK_IMPORTED_MODULE_1__.m4x4.scale(this.scale);
        return _m4x4__WEBPACK_IMPORTED_MODULE_1__.m4x4.multiply(_m4x4__WEBPACK_IMPORTED_MODULE_1__.m4x4.multiply(translation, rotation), scale);
    }
    setFromJson(json) {
        if (json.position !== undefined) {
            this.position.setFromJson(json.position);
        }
        if (json.rotation !== undefined) {
            this.rotation.setFromJson(json.rotation);
        }
        if (json.scale !== undefined) {
            this.scale.setFromJson(json.scale);
        }
    }
}


/***/ },

/***/ "./BdvEngine/core/utils/vec2.ts"
/*!**************************************!*\
  !*** ./BdvEngine/core/utils/vec2.ts ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   vec2: () => (/* binding */ vec2)
/* harmony export */ });
class vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    get vx() {
        return this.x;
    }
    set vx(point) {
        this.x = point;
    }
    get vy() {
        return this.y;
    }
    set vy(point) {
        this.y = point;
    }
    static get zero() {
        return new vec2();
    }
    static get one() {
        return new vec2(1, 1);
    }
    copyFrom(v) {
        this.x = v.x;
        this.y = v.y;
    }
    setFromJson(json) {
        if (json.x !== undefined) {
            this.x = Number(json.x);
        }
        if (json.y !== undefined) {
            this.y = Number(json.y);
        }
    }
    toArray() {
        return [this.x, this.y];
    }
    toFloat32() {
        return new Float32Array(this.toArray());
    }
}


/***/ },

/***/ "./BdvEngine/core/utils/vec3.ts"
/*!**************************************!*\
  !*** ./BdvEngine/core/utils/vec3.ts ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   vec3: () => (/* binding */ vec3)
/* harmony export */ });
class vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    get vx() {
        return this.x;
    }
    set vx(point) {
        this.x = point;
    }
    get vy() {
        return this.y;
    }
    set vy(point) {
        this.y = point;
    }
    get vz() {
        return this.z;
    }
    set vz(point) {
        this.z = point;
    }
    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }
    subtract(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }
    multiply(v) {
        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;
        return this;
    }
    divide(v) {
        this.x /= v.x;
        this.y /= v.y;
        this.z /= v.z;
        return this;
    }
    copyFrom(vec) {
        this.x = vec.x;
        this.y = vec.y;
        this.z = vec.z;
    }
    toArray() {
        return [this.x, this.y, this.z];
    }
    toFloat32() {
        return new Float32Array(this.toArray());
    }
    static get zero() {
        return new vec3();
    }
    static get one() {
        return new vec3(1, 1, 1);
    }
    setFromJson(json) {
        if (json.x !== undefined) {
            this.x = Number(json.x);
        }
        if (json.y !== undefined) {
            this.y = Number(json.y);
        }
        if (json.z !== undefined) {
            this.z = Number(json.z);
        }
    }
}


/***/ },

/***/ "./BdvEngine/core/world/scene.ts"
/*!***************************************!*\
  !*** ./BdvEngine/core/world/scene.ts ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Scene: () => (/* binding */ Scene)
/* harmony export */ });
/* harmony import */ var _simObject__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./simObject */ "./BdvEngine/core/world/simObject.ts");

class Scene {
    constructor() {
        this.root = new _simObject__WEBPACK_IMPORTED_MODULE_0__.SimObject(0, '__root__', this);
    }
    get getRoot() {
        return this.root;
    }
    get isLoaded() {
        return this.root.getIsLoaded;
    }
    addObject(object) {
        this.root.addChild(object);
    }
    removeObject(object) {
        this.root.removeChild(object);
    }
    getObjectByName(name) {
        return this.root.getObjectByName(name);
    }
    load() {
        this.root.load();
    }
    update(deltaTime) {
        this.root.update(deltaTime);
    }
    render(shader) {
        this.root.render(shader);
    }
}


/***/ },

/***/ "./BdvEngine/core/world/simObject.ts"
/*!*******************************************!*\
  !*** ./BdvEngine/core/world/simObject.ts ***!
  \*******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SimObject: () => (/* binding */ SimObject)
/* harmony export */ });
/* harmony import */ var _utils_m4x4__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/m4x4 */ "./BdvEngine/core/utils/m4x4.ts");
/* harmony import */ var _utils_transform__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/transform */ "./BdvEngine/core/utils/transform.ts");


class SimObject {
    constructor(id, name, scene) {
        this.children = [];
        this.isLoaded = false;
        this.components = [];
        this.behaviors = [];
        this.localMatrix = _utils_m4x4__WEBPACK_IMPORTED_MODULE_0__.m4x4.identity();
        this.worldMatrix = _utils_m4x4__WEBPACK_IMPORTED_MODULE_0__.m4x4.identity();
        this.transform = new _utils_transform__WEBPACK_IMPORTED_MODULE_1__.transform();
        this.id = id;
        this.name = name;
        this.scene = scene;
    }
    onAdded(scene) {
        this.scene = scene;
    }
    updateWorldMatrix(parentWorldMatrix) {
        if (parentWorldMatrix) {
            this.worldMatrix = _utils_m4x4__WEBPACK_IMPORTED_MODULE_0__.m4x4.multiply(parentWorldMatrix, this.localMatrix);
        }
        else {
            this.worldMatrix.copyFrom(this.localMatrix);
        }
    }
    get getId() {
        return this.id;
    }
    get getName() {
        return this.name;
    }
    get getLocalMatrix() {
        return this.localMatrix;
    }
    get getWorldMatrix() {
        return this.worldMatrix;
    }
    get getParent() {
        return this.parent;
    }
    get getIsLoaded() {
        return this.isLoaded;
    }
    addChild(child) {
        child.parent = this;
        this.children.push(child);
        child.onAdded(this.scene);
    }
    removeChild(child) {
        let index = this.children.indexOf(child);
        if (index !== -1) {
            child.parent = undefined;
            this.children.splice(index, 1);
        }
    }
    getObjectByName(name) {
        if (this.name === name) {
            return this;
        }
        for (let child of this.children) {
            let result = child.getObjectByName(name);
            if (result) {
                return result;
            }
        }
        return undefined;
    }
    getComponent(name) {
        return this.components.find(c => c.name === name);
    }
    getBehavior(name) {
        return this.behaviors.find(b => b.name === name);
    }
    addComponent(component) {
        this.components.push(component);
        component.setOwner(this);
    }
    addBehavior(behavior) {
        this.behaviors.push(behavior);
        behavior.setOwner(this);
    }
    load() {
        this.isLoaded = true;
        for (let component of this.components) {
            component.load();
        }
        for (let child of this.children) {
            child.load();
        }
    }
    update(deltaTime) {
        this.localMatrix = this.transform.getTransformationMatrix();
        this.updateWorldMatrix(this.parent ? this.parent.getWorldMatrix : undefined);
        for (let component of this.components) {
            component.update(deltaTime);
        }
        for (let b of this.behaviors) {
            b.update(deltaTime);
        }
        for (let child of this.children) {
            child.update(deltaTime);
        }
    }
    render(shader) {
        for (let component of this.components) {
            component.render(shader);
        }
        for (let child of this.children) {
            child.render(shader);
        }
    }
}


/***/ },

/***/ "./BdvEngine/core/world/zone.ts"
/*!**************************************!*\
  !*** ./BdvEngine/core/world/zone.ts ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Zone: () => (/* binding */ Zone),
/* harmony export */   ZoneState: () => (/* binding */ ZoneState)
/* harmony export */ });
/* harmony import */ var _scene__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./scene */ "./BdvEngine/core/world/scene.ts");
/* harmony import */ var _simObject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./simObject */ "./BdvEngine/core/world/simObject.ts");
/* harmony import */ var _components_componentManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../components/componentManager */ "./BdvEngine/core/components/componentManager.ts");
/* harmony import */ var _behaviors_behaviorManager__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../behaviors/behaviorManager */ "./BdvEngine/core/behaviors/behaviorManager.ts");




var ZoneState;
(function (ZoneState) {
    ZoneState[ZoneState["UNINITIALIZED"] = 0] = "UNINITIALIZED";
    ZoneState[ZoneState["LOADING"] = 1] = "LOADING";
    ZoneState[ZoneState["UPDATING"] = 2] = "UPDATING";
})(ZoneState || (ZoneState = {}));
class Zone {
    constructor(id, name, description) {
        this.state = ZoneState.UNINITIALIZED;
        this.globalId = -1;
        this.id = id;
        this.name = name;
        this.description = description;
        this.scene = new _scene__WEBPACK_IMPORTED_MODULE_0__.Scene();
    }
    initialize(zoneData) {
        if (zoneData.objects === undefined) {
            throw new Error("Zone initialization error: objects not present.");
        }
        for (let o in zoneData.objects) {
            let obj = zoneData.objects[o];
            this.loadSimObject(obj, this.scene.getRoot);
        }
    }
    loadSimObject(dataSection, parent) {
        let name = "";
        if (dataSection.name !== undefined) {
            name = String(dataSection.name);
        }
        this.globalId++;
        let simObject = new _simObject__WEBPACK_IMPORTED_MODULE_1__.SimObject(this.globalId, name, this.scene);
        if (dataSection.transform !== undefined) {
            simObject.transform.setFromJson(dataSection.transform);
        }
        if (dataSection.components !== undefined) {
            for (let c in dataSection.components) {
                let data = dataSection.components[c];
                let component = _components_componentManager__WEBPACK_IMPORTED_MODULE_2__.ComponentManager.extractComponent(data);
                simObject.addComponent(component);
            }
        }
        if (dataSection.behaviors !== undefined) {
            for (let b in dataSection.behaviors) {
                let data = dataSection.behaviors[b];
                let behavior = _behaviors_behaviorManager__WEBPACK_IMPORTED_MODULE_3__.BehaviorManager.extractBehavior(data);
                simObject.addBehavior(behavior);
            }
        }
        if (dataSection.children !== undefined) {
            for (let o in dataSection.children) {
                let obj = dataSection.children[o];
                this.loadSimObject(obj, simObject);
            }
        }
        if (parent !== undefined) {
            parent.addChild(simObject);
        }
    }
    get getId() {
        return this.id;
    }
    get getName() {
        return this.name;
    }
    get getDescription() {
        return this.description;
    }
    get getScene() {
        return this.scene;
    }
    load() {
        this.state = ZoneState.LOADING;
        this.scene.load();
        this.state = ZoneState.UPDATING;
    }
    unload() {
        this.state = ZoneState.UNINITIALIZED;
    }
    update(deltaTime) {
        if (this.state === ZoneState.UPDATING) {
            this.scene.update(deltaTime);
        }
    }
    render(shader) {
        if (this.state === ZoneState.UPDATING) {
            this.scene.render(shader);
        }
    }
    onActivate() { }
    onDeactivate() { }
}


/***/ },

/***/ "./BdvEngine/core/world/zoneManager.ts"
/*!*********************************************!*\
  !*** ./BdvEngine/core/world/zoneManager.ts ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ZoneManager: () => (/* binding */ ZoneManager)
/* harmony export */ });
/* harmony import */ var _com_message__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../com/message */ "./BdvEngine/core/com/message.ts");
/* harmony import */ var _assets_assetManager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../assets/assetManager */ "./BdvEngine/core/assets/assetManager.ts");
/* harmony import */ var _zone__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./zone */ "./BdvEngine/core/world/zone.ts");



class ZoneManager {
    constructor() { }
    static init() {
        ZoneManager.instance = new ZoneManager();
    }
    static registerZone(id, path) {
        ZoneManager.registeredZones[id] = path;
    }
    static changeZone(zoneId) {
        if (ZoneManager.currentZone) {
            ZoneManager.currentZone.onDeactivate();
            ZoneManager.currentZone.unload();
            ZoneManager.currentZone = undefined;
        }
        if (ZoneManager.registeredZones[zoneId] !== undefined) {
            if (_assets_assetManager__WEBPACK_IMPORTED_MODULE_1__.AssetManager.isLoaded(ZoneManager.registeredZones[zoneId])) {
                let asset = _assets_assetManager__WEBPACK_IMPORTED_MODULE_1__.AssetManager.get(ZoneManager.registeredZones[zoneId]);
                ZoneManager.loadZone(asset);
            }
            else {
                _com_message__WEBPACK_IMPORTED_MODULE_0__.Message.subscribe(_assets_assetManager__WEBPACK_IMPORTED_MODULE_1__.MESSAGE_ASSET_LOADER_LOADED +
                    "::" +
                    ZoneManager.registeredZones[zoneId], ZoneManager.instance);
                _assets_assetManager__WEBPACK_IMPORTED_MODULE_1__.AssetManager.loadAsset(ZoneManager.registeredZones[zoneId]);
            }
        }
        else {
            throw new Error("Zone id:" + zoneId.toString() + " does not exist.");
        }
    }
    static update(deltaTime) {
        if (ZoneManager.currentZone) {
            ZoneManager.currentZone.update(deltaTime);
        }
    }
    static render(shader) {
        if (ZoneManager.currentZone) {
            ZoneManager.currentZone.render(shader);
        }
    }
    onMessage(message) {
        if (message.code.indexOf(_assets_assetManager__WEBPACK_IMPORTED_MODULE_1__.MESSAGE_ASSET_LOADER_LOADED) !== -1) {
            console.log("ZoneManager::Zone loaded:" + message.code);
            let asset = message.context;
            ZoneManager.loadZone(asset);
        }
    }
    static loadZone(asset) {
        console.log("ZoneManager::Loading zone:" + asset.name);
        let zoneData = asset.data;
        let zoneId;
        if (zoneData.id === undefined) {
            throw new Error("Zone file format exception: Zone id not present.");
        }
        else {
            zoneId = Number(zoneData.id);
        }
        let zoneName;
        if (zoneData.name === undefined) {
            throw new Error("Zone file format exception: Zone name not present.");
        }
        else {
            zoneName = String(zoneData.name);
        }
        let zoneDescription = "";
        if (zoneData.description !== undefined) {
            zoneDescription = String(zoneData.description);
        }
        ZoneManager.currentZone = new _zone__WEBPACK_IMPORTED_MODULE_2__.Zone(zoneId, zoneName, zoneDescription);
        ZoneManager.currentZone.initialize(zoneData);
        ZoneManager.currentZone.onActivate();
        ZoneManager.currentZone.load();
    }
}
ZoneManager.globalZoneId = -1;
ZoneManager.registeredZones = {};


/***/ },

/***/ "./BdvEngine/index.ts"
/*!****************************!*\
  !*** ./BdvEngine/index.ts ***!
  \****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AnimatedEntity: () => (/* reexport safe */ _core_graphics_animatedEntity__WEBPACK_IMPORTED_MODULE_24__.AnimatedEntity),
/* harmony export */   AnimatedSprite: () => (/* reexport safe */ _core_graphics_animatedSprite__WEBPACK_IMPORTED_MODULE_18__.AnimatedSprite),
/* harmony export */   AnimatedSpriteComponent: () => (/* reexport safe */ _core_components_animatedSpriteComponent__WEBPACK_IMPORTED_MODULE_44__.AnimatedSpriteComponent),
/* harmony export */   AnimatedSpriteComponentBuilder: () => (/* reexport safe */ _core_components_animatedSpriteComponent__WEBPACK_IMPORTED_MODULE_44__.AnimatedSpriteComponentBuilder),
/* harmony export */   AnimatedSpriteComponentData: () => (/* reexport safe */ _core_components_animatedSpriteComponent__WEBPACK_IMPORTED_MODULE_44__.AnimatedSpriteComponentData),
/* harmony export */   AssetManager: () => (/* reexport safe */ _core_assets_assetManager__WEBPACK_IMPORTED_MODULE_36__.AssetManager),
/* harmony export */   BaseBehavior: () => (/* reexport safe */ _core_behaviors_baseBehavior__WEBPACK_IMPORTED_MODULE_46__.BaseBehavior),
/* harmony export */   BaseComponent: () => (/* reexport safe */ _core_components_baseComponent__WEBPACK_IMPORTED_MODULE_41__.BaseComponent),
/* harmony export */   BehaviorManager: () => (/* reexport safe */ _core_behaviors_behaviorManager__WEBPACK_IMPORTED_MODULE_47__.BehaviorManager),
/* harmony export */   Camera: () => (/* reexport safe */ _core_3d_camera__WEBPACK_IMPORTED_MODULE_5__.Camera),
/* harmony export */   Camera2D: () => (/* reexport safe */ _core_camera2d__WEBPACK_IMPORTED_MODULE_2__.Camera2D),
/* harmony export */   ColliderComponent: () => (/* reexport safe */ _core_components_colliderComponent__WEBPACK_IMPORTED_MODULE_45__.ColliderComponent),
/* harmony export */   ColliderComponentBuilder: () => (/* reexport safe */ _core_components_colliderComponent__WEBPACK_IMPORTED_MODULE_45__.ColliderComponentBuilder),
/* harmony export */   ColliderComponentData: () => (/* reexport safe */ _core_components_colliderComponent__WEBPACK_IMPORTED_MODULE_45__.ColliderComponentData),
/* harmony export */   Collision: () => (/* reexport safe */ _core_utils_collision__WEBPACK_IMPORTED_MODULE_32__.Collision),
/* harmony export */   Color: () => (/* reexport safe */ _core_graphics_color__WEBPACK_IMPORTED_MODULE_15__.Color),
/* harmony export */   ComponentManager: () => (/* reexport safe */ _core_components_componentManager__WEBPACK_IMPORTED_MODULE_42__.ComponentManager),
/* harmony export */   DefaultShader: () => (/* reexport safe */ _core_gl_shaders_defaultShader__WEBPACK_IMPORTED_MODULE_12__.DefaultShader),
/* harmony export */   Draw: () => (/* reexport safe */ _core_graphics_draw__WEBPACK_IMPORTED_MODULE_21__.Draw),
/* harmony export */   Engine: () => (/* reexport safe */ _core_engine__WEBPACK_IMPORTED_MODULE_1__.Engine),
/* harmony export */   Engine3D: () => (/* reexport safe */ _core_engine3d__WEBPACK_IMPORTED_MODULE_3__.Engine3D),
/* harmony export */   GLStats: () => (/* reexport safe */ _core_gl_glStats__WEBPACK_IMPORTED_MODULE_14__.GLStats),
/* harmony export */   GLUTools: () => (/* reexport safe */ _core_gl_gl__WEBPACK_IMPORTED_MODULE_10__.GLUTools),
/* harmony export */   Game: () => (/* reexport safe */ _core_game__WEBPACK_IMPORTED_MODULE_0__.Game),
/* harmony export */   InputManager: () => (/* reexport safe */ _core_input_inputManager__WEBPACK_IMPORTED_MODULE_35__.InputManager),
/* harmony export */   KeyboardMovementBehavior: () => (/* reexport safe */ _core_behaviors_keyboardMovementBehavior__WEBPACK_IMPORTED_MODULE_48__.KeyboardMovementBehavior),
/* harmony export */   KeyboardMovementBehaviorBuilder: () => (/* reexport safe */ _core_behaviors_keyboardMovementBehavior__WEBPACK_IMPORTED_MODULE_48__.KeyboardMovementBehaviorBuilder),
/* harmony export */   KeyboardMovementBehaviorData: () => (/* reexport safe */ _core_behaviors_keyboardMovementBehavior__WEBPACK_IMPORTED_MODULE_48__.KeyboardMovementBehaviorData),
/* harmony export */   Keys: () => (/* reexport safe */ _core_input_inputManager__WEBPACK_IMPORTED_MODULE_35__.Keys),
/* harmony export */   LitShader: () => (/* reexport safe */ _core_3d_litShader__WEBPACK_IMPORTED_MODULE_8__.LitShader),
/* harmony export */   MESSAGE_ASSET_LOADER_LOADED: () => (/* reexport safe */ _core_assets_assetManager__WEBPACK_IMPORTED_MODULE_36__.MESSAGE_ASSET_LOADER_LOADED),
/* harmony export */   Material: () => (/* reexport safe */ _core_graphics_material__WEBPACK_IMPORTED_MODULE_25__.Material),
/* harmony export */   MaterialManager: () => (/* reexport safe */ _core_graphics_materialManager__WEBPACK_IMPORTED_MODULE_27__.MaterialManager),
/* harmony export */   Mesh: () => (/* reexport safe */ _core_3d_mesh__WEBPACK_IMPORTED_MODULE_6__.Mesh),
/* harmony export */   MeshComponent: () => (/* reexport safe */ _core_3d_meshComponent__WEBPACK_IMPORTED_MODULE_9__.MeshComponent),
/* harmony export */   MeshComponentData: () => (/* reexport safe */ _core_3d_meshComponent__WEBPACK_IMPORTED_MODULE_9__.MeshComponentData),
/* harmony export */   Message: () => (/* reexport safe */ _core_com_message__WEBPACK_IMPORTED_MODULE_33__.Message),
/* harmony export */   MessageBus: () => (/* reexport safe */ _core_com_messageBus__WEBPACK_IMPORTED_MODULE_34__.MessageBus),
/* harmony export */   MessagePriority: () => (/* reexport safe */ _core_com_message__WEBPACK_IMPORTED_MODULE_33__.MessagePriority),
/* harmony export */   MouseContext: () => (/* reexport safe */ _core_input_inputManager__WEBPACK_IMPORTED_MODULE_35__.MouseContext),
/* harmony export */   ObjLoader: () => (/* reexport safe */ _core_3d_objLoader__WEBPACK_IMPORTED_MODULE_7__.ObjLoader),
/* harmony export */   ParticleEmitter: () => (/* reexport safe */ _core_graphics_particleEmitter__WEBPACK_IMPORTED_MODULE_23__.ParticleEmitter),
/* harmony export */   RayCastBehavior: () => (/* reexport safe */ _core_behaviors_rayCastBehavior__WEBPACK_IMPORTED_MODULE_52__.RayCastBehavior),
/* harmony export */   RayCastBehaviorBuilder: () => (/* reexport safe */ _core_behaviors_rayCastBehavior__WEBPACK_IMPORTED_MODULE_52__.RayCastBehaviorBuilder),
/* harmony export */   RayCastBehaviorData: () => (/* reexport safe */ _core_behaviors_rayCastBehavior__WEBPACK_IMPORTED_MODULE_52__.RayCastBehaviorData),
/* harmony export */   RigidBodyBehavior: () => (/* reexport safe */ _core_behaviors_rigidBodyBehavior__WEBPACK_IMPORTED_MODULE_51__.RigidBodyBehavior),
/* harmony export */   RigidBodyBehaviorBuilder: () => (/* reexport safe */ _core_behaviors_rigidBodyBehavior__WEBPACK_IMPORTED_MODULE_51__.RigidBodyBehaviorBuilder),
/* harmony export */   RigidBodyBehaviorData: () => (/* reexport safe */ _core_behaviors_rigidBodyBehavior__WEBPACK_IMPORTED_MODULE_51__.RigidBodyBehaviorData),
/* harmony export */   RotationBehavior: () => (/* reexport safe */ _core_behaviors_rotationBehavior__WEBPACK_IMPORTED_MODULE_49__.RotationBehavior),
/* harmony export */   RotationBehaviorBuilder: () => (/* reexport safe */ _core_behaviors_rotationBehavior__WEBPACK_IMPORTED_MODULE_49__.RotationBehaviorBuilder),
/* harmony export */   RotationBehaviorData: () => (/* reexport safe */ _core_behaviors_rotationBehavior__WEBPACK_IMPORTED_MODULE_49__.RotationBehaviorData),
/* harmony export */   Scene: () => (/* reexport safe */ _core_world_scene__WEBPACK_IMPORTED_MODULE_38__.Scene),
/* harmony export */   Shader: () => (/* reexport safe */ _core_gl_shader__WEBPACK_IMPORTED_MODULE_11__.Shader),
/* harmony export */   SimObject: () => (/* reexport safe */ _core_world_simObject__WEBPACK_IMPORTED_MODULE_37__.SimObject),
/* harmony export */   Sprite: () => (/* reexport safe */ _core_graphics_sprite__WEBPACK_IMPORTED_MODULE_17__.Sprite),
/* harmony export */   SpriteBatcher: () => (/* reexport safe */ _core_graphics_spriteBatcher__WEBPACK_IMPORTED_MODULE_22__.SpriteBatcher),
/* harmony export */   SpriteComponent: () => (/* reexport safe */ _core_components_spriteComponent__WEBPACK_IMPORTED_MODULE_43__.SpriteComponent),
/* harmony export */   SpriteComponentBuilder: () => (/* reexport safe */ _core_components_spriteComponent__WEBPACK_IMPORTED_MODULE_43__.SpriteComponentBuilder),
/* harmony export */   SpriteComponentData: () => (/* reexport safe */ _core_components_spriteComponent__WEBPACK_IMPORTED_MODULE_43__.SpriteComponentData),
/* harmony export */   StatefulAnimationBehavior: () => (/* reexport safe */ _core_behaviors_statefulAnimationBehavior__WEBPACK_IMPORTED_MODULE_50__.StatefulAnimationBehavior),
/* harmony export */   StatefulAnimationBehaviorBuilder: () => (/* reexport safe */ _core_behaviors_statefulAnimationBehavior__WEBPACK_IMPORTED_MODULE_50__.StatefulAnimationBehaviorBuilder),
/* harmony export */   StatefulAnimationBehaviorData: () => (/* reexport safe */ _core_behaviors_statefulAnimationBehavior__WEBPACK_IMPORTED_MODULE_50__.StatefulAnimationBehaviorData),
/* harmony export */   Texture: () => (/* reexport safe */ _core_graphics_texture__WEBPACK_IMPORTED_MODULE_19__.Texture),
/* harmony export */   TextureManager: () => (/* reexport safe */ _core_graphics_textureManager__WEBPACK_IMPORTED_MODULE_20__.TextureManager),
/* harmony export */   TileMap: () => (/* reexport safe */ _core_graphics_tileMap__WEBPACK_IMPORTED_MODULE_26__.TileMap),
/* harmony export */   TileSet: () => (/* reexport safe */ _core_graphics_tileMap__WEBPACK_IMPORTED_MODULE_26__.TileSet),
/* harmony export */   UI: () => (/* reexport safe */ _core_ui_ui__WEBPACK_IMPORTED_MODULE_4__.UI),
/* harmony export */   Vertex: () => (/* reexport safe */ _core_graphics_vertex__WEBPACK_IMPORTED_MODULE_16__.Vertex),
/* harmony export */   Zone: () => (/* reexport safe */ _core_world_zone__WEBPACK_IMPORTED_MODULE_39__.Zone),
/* harmony export */   ZoneManager: () => (/* reexport safe */ _core_world_zoneManager__WEBPACK_IMPORTED_MODULE_40__.ZoneManager),
/* harmony export */   ZoneState: () => (/* reexport safe */ _core_world_zone__WEBPACK_IMPORTED_MODULE_39__.ZoneState),
/* harmony export */   gl: () => (/* reexport safe */ _core_gl_gl__WEBPACK_IMPORTED_MODULE_10__.gl),
/* harmony export */   glAttrInfo: () => (/* reexport safe */ _core_gl_glBuffer__WEBPACK_IMPORTED_MODULE_13__.glAttrInfo),
/* harmony export */   glBuffer: () => (/* reexport safe */ _core_gl_glBuffer__WEBPACK_IMPORTED_MODULE_13__.glBuffer),
/* harmony export */   m4x4: () => (/* reexport safe */ _core_utils_m4x4__WEBPACK_IMPORTED_MODULE_30__.m4x4),
/* harmony export */   transform: () => (/* reexport safe */ _core_utils_transform__WEBPACK_IMPORTED_MODULE_31__.transform),
/* harmony export */   vec2: () => (/* reexport safe */ _core_utils_vec2__WEBPACK_IMPORTED_MODULE_28__.vec2),
/* harmony export */   vec3: () => (/* reexport safe */ _core_utils_vec3__WEBPACK_IMPORTED_MODULE_29__.vec3)
/* harmony export */ });
/* harmony import */ var _core_game__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./core/game */ "./BdvEngine/core/game.ts");
/* harmony import */ var _core_engine__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./core/engine */ "./BdvEngine/core/engine.ts");
/* harmony import */ var _core_camera2d__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./core/camera2d */ "./BdvEngine/core/camera2d.ts");
/* harmony import */ var _core_engine3d__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./core/engine3d */ "./BdvEngine/core/engine3d.ts");
/* harmony import */ var _core_ui_ui__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./core/ui/ui */ "./BdvEngine/core/ui/ui.ts");
/* harmony import */ var _core_3d_camera__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./core/3d/camera */ "./BdvEngine/core/3d/camera.ts");
/* harmony import */ var _core_3d_mesh__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./core/3d/mesh */ "./BdvEngine/core/3d/mesh.ts");
/* harmony import */ var _core_3d_objLoader__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./core/3d/objLoader */ "./BdvEngine/core/3d/objLoader.ts");
/* harmony import */ var _core_3d_litShader__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./core/3d/litShader */ "./BdvEngine/core/3d/litShader.ts");
/* harmony import */ var _core_3d_meshComponent__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./core/3d/meshComponent */ "./BdvEngine/core/3d/meshComponent.ts");
/* harmony import */ var _core_gl_gl__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./core/gl/gl */ "./BdvEngine/core/gl/gl.ts");
/* harmony import */ var _core_gl_shader__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./core/gl/shader */ "./BdvEngine/core/gl/shader.ts");
/* harmony import */ var _core_gl_shaders_defaultShader__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./core/gl/shaders/defaultShader */ "./BdvEngine/core/gl/shaders/defaultShader.ts");
/* harmony import */ var _core_gl_glBuffer__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./core/gl/glBuffer */ "./BdvEngine/core/gl/glBuffer.ts");
/* harmony import */ var _core_gl_glStats__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./core/gl/glStats */ "./BdvEngine/core/gl/glStats.ts");
/* harmony import */ var _core_graphics_color__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./core/graphics/color */ "./BdvEngine/core/graphics/color.ts");
/* harmony import */ var _core_graphics_vertex__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./core/graphics/vertex */ "./BdvEngine/core/graphics/vertex.ts");
/* harmony import */ var _core_graphics_sprite__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./core/graphics/sprite */ "./BdvEngine/core/graphics/sprite.ts");
/* harmony import */ var _core_graphics_animatedSprite__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./core/graphics/animatedSprite */ "./BdvEngine/core/graphics/animatedSprite.ts");
/* harmony import */ var _core_graphics_texture__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./core/graphics/texture */ "./BdvEngine/core/graphics/texture.ts");
/* harmony import */ var _core_graphics_textureManager__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ./core/graphics/textureManager */ "./BdvEngine/core/graphics/textureManager.ts");
/* harmony import */ var _core_graphics_draw__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ./core/graphics/draw */ "./BdvEngine/core/graphics/draw.ts");
/* harmony import */ var _core_graphics_spriteBatcher__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! ./core/graphics/spriteBatcher */ "./BdvEngine/core/graphics/spriteBatcher.ts");
/* harmony import */ var _core_graphics_particleEmitter__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! ./core/graphics/particleEmitter */ "./BdvEngine/core/graphics/particleEmitter.ts");
/* harmony import */ var _core_graphics_animatedEntity__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! ./core/graphics/animatedEntity */ "./BdvEngine/core/graphics/animatedEntity.ts");
/* harmony import */ var _core_graphics_material__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! ./core/graphics/material */ "./BdvEngine/core/graphics/material.ts");
/* harmony import */ var _core_graphics_tileMap__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(/*! ./core/graphics/tileMap */ "./BdvEngine/core/graphics/tileMap.ts");
/* harmony import */ var _core_graphics_materialManager__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(/*! ./core/graphics/materialManager */ "./BdvEngine/core/graphics/materialManager.ts");
/* harmony import */ var _core_utils_vec2__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(/*! ./core/utils/vec2 */ "./BdvEngine/core/utils/vec2.ts");
/* harmony import */ var _core_utils_vec3__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(/*! ./core/utils/vec3 */ "./BdvEngine/core/utils/vec3.ts");
/* harmony import */ var _core_utils_m4x4__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(/*! ./core/utils/m4x4 */ "./BdvEngine/core/utils/m4x4.ts");
/* harmony import */ var _core_utils_transform__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__(/*! ./core/utils/transform */ "./BdvEngine/core/utils/transform.ts");
/* harmony import */ var _core_utils_collision__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__(/*! ./core/utils/collision */ "./BdvEngine/core/utils/collision.ts");
/* harmony import */ var _core_com_message__WEBPACK_IMPORTED_MODULE_33__ = __webpack_require__(/*! ./core/com/message */ "./BdvEngine/core/com/message.ts");
/* harmony import */ var _core_com_messageBus__WEBPACK_IMPORTED_MODULE_34__ = __webpack_require__(/*! ./core/com/messageBus */ "./BdvEngine/core/com/messageBus.ts");
/* harmony import */ var _core_input_inputManager__WEBPACK_IMPORTED_MODULE_35__ = __webpack_require__(/*! ./core/input/inputManager */ "./BdvEngine/core/input/inputManager.ts");
/* harmony import */ var _core_assets_assetManager__WEBPACK_IMPORTED_MODULE_36__ = __webpack_require__(/*! ./core/assets/assetManager */ "./BdvEngine/core/assets/assetManager.ts");
/* harmony import */ var _core_world_simObject__WEBPACK_IMPORTED_MODULE_37__ = __webpack_require__(/*! ./core/world/simObject */ "./BdvEngine/core/world/simObject.ts");
/* harmony import */ var _core_world_scene__WEBPACK_IMPORTED_MODULE_38__ = __webpack_require__(/*! ./core/world/scene */ "./BdvEngine/core/world/scene.ts");
/* harmony import */ var _core_world_zone__WEBPACK_IMPORTED_MODULE_39__ = __webpack_require__(/*! ./core/world/zone */ "./BdvEngine/core/world/zone.ts");
/* harmony import */ var _core_world_zoneManager__WEBPACK_IMPORTED_MODULE_40__ = __webpack_require__(/*! ./core/world/zoneManager */ "./BdvEngine/core/world/zoneManager.ts");
/* harmony import */ var _core_components_baseComponent__WEBPACK_IMPORTED_MODULE_41__ = __webpack_require__(/*! ./core/components/baseComponent */ "./BdvEngine/core/components/baseComponent.ts");
/* harmony import */ var _core_components_componentManager__WEBPACK_IMPORTED_MODULE_42__ = __webpack_require__(/*! ./core/components/componentManager */ "./BdvEngine/core/components/componentManager.ts");
/* harmony import */ var _core_components_spriteComponent__WEBPACK_IMPORTED_MODULE_43__ = __webpack_require__(/*! ./core/components/spriteComponent */ "./BdvEngine/core/components/spriteComponent.ts");
/* harmony import */ var _core_components_animatedSpriteComponent__WEBPACK_IMPORTED_MODULE_44__ = __webpack_require__(/*! ./core/components/animatedSpriteComponent */ "./BdvEngine/core/components/animatedSpriteComponent.ts");
/* harmony import */ var _core_components_colliderComponent__WEBPACK_IMPORTED_MODULE_45__ = __webpack_require__(/*! ./core/components/colliderComponent */ "./BdvEngine/core/components/colliderComponent.ts");
/* harmony import */ var _core_behaviors_baseBehavior__WEBPACK_IMPORTED_MODULE_46__ = __webpack_require__(/*! ./core/behaviors/baseBehavior */ "./BdvEngine/core/behaviors/baseBehavior.ts");
/* harmony import */ var _core_behaviors_behaviorManager__WEBPACK_IMPORTED_MODULE_47__ = __webpack_require__(/*! ./core/behaviors/behaviorManager */ "./BdvEngine/core/behaviors/behaviorManager.ts");
/* harmony import */ var _core_behaviors_keyboardMovementBehavior__WEBPACK_IMPORTED_MODULE_48__ = __webpack_require__(/*! ./core/behaviors/keyboardMovementBehavior */ "./BdvEngine/core/behaviors/keyboardMovementBehavior.ts");
/* harmony import */ var _core_behaviors_rotationBehavior__WEBPACK_IMPORTED_MODULE_49__ = __webpack_require__(/*! ./core/behaviors/rotationBehavior */ "./BdvEngine/core/behaviors/rotationBehavior.ts");
/* harmony import */ var _core_behaviors_statefulAnimationBehavior__WEBPACK_IMPORTED_MODULE_50__ = __webpack_require__(/*! ./core/behaviors/statefulAnimationBehavior */ "./BdvEngine/core/behaviors/statefulAnimationBehavior.ts");
/* harmony import */ var _core_behaviors_rigidBodyBehavior__WEBPACK_IMPORTED_MODULE_51__ = __webpack_require__(/*! ./core/behaviors/rigidBodyBehavior */ "./BdvEngine/core/behaviors/rigidBodyBehavior.ts");
/* harmony import */ var _core_behaviors_rayCastBehavior__WEBPACK_IMPORTED_MODULE_52__ = __webpack_require__(/*! ./core/behaviors/rayCastBehavior */ "./BdvEngine/core/behaviors/rayCastBehavior.ts");























































/***/ },

/***/ "./example/terrainGame.ts"
/*!********************************!*\
  !*** ./example/terrainGame.ts ***!
  \********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   TerrainGame: () => (/* binding */ TerrainGame)
/* harmony export */ });
/* harmony import */ var _BdvEngine__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../BdvEngine */ "./BdvEngine/index.ts");

class SeededRng {
    constructor(seed) {
        this.state = seed % 2147483647;
        if (this.state <= 0)
            this.state += 2147483646;
    }
    next() {
        this.state = (this.state * 16807) % 2147483647;
        return (this.state - 1) / 2147483646;
    }
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
}
class Noise {
    constructor(seed) {
        this.perm = [];
        for (let i = 0; i < 256; i++)
            this.perm[i] = i;
        let rng = new SeededRng(seed);
        for (let i = 255; i > 0; i--) {
            let j = rng.nextInt(0, i);
            [this.perm[i], this.perm[j]] = [this.perm[j], this.perm[i]];
        }
        for (let i = 0; i < 256; i++)
            this.perm[256 + i] = this.perm[i];
    }
    hash(x, y) { return this.perm[(this.perm[x & 255] + y) & 511]; }
    lerp(a, b, t) { return a + t * (b - a); }
    smooth(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    get(x, y) {
        let xi = Math.floor(x), yi = Math.floor(y);
        let xf = x - xi, yf = y - yi;
        let sx = this.smooth(xf), sy = this.smooth(yf);
        let a = this.hash(xi, yi) / 255, b = this.hash(xi + 1, yi) / 255;
        let c = this.hash(xi, yi + 1) / 255, d = this.hash(xi + 1, yi + 1) / 255;
        return this.lerp(this.lerp(a, b, sx), this.lerp(c, d, sx), sy);
    }
    fbm(x, y, octaves = 4) {
        let val = 0, amp = 0.5, freq = 1, max = 0;
        for (let i = 0; i < octaves; i++) {
            val += this.get(x * freq, y * freq) * amp;
            max += amp;
            amp *= 0.5;
            freq *= 2;
        }
        return val / max;
    }
}
const GRASS_START = 0;
const GRASS_COUNT = 9;
const SAND_1 = 9;
const SAND_2 = 10;
const BEACH = 11;
const WATER = 12;
const MT_START = 13;
const MT_COUNT = 16;
const SNOW_START = 29;
const SNOW_COUNT = 4;
const CHAOS_GND_START = 33;
const CHAOS_GND_COUNT = 7;
const FOREST_TREE_1 = 48;
const FOREST_TREE_2 = 49;
const MAGIC_TREE_1 = 50;
const MAGIC_TREE_2 = 51;
const CHAOS_TREE = 52;
const SNOW_TREE_1 = 53;
const SNOW_TREE_2 = 54;
const SNOW_TREE_3 = 55;
const BUSH_START = 64;
const BUSH_COUNT = 16;
var Biome;
(function (Biome) {
    Biome[Biome["OCEAN"] = 0] = "OCEAN";
    Biome[Biome["BEACH_B"] = 1] = "BEACH_B";
    Biome[Biome["DESERT"] = 2] = "DESERT";
    Biome[Biome["GRASSLAND"] = 3] = "GRASSLAND";
    Biome[Biome["FOREST"] = 4] = "FOREST";
    Biome[Biome["MOUNTAIN"] = 5] = "MOUNTAIN";
    Biome[Biome["SNOW"] = 6] = "SNOW";
    Biome[Biome["CHAOS"] = 7] = "CHAOS";
    Biome[Biome["ENCHANTED"] = 8] = "ENCHANTED";
})(Biome || (Biome = {}));
const BIOME_NAMES = ["Ocean", "Beach", "Desert", "Grassland", "Forest", "Mountain", "Snow", "Chaos", "Enchanted"];
function tileName(idx) {
    if (idx >= GRASS_START && idx < GRASS_START + GRASS_COUNT)
        return "Grass";
    if (idx === SAND_1)
        return "Sand";
    if (idx === SAND_2)
        return "Road";
    if (idx === BEACH)
        return "Beach";
    if (idx === WATER)
        return "Water";
    if (idx >= MT_START && idx < MT_START + MT_COUNT)
        return "Mountain";
    if (idx >= SNOW_START && idx < SNOW_START + SNOW_COUNT)
        return "Snow";
    if (idx >= CHAOS_GND_START && idx < CHAOS_GND_START + CHAOS_GND_COUNT)
        return "Chaos";
    if (idx >= 40 && idx <= 47)
        return "Tree";
    if (idx >= BUSH_START && idx < BUSH_START + BUSH_COUNT)
        return "Bush";
    return `Tile ${idx}`;
}
const MAP_SIZE = 1024;
const TILE_RENDER_SIZE = 96;
const NOISE_SCALE = 0.006;
const BLD_HOUSES_START = 0;
const BLD_SHOPS_START = 8;
const BLD_TOWERS_START = 16;
const BLD_CASTLES_START = 24;
const ROAD_TILE = SAND_2;
class WanderBehaviorData {
    constructor() {
        this.name = "wander";
        this.speed = 0.03;
        this.range = 300;
    }
    setFromJson(json) {
        if (json.name)
            this.name = json.name;
        if (json.speed)
            this.speed = json.speed;
        if (json.range)
            this.range = json.range;
    }
}
class WanderBehavior extends _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.BaseBehavior {
    constructor(data) {
        super(data);
        this.targetX = 0;
        this.targetY = 0;
        this.hasTarget = false;
        this.animBehavior = null;
        this.speed = data.speed;
        this.range = data.range;
    }
    update(time) {
        if (!this._owner)
            return;
        if (!this.animBehavior) {
            let b = this._owner.getBehavior("animState");
            if (b && b instanceof _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.StatefulAnimationBehavior) {
                this.animBehavior = b;
            }
        }
        let pos = this._owner.transform.position;
        if (!this.hasTarget) {
            this.targetX = pos.vx + (Math.random() - 0.5) * this.range * 2;
            this.targetY = pos.vy + (Math.random() - 0.5) * this.range * 2;
            this.hasTarget = true;
        }
        let dx = this.targetX - pos.vx;
        let dy = this.targetY - pos.vy;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 5) {
            this.hasTarget = false;
        }
        else {
            let move = this.speed * time;
            pos.vx += (dx / dist) * move;
            pos.vy += (dy / dist) * move;
            if (this.animBehavior) {
                this.animBehavior.setState(dx > 0 ? "walk_right" : "walk_left");
            }
        }
    }
}
class TerrainGame extends _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Game {
    constructor() {
        super(...arguments);
        this.buildings = [];
        this.occupiedTiles = new Set();
        this.buildingTiles = new Set();
        this.camSpeed = 0.6;
        this.seed = 54321;
        this.hoverTileX = -1;
        this.hoverTileY = -1;
        this.selectedTileX = -1;
        this.selectedTileY = -1;
    }
    init() {
        this.tileSet = new _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.TileSet({
            imagePath: "assets/textures/terrain.png",
            tileWidth: 96, tileHeight: 96,
            materialName: "terrain_tiles",
        });
        let lod = new _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.TileSet({
            imagePath: "assets/textures/terrain_lod.png",
            tileWidth: 16, tileHeight: 16,
            materialName: "terrain_lod",
        });
        this.tileMap = new _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.TileMap(this.tileSet, MAP_SIZE, MAP_SIZE, TILE_RENDER_SIZE);
        this.tileMap.lodTileSet = lod;
        this.overlayMap = new _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.TileMap(this.tileSet, MAP_SIZE, MAP_SIZE, TILE_RENDER_SIZE);
        this.overlayMap.heightScale = 0;
        this.overlayMap.shadowStrength = 0;
        _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.MaterialManager.register(new _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Material("human_mat", "assets/textures/human_walking.png", _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Color.white()));
        _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.MaterialManager.register(new _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Material("buildings_mat", "assets/textures/buildings_tileset.png", _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Color.white()));
        this.heightMap = new Float32Array(MAP_SIZE * MAP_SIZE);
        this.biomeMap = new Uint8Array(MAP_SIZE * MAP_SIZE);
        this.generateWorld(this.seed);
        let panel = _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.UI.panel(10, 40, {
            width: "280px", padding: "10px",
            background: "rgba(0,0,0,0.7)", borderRadius: "6px",
        });
        _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.UI.heading(panel, "Bdv World", { color: "#4af" });
        _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.UI.text(panel, `${MAP_SIZE}×${MAP_SIZE} — WASD + scroll`);
        _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.UI.spacer(panel);
        let seedRow = _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.UI.row(panel);
        _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.UI.text(seedRow, "Seed:", { marginRight: "4px" });
        let seedInput = _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.UI.input(seedRow, "", () => { }, { width: "80px" });
        seedInput.value = String(this.seed);
        _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.UI.button(seedRow, "Go", () => {
            let v = parseInt(seedInput.value);
            if (!isNaN(v) && v > 0) {
                this.seed = v;
                this.generateWorld(v);
            }
        });
        _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.UI.button(panel, "Random", () => {
            this.seed = Math.floor(Math.random() * 999999) + 1;
            seedInput.value = String(this.seed);
            this.generateWorld(this.seed);
        });
        _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.UI.spacer(panel);
        this.coordsText = _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.UI.text(panel, "", { fontSize: "12px", fontFamily: "monospace" });
        this.tileInfoText = _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.UI.text(panel, "", { fontSize: "12px", fontFamily: "monospace" });
        _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Message.subscribe("MOUSE_DOWN", this);
    }
    onMessage(msg) {
        if (msg.code === "MOUSE_DOWN" && this.hoverTileX >= 0) {
            this.selectedTileX = this.hoverTileX;
            this.selectedTileY = this.hoverTileY;
        }
    }
    generateWorld(seed) {
        let noise = new Noise(seed);
        let rng = new SeededRng(seed);
        this.overlayMap.fill(-1);
        for (let y = 0; y < MAP_SIZE; y++) {
            for (let x = 0; x < MAP_SIZE; x++) {
                let dx = (x / MAP_SIZE - 0.5) * 2;
                let dy = (y / MAP_SIZE - 0.5) * 2;
                let island = 1 - Math.min(1, (dx * dx + dy * dy) * 0.8);
                let h = noise.fbm(x * NOISE_SCALE, y * NOISE_SCALE, 6) * island;
                h = h * 0.85 + 0.15;
                let lat = Math.abs(dy);
                if (lat > 0.7 && h > 0.30) {
                    let sb = Math.pow(((lat - 0.7) / 0.3), 2);
                    h += sb * (1.0 - h) * 0.8;
                }
                this.heightMap[y * MAP_SIZE + x] = h;
            }
        }
        let landTiles = [];
        for (let y = 30; y < MAP_SIZE - 30; y += 3) {
            for (let x = 30; x < MAP_SIZE - 30; x += 3) {
                let h = this.heightMap[y * MAP_SIZE + x];
                if (h > 0.42 && h < 0.78)
                    landTiles.push([x, y]);
            }
        }
        for (let i = landTiles.length - 1; i > 0; i--) {
            let j = rng.nextInt(0, i);
            [landTiles[i], landTiles[j]] = [landTiles[j], landTiles[i]];
        }
        let chaosCx = landTiles.length > 0 ? landTiles[0][0] : MAP_SIZE / 3;
        let chaosCy = landTiles.length > 0 ? landTiles[0][1] : MAP_SIZE / 3;
        let chaosR = rng.nextInt(25, 45);
        let enchCx = MAP_SIZE / 2, enchCy = MAP_SIZE / 2;
        let bestDist = 0;
        for (let [lx, ly] of landTiles) {
            let d = Math.sqrt(Math.pow((lx - chaosCx), 2) + Math.pow((ly - chaosCy), 2));
            if (d > bestDist) {
                bestDist = d;
                enchCx = lx;
                enchCy = ly;
            }
        }
        let enchR = rng.nextInt(20, 35);
        let varNoise = new Noise(seed + 500);
        function grassTile(x, y) {
            return GRASS_START;
        }
        function snowTile(x, y) {
            let v = varNoise.get(x * 0.3 + 100, y * 0.3 + 100);
            return SNOW_START + Math.floor(v * SNOW_COUNT) % SNOW_COUNT;
        }
        function chaosTile(x, y) {
            let v = varNoise.get(x * 0.3 + 200, y * 0.3 + 200);
            return CHAOS_GND_START + Math.floor(v * CHAOS_GND_COUNT) % CHAOS_GND_COUNT;
        }
        function sandTile(x, y) {
            let v = varNoise.get(x * 0.5 + 300, y * 0.5 + 300);
            return v > 0.5 ? SAND_1 : SAND_2;
        }
        for (let y = 0; y < MAP_SIZE; y++) {
            for (let x = 0; x < MAP_SIZE; x++) {
                let h = this.heightMap[y * MAP_SIZE + x];
                let lat = Math.abs((y / MAP_SIZE - 0.5) * 2);
                let chD = Math.sqrt(Math.pow((x - chaosCx), 2) + Math.pow((y - chaosCy), 2));
                let eD = Math.sqrt(Math.pow((x - enchCx), 2) + Math.pow((y - enchCy), 2));
                let biome;
                let tile;
                if (h < 0.38) {
                    biome = 0;
                    tile = WATER;
                }
                else if (chD < chaosR && h > 0.38) {
                    biome = 7;
                    tile = chaosTile(x, y);
                }
                else if (eD < enchR && h > 0.38) {
                    biome = 8;
                    tile = grassTile(x, y);
                }
                else if (h > 0.85 || (lat > 0.78 && h > 0.35)) {
                    biome = 6;
                    tile = snowTile(x, y);
                }
                else if (h > 0.65) {
                    biome = 5;
                    tile = grassTile(x, y);
                }
                else if (h > 0.55) {
                    biome = 4;
                    tile = grassTile(x, y);
                }
                else {
                    biome = 3;
                    tile = grassTile(x, y);
                }
                this.biomeMap[y * MAP_SIZE + x] = biome;
                this.tileMap.setTile(x, y, tile);
                this.tileMap.setHeight(x, y, h);
            }
        }
        let riverCount = rng.nextInt(6, 12);
        for (let ri = 0; ri < riverCount; ri++) {
            let sx = 0, sy = 0, found = false;
            for (let attempt = 0; attempt < 300; attempt++) {
                sx = rng.nextInt(20, MAP_SIZE - 20);
                sy = rng.nextInt(20, MAP_SIZE - 20);
                let h = this.heightMap[sy * MAP_SIZE + sx];
                if (h > 0.65 && h < 0.85) {
                    found = true;
                    break;
                }
            }
            if (!found)
                continue;
            let rx = sx, ry = sy;
            let maxSteps = MAP_SIZE * 2;
            for (let step = 0; step < maxSteps; step++) {
                let h = this.heightMap[ry * MAP_SIZE + rx];
                if (h < 0.35)
                    break;
                this.tileMap.setTile(rx, ry, WATER);
                this.biomeMap[ry * MAP_SIZE + rx] = 0;
                let bestH = h;
                let bestX = rx, bestY = ry;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0)
                            continue;
                        let nx = rx + dx, ny = ry + dy;
                        if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE)
                            continue;
                        let nh = this.heightMap[ny * MAP_SIZE + nx];
                        if (nh < bestH) {
                            bestH = nh;
                            bestX = nx;
                            bestY = ny;
                        }
                    }
                }
                if (bestX === rx && bestY === ry) {
                    rx += rng.nextInt(-1, 1);
                    ry += rng.nextInt(-1, 1);
                    rx = Math.max(1, Math.min(MAP_SIZE - 2, rx));
                    ry = Math.max(1, Math.min(MAP_SIZE - 2, ry));
                }
                else {
                    rx = bestX;
                    ry = bestY;
                }
            }
        }
        for (let y = 0; y < MAP_SIZE; y++) {
            for (let x = 0; x < MAP_SIZE; x++) {
                let b = this.biomeMap[y * MAP_SIZE + x];
                let r = rng.next();
                if (b === 4) {
                    if (r < 0.15)
                        this.overlayMap.setTile(x, y, rng.next() > 0.5 ? FOREST_TREE_1 : FOREST_TREE_2);
                    else if (r < 0.18)
                        this.overlayMap.setTile(x, y, BUSH_START + rng.nextInt(0, 7));
                }
                else if (b === 8) {
                    if (r < 0.20)
                        this.overlayMap.setTile(x, y, rng.next() > 0.5 ? MAGIC_TREE_1 : MAGIC_TREE_2);
                    else if (r < 0.25)
                        this.overlayMap.setTile(x, y, BUSH_START + rng.nextInt(8, 15));
                }
                else if (b === 7) {
                    if (r < 0.12)
                        this.overlayMap.setTile(x, y, CHAOS_TREE);
                    else if (r < 0.16)
                        this.overlayMap.setTile(x, y, BUSH_START + rng.nextInt(0, BUSH_COUNT - 1));
                }
                else if (b === 6) {
                    if (r < 0.06)
                        this.overlayMap.setTile(x, y, SNOW_TREE_1 + rng.nextInt(0, 2));
                    else if (r < 0.08)
                        this.overlayMap.setTile(x, y, BUSH_START + rng.nextInt(0, BUSH_COUNT - 1));
                }
                else if (b === 5) {
                    if (r < 0.10)
                        this.overlayMap.setTile(x, y, MT_START + rng.nextInt(0, MT_COUNT - 1));
                    else if (r < 0.13)
                        this.overlayMap.setTile(x, y, BUSH_START + rng.nextInt(0, BUSH_COUNT - 1));
                }
                else if (b === 3) {
                    if (r < 0.02)
                        this.overlayMap.setTile(x, y, rng.next() > 0.5 ? FOREST_TREE_1 : FOREST_TREE_2);
                    else if (r < 0.03)
                        this.overlayMap.setTile(x, y, BUSH_START + rng.nextInt(0, 7));
                }
            }
        }
        this.buildings = [];
        this.occupiedTiles.clear();
        this.buildingTiles.clear();
        let cities = [];
        let cityCount = rng.nextInt(15, 30);
        let cityMinDist = 60;
        for (let attempt = 0; attempt < cityCount * 50 && cities.length < cityCount; attempt++) {
            let cx = rng.nextInt(30, MAP_SIZE - 30);
            let cy = rng.nextInt(30, MAP_SIZE - 30);
            let b = this.biomeMap[cy * MAP_SIZE + cx];
            if (b !== 3 && b !== 4)
                continue;
            let tooClose = false;
            for (let c of cities) {
                if (Math.sqrt(Math.pow((c.x - cx), 2) + Math.pow((c.y - cy), 2)) < cityMinDist) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose)
                continue;
            let size = rng.nextInt(3, 7);
            cities.push({ x: cx, y: cy, size });
            let BLDG_FOOTPRINT = 5;
            let placeBuilding = (bx, by, col, row) => {
                if (bx < 1 || by < 1 || bx + BLDG_FOOTPRINT >= MAP_SIZE || by + BLDG_FOOTPRINT >= MAP_SIZE)
                    return false;
                for (let ddy = 0; ddy < BLDG_FOOTPRINT; ddy++)
                    for (let ddx = 0; ddx < BLDG_FOOTPRINT; ddx++) {
                        let tx = bx + ddx, ty = by + ddy;
                        if (this.occupiedTiles.has(ty * MAP_SIZE + tx))
                            return false;
                        let tb = this.biomeMap[ty * MAP_SIZE + tx];
                        if (tb === 0 || tb === 1)
                            return false;
                    }
                this.buildings.push({ tileX: bx, tileY: by, spriteCol: col, spriteRow: row });
                for (let ddy = 0; ddy < BLDG_FOOTPRINT; ddy++)
                    for (let ddx = 0; ddx < BLDG_FOOTPRINT; ddx++)
                        this.buildingTiles.add((by + ddy) * MAP_SIZE + (bx + ddx));
                for (let ddy = -1; ddy <= BLDG_FOOTPRINT; ddy++)
                    for (let ddx = -1; ddx <= BLDG_FOOTPRINT; ddx++) {
                        let tx = bx + ddx, ty = by + ddy;
                        if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE)
                            continue;
                        this.occupiedTiles.add(ty * MAP_SIZE + tx);
                        this.overlayMap.setTile(tx, ty, -1);
                    }
                return true;
            };
            placeBuilding(cx, cy, rng.nextInt(0, 7), 3);
            let buildCount = rng.nextInt(4, size * 3);
            for (let bi = 0; bi < buildCount; bi++) {
                let dx = rng.nextInt(-size, size);
                let dy = rng.nextInt(-size, size);
                let bx = cx + Math.round(dx / 6) * 6;
                let by = cy + Math.round(dy / 6) * 6;
                if (bx < 2 || bx >= MAP_SIZE - 2 || by < 2 || by >= MAP_SIZE - 2)
                    continue;
                let dist = Math.sqrt(dx * dx + dy * dy);
                let row;
                if (dist < size * 0.4) {
                    row = rng.nextInt(1, 2);
                }
                else {
                    row = 0;
                }
                placeBuilding(bx, by, rng.nextInt(0, 7), row);
            }
        }
        for (let i = 0; i < cities.length; i++) {
            let distances = [];
            for (let j = 0; j < cities.length; j++) {
                if (i === j)
                    continue;
                let dx = cities[i].x - cities[j].x;
                let dy = cities[i].y - cities[j].y;
                distances.push({ idx: j, dist: Math.sqrt(dx * dx + dy * dy) });
            }
            distances.sort((a, b) => a.dist - b.dist);
            if (rng.next() < 0.3)
                continue;
            let connections = rng.nextInt(1, 2);
            for (let c = 0; c < Math.min(connections, distances.length); c++) {
                if (rng.next() < 0.3)
                    continue;
                let target = cities[distances[c].idx];
                let horizontalFirst = rng.next() > 0.5;
                let x = cities[i].x, y = cities[i].y;
                let tx = target.x, ty = target.y;
                if (horizontalFirst) {
                    let sx = x < tx ? 1 : -1;
                    while (x !== tx) {
                        if (this.biomeMap[y * MAP_SIZE + x] !== 0 && !this.occupiedTiles.has(y * MAP_SIZE + x)) {
                            this.overlayMap.setTile(x, y, ROAD_TILE);
                        }
                        x += sx;
                    }
                    let sy = y < ty ? 1 : -1;
                    while (y !== ty) {
                        if (this.biomeMap[y * MAP_SIZE + x] !== 0 && !this.occupiedTiles.has(y * MAP_SIZE + x)) {
                            this.overlayMap.setTile(x, y, ROAD_TILE);
                        }
                        y += sy;
                    }
                }
                else {
                    let sy = y < ty ? 1 : -1;
                    while (y !== ty) {
                        if (this.biomeMap[y * MAP_SIZE + x] !== 0 && !this.occupiedTiles.has(y * MAP_SIZE + x)) {
                            this.overlayMap.setTile(x, y, ROAD_TILE);
                        }
                        y += sy;
                    }
                    let sx = x < tx ? 1 : -1;
                    while (x !== tx) {
                        if (this.biomeMap[y * MAP_SIZE + x] !== 0 && !this.occupiedTiles.has(y * MAP_SIZE + x)) {
                            this.overlayMap.setTile(x, y, ROAD_TILE);
                        }
                        x += sx;
                    }
                }
            }
        }
        this.humanScene = new _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Scene();
        let humanId = 0;
        for (let city of cities) {
            let humanCount = rng.nextInt(3, 8);
            for (let i = 0; i < humanCount; i++) {
                let hx = (city.x + rng.nextInt(-city.size, city.size)) * TILE_RENDER_SIZE;
                let hy = (city.y + rng.nextInt(-city.size, city.size)) * TILE_RENDER_SIZE;
                let human = new _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.SimObject(humanId++, `human_${humanId}`);
                human.transform.position.vx = hx;
                human.transform.position.vy = hy;
                let spriteScale = TILE_RENDER_SIZE / 108;
                human.transform.scale.vx = spriteScale;
                human.transform.scale.vy = spriteScale;
                let spriteData = new _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.AnimatedSpriteComponentData();
                spriteData.name = "humanSprite";
                spriteData.materialName = "human_mat";
                spriteData.frameWidth = 108;
                spriteData.frameHeight = 112;
                spriteData.frameCount = 16;
                spriteData.frameSequence = [0];
                human.addComponent(new _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.AnimatedSpriteComponent(spriteData));
                let animData = new _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.StatefulAnimationBehaviorData();
                animData.name = "animState";
                animData.componentName = "humanSprite";
                animData.frameTime = 120;
                animData.states = {
                    "idle": [0],
                    "walk_right": [1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2],
                    "walk_left": [8, 9, 10, 11, 12, 13, 14, 13, 12, 11, 10, 9],
                };
                animData.defaultState = "idle";
                human.addBehavior(new _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.StatefulAnimationBehavior(animData));
                let wanderData = new WanderBehaviorData();
                wanderData.speed = 0.02 + rng.next() * 0.03;
                wanderData.range = 200 + rng.nextInt(0, 200);
                human.addBehavior(new WanderBehavior(wanderData));
                this.humanScene.addObject(human);
            }
        }
        this.humanScene.load();
        this.camera.x = MAP_SIZE * TILE_RENDER_SIZE / 2;
        this.camera.y = MAP_SIZE * TILE_RENDER_SIZE / 2;
    }
    update(deltaTime) {
        let speed = this.camSpeed * deltaTime / this.camera.zoom;
        if (_BdvEngine__WEBPACK_IMPORTED_MODULE_0__.InputManager.isKeyDown(_BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Keys.W) || _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.InputManager.isKeyDown(_BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Keys.UP))
            this.camera.y -= speed;
        if (_BdvEngine__WEBPACK_IMPORTED_MODULE_0__.InputManager.isKeyDown(_BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Keys.S) || _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.InputManager.isKeyDown(_BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Keys.DOWN))
            this.camera.y += speed;
        if (_BdvEngine__WEBPACK_IMPORTED_MODULE_0__.InputManager.isKeyDown(_BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Keys.A) || _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.InputManager.isKeyDown(_BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Keys.LEFT))
            this.camera.x -= speed;
        if (_BdvEngine__WEBPACK_IMPORTED_MODULE_0__.InputManager.isKeyDown(_BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Keys.D) || _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.InputManager.isKeyDown(_BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Keys.RIGHT))
            this.camera.x += speed;
        let wheel = _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.InputManager.consumeWheelDelta();
        if (wheel !== 0)
            this.camera.zoom = Math.max(0.005, Math.min(12, this.camera.zoom * (wheel > 0 ? 0.85 : 1.15)));
        this.humanScene.update(deltaTime);
        let ws = MAP_SIZE * TILE_RENDER_SIZE;
        this.camera.x = Math.max(0, Math.min(ws, this.camera.x));
        this.camera.y = Math.max(0, Math.min(ws, this.camera.y));
        let mouse = _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.InputManager.getMousePosition();
        let sw = window.innerWidth, sh = window.innerHeight;
        let worldPos = this.camera.screenToWorld(mouse.vx, mouse.vy, sw, sh);
        this.hoverTileX = Math.floor(worldPos.x / TILE_RENDER_SIZE);
        this.hoverTileY = Math.floor(worldPos.y / TILE_RENDER_SIZE);
        if (this.hoverTileX < 0 || this.hoverTileX >= MAP_SIZE || this.hoverTileY < 0 || this.hoverTileY >= MAP_SIZE) {
            this.hoverTileX = -1;
            this.hoverTileY = -1;
        }
        _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.UI.setText(this.coordsText, `Zoom: ${this.camera.zoom.toFixed(2)}x | Seed: ${this.seed}`);
        if (this.hoverTileX >= 0) {
            let ti = this.tileMap.getTile(this.hoverTileX, this.hoverTileY);
            let oi = this.overlayMap.getTile(this.hoverTileX, this.hoverTileY);
            let b = this.biomeMap[this.hoverTileY * MAP_SIZE + this.hoverTileX];
            let ol = oi >= 0 ? ` + ${tileName(oi)}` : "";
            let hasBuilding = this.buildingTiles.has(this.hoverTileY * MAP_SIZE + this.hoverTileX);
            let bldInfo = hasBuilding ? " [Building]" : "";
            _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.UI.setText(this.tileInfoText, `${this.hoverTileX},${this.hoverTileY} | ${BIOME_NAMES[b]} | ${tileName(ti)}${ol}${bldInfo}`);
        }
        else {
            _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.UI.setText(this.tileInfoText, "");
        }
    }
    render(shader) {
        let sw = window.innerWidth, sh = window.innerHeight;
        this.tileMap.render(this.camera, sw, sh);
        this.overlayMap.render(this.camera, sw, sh);
        let bldMat = _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.MaterialManager.get("buildings_mat");
        if (bldMat && bldMat.diffTexture && bldMat.diffTexture.textureIsLoaded) {
            let ts = TILE_RENDER_SIZE;
            let bSize = ts * 3;
            for (let b of this.buildings) {
                let wx = b.tileX * ts;
                let wy = b.tileY * ts;
                _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.SpriteBatcher.drawTexture(bldMat, b.spriteCol, b.spriteRow, 8, 4, wx, wy, bSize, bSize);
            }
        }
        this.humanScene.render(shader);
        let ts = TILE_RENDER_SIZE;
        if (this.selectedTileX >= 0) {
            let wx = this.selectedTileX * ts;
            let wy = this.selectedTileY * ts;
            _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Draw.rectOutline(wx, wy, ts, ts, new _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Color(255, 255, 0, 255));
        }
        if (this.hoverTileX >= 0) {
            let wx = this.hoverTileX * ts;
            let wy = this.hoverTileY * ts;
            _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Draw.rect(wx, wy, ts, 2, _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Color.white());
            _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Draw.rect(wx, wy + ts - 2, ts, 2, _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Color.white());
            _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Draw.rect(wx, wy, 2, ts, _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Color.white());
            _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Draw.rect(wx + ts - 2, wy, 2, ts, _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Color.white());
        }
    }
}


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*******************************!*\
  !*** ./example/appTerrain.ts ***!
  \*******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _BdvEngine__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../BdvEngine */ "./BdvEngine/index.ts");
/* harmony import */ var _terrainGame__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./terrainGame */ "./example/terrainGame.ts");


let engine;
window.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.id = "mainFrame";
    document.body.appendChild(canvas);
    engine = new _BdvEngine__WEBPACK_IMPORTED_MODULE_0__.Engine(canvas, new _terrainGame__WEBPACK_IMPORTED_MODULE_1__.TerrainGame(), {
        targetFps: 60,
        showStats: true,
    });
    engine.start();
};
window.onresize = () => {
    engine.resize();
};

})();

/******/ })()
;
//# sourceMappingURL=main.js.map