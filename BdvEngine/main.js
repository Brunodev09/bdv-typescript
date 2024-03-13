let engine;
window.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.id = "mainFrame";
    document.body.appendChild(canvas);
    engine = new BdvEngine.Engine(canvas);
    engine.start();
};
window.onresize = () => {
    engine.resize();
};
var BdvEngine;
(function (BdvEngine) {
    class Engine {
        constructor(canvas) {
            this.canvas = canvas;
        }
        start() {
            BdvEngine.GLUTools.init(this.canvas);
            BdvEngine.AssetManager.init();
            BdvEngine.gl.clearColor(0, 0, 0, 1);
            this.loadShaders();
            this.shader.use();
            this.projectionMatrix = BdvEngine.m4x4.ortho(0, this.canvas.width, 0, this.canvas.height, -100.0, 100.0);
            this.sprite = new BdvEngine.Sprite("block", "assets/block.png");
            this.sprite.load();
            this.sprite.position.vx = 200;
            this.resize();
            this.loop();
        }
        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            BdvEngine.gl.viewport(-1, 1, -1, 1);
        }
        loop() {
            BdvEngine.MessageBus.update(0);
            BdvEngine.gl.clear(BdvEngine.gl.COLOR_BUFFER_BIT);
            let colorPosition = this.shader.getUniformLocation("u_color");
            BdvEngine.gl.uniform4f(colorPosition, 1, 1, 1, 1);
            let projectionPosition = this.shader.getUniformLocation("u_proj");
            BdvEngine.gl.uniformMatrix4fv(projectionPosition, false, new Float32Array(this.projectionMatrix.mData));
            let transformLocation = this.shader.getUniformLocation("u_transf");
            BdvEngine.gl.uniformMatrix4fv(transformLocation, false, new Float32Array(BdvEngine.m4x4.translation(this.sprite.position).mData));
            this.sprite.render(this.shader);
            requestAnimationFrame(this.loop.bind(this));
        }
        loadShaders() {
            let vertexSource = `
                attribute vec3 a_pos;
                attribute vec2 a_textCoord;

                uniform mat4 u_proj;
                uniform mat4 u_transf;

                varying vec2 v_textCoord;

                void main() {
                    gl_Position = u_proj * u_transf * vec4(a_pos, 1.0);
                    v_textCoord = a_textCoord;
                }
            `;
            let fragmentSource = `
                precision mediump float;
                uniform vec4 u_color;
                uniform sampler2D u_diffuse;

                varying vec2 v_textCoord;

                void main() {
                    gl_FragColor = u_color * texture2D(u_diffuse, v_textCoord);
                }
            `;
            this.shader = new BdvEngine.Shader("primitiveShader", vertexSource, fragmentSource);
        }
    }
    BdvEngine.Engine = Engine;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    BdvEngine.MESSAGE_ASSET_LOADER_LOADED = "MESSAGE_ASSET_LOADER_LOADED";
    class AssetManager {
        constructor() { }
        static init() {
            AssetManager.loaders.push(new BdvEngine.ImageLoader());
        }
        static register(loader) {
            AssetManager.loaders.push(loader);
        }
        static onLoaded(asset) {
            AssetManager.assetsPool[asset.name] = asset;
            BdvEngine.Message.send(`${BdvEngine.MESSAGE_ASSET_LOADER_LOADED}::${asset.name}`, this, asset);
        }
        static loadAsset(assetName) {
            let ext = assetName.split(".").pop().toLowerCase();
            for (let loader of AssetManager.loaders) {
                if (loader.fileExt.indexOf(ext) !== -1) {
                    loader.loadAsset(assetName);
                    return;
                }
            }
            console.log(`AssetManager::Unable to load asset with the defined extesion ${ext}.`);
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
    BdvEngine.AssetManager = AssetManager;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
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
    BdvEngine.ImageAsset = ImageAsset;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class ImageLoader {
        get fileExt() {
            return ["png", "gif", "jpg"];
        }
        loadAsset(assetName) {
            let img = new Image();
            img.onload = this.onLoaded.bind(this, assetName, img);
            img.src = assetName;
        }
        onLoaded(assetName, image) {
            console.log(`ImageLoader::onLoaded: assetName/image ${assetName}/${image}`);
            let asset = new BdvEngine.ImageAsset(assetName, image);
            BdvEngine.AssetManager.onLoaded(asset);
        }
    }
    BdvEngine.ImageLoader = ImageLoader;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    let MessagePriority;
    (function (MessagePriority) {
        MessagePriority[MessagePriority["DEFAULT"] = 0] = "DEFAULT";
        MessagePriority[MessagePriority["CRITICAL"] = 1] = "CRITICAL";
    })(MessagePriority = BdvEngine.MessagePriority || (BdvEngine.MessagePriority = {}));
    class Message {
        constructor(code, sender, context, priority = MessagePriority.DEFAULT) {
            this.code = code;
            this.sender = sender;
            this.context = context;
            this.priority = priority;
        }
        static send(code, sender, context) {
            BdvEngine.MessageBus.emit(new Message(code, sender, context, MessagePriority.DEFAULT));
        }
        static sendCritical(code, sender, context) {
            BdvEngine.MessageBus.emit(new Message(code, sender, context, MessagePriority.CRITICAL));
        }
        static subscribe(code, handler) {
            BdvEngine.MessageBus.subscribe(code, handler);
        }
        static unsubscribe(code, handler) {
            BdvEngine.MessageBus.unsubscribe(code, handler);
        }
    }
    BdvEngine.Message = Message;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
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
                if (message.priority === BdvEngine.MessagePriority.CRITICAL) {
                    handler.onMessage(message);
                }
                else {
                    MessageBus.messageQueue.push(new BdvEngine.SubscriptionNode(message, handler));
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
    BdvEngine.MessageBus = MessageBus;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class SubscriptionNode {
        constructor(message, handler) {
            this.message = message;
            this.handler = handler;
        }
    }
    BdvEngine.SubscriptionNode = SubscriptionNode;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class GLUTools {
        static init(canvas) {
            BdvEngine.gl = canvas.getContext("webgl");
            if (!BdvEngine.gl)
                throw new Error(`Unable to initialize WebGL.`);
        }
    }
    BdvEngine.GLUTools = GLUTools;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class glAttrInfo {
    }
    BdvEngine.glAttrInfo = glAttrInfo;
    class glBuffer {
        constructor(elementSize, dataType = BdvEngine.gl.FLOAT, targetBufferType = BdvEngine.gl.ARRAY_BUFFER, mode = BdvEngine.gl.TRIANGLES) {
            this.hasAttrLocation = false;
            this.data = [];
            this.attrInfo = [];
            this.elementSize = elementSize;
            this.type = dataType;
            this.targetBufferType = targetBufferType;
            this.mode = mode;
            switch (this.type) {
                case BdvEngine.gl.UNSIGNED_INT:
                case BdvEngine.gl.INT:
                case BdvEngine.gl.FLOAT: {
                    this.typeSize = 4;
                    break;
                }
                case BdvEngine.gl.UNSIGNED_SHORT:
                case BdvEngine.gl.SHORT: {
                    this.typeSize = 2;
                    break;
                }
                case BdvEngine.gl.UNSIGNED_BYTE:
                case BdvEngine.gl.BYTE: {
                    this.typeSize = 1;
                    break;
                }
                default: {
                    throw new Error(`Unable to determine byte size for type ${this.type}.`);
                }
            }
            this.stride = this.elementSize * this.typeSize;
            this.buffer = BdvEngine.gl.createBuffer();
        }
        destroy() {
            BdvEngine.gl.deleteBuffer(this.buffer);
        }
        bind(normalized = false) {
            BdvEngine.gl.bindBuffer(this.targetBufferType, this.buffer);
            if (this.hasAttrLocation) {
                for (let attr of this.attrInfo) {
                    BdvEngine.gl.vertexAttribPointer(attr.location, attr.size, this.type, normalized, this.stride, attr.offset * this.typeSize);
                    BdvEngine.gl.enableVertexAttribArray(attr.location);
                }
            }
        }
        unbind() {
            for (let attr of this.attrInfo) {
                BdvEngine.gl.disableVertexAttribArray(attr.location);
            }
            BdvEngine.gl.bindBuffer(BdvEngine.gl.ARRAY_BUFFER, this.buffer);
        }
        addAttrLocation(info) {
            this.hasAttrLocation = true;
            this.attrInfo.push(info);
        }
        pushBack(data) {
            for (let each of data) {
                this.data.push(each);
            }
        }
        upload() {
            BdvEngine.gl.bindBuffer(this.targetBufferType, this.buffer);
            let bufferData;
            switch (this.type) {
                case BdvEngine.gl.FLOAT: {
                    bufferData = new Float32Array(this.data);
                    break;
                }
                case BdvEngine.gl.INT: {
                    bufferData = new Int32Array(this.data);
                    break;
                }
                case BdvEngine.gl.UNSIGNED_INT: {
                    bufferData = new Uint32Array(this.data);
                    break;
                }
                case BdvEngine.gl.SHORT: {
                    bufferData = new Int16Array(this.data);
                    break;
                }
                case BdvEngine.gl.UNSIGNED_SHORT: {
                    bufferData = new Uint16Array(this.data);
                    break;
                }
                case BdvEngine.gl.BYTE: {
                    bufferData = new Int8Array(this.data);
                    break;
                }
                case BdvEngine.gl.UNSIGNED_BYTE: {
                    bufferData = new Uint8Array(this.data);
                    break;
                }
                default: {
                    throw new Error(`Unable to determine byte size for type ${this.type}.`);
                }
            }
            BdvEngine.gl.bufferData(this.targetBufferType, bufferData, BdvEngine.gl.STATIC_DRAW);
        }
        draw() {
            if (this.targetBufferType === BdvEngine.gl.ARRAY_BUFFER) {
                BdvEngine.gl.drawArrays(this.mode, 0, this.data.length / this.elementSize);
            }
            else if (this.targetBufferType === BdvEngine.gl.ELEMENT_ARRAY_BUFFER) {
                BdvEngine.gl.drawElements(this.mode, this.data.length, this.type, 0);
            }
        }
    }
    BdvEngine.glBuffer = glBuffer;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class Shader {
        constructor(name, vertexSource, fragmentSource) {
            this.attributes = {};
            this.uniforms = {};
            this.shaderName = name;
            let vertexShader = this.loadShader(vertexSource, BdvEngine.gl.VERTEX_SHADER);
            let fragmentShader = this.loadShader(fragmentSource, BdvEngine.gl.FRAGMENT_SHADER);
            this.createProgram(vertexShader, fragmentShader);
            this.getAttributes();
            this.getUniforms();
        }
        get name() {
            return this.shaderName;
        }
        use() {
            BdvEngine.gl.useProgram(this.program);
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
        loadShader(source, shaderType) {
            let shader = BdvEngine.gl.createShader(shaderType);
            BdvEngine.gl.shaderSource(shader, source);
            BdvEngine.gl.compileShader(shader);
            let error = BdvEngine.gl.getShaderInfoLog(shader);
            if (error !== '') {
                throw new Error(`Error while compiling shader program with name ${this.shaderName}: ${error}`);
            }
            return shader;
        }
        createProgram(vertexShader, fragmentShader) {
            this.program = BdvEngine.gl.createProgram();
            BdvEngine.gl.attachShader(this.program, vertexShader);
            BdvEngine.gl.attachShader(this.program, fragmentShader);
            BdvEngine.gl.linkProgram(this.program);
            let error = BdvEngine.gl.getProgramInfoLog(this.program);
            if (error !== '') {
                throw new Error(`Error linking shader with name ${this.shaderName}: ${error}`);
            }
        }
        getAttributes() {
            let attrCount = BdvEngine.gl.getProgramParameter(this.program, BdvEngine.gl.ACTIVE_ATTRIBUTES);
            for (let i = 0; i < attrCount; i++) {
                let attrInfo = BdvEngine.gl.getActiveAttrib(this.program, i);
                if (!attrInfo)
                    break;
                this.attributes[attrInfo.name] = BdvEngine.gl.getAttribLocation(this.program, attrInfo.name);
            }
        }
        getUniforms() {
            let uniformCount = BdvEngine.gl.getProgramParameter(this.program, BdvEngine.gl.ACTIVE_UNIFORMS);
            for (let i = 0; i < uniformCount; i++) {
                let uniformInfo = BdvEngine.gl.getActiveUniform(this.program, i);
                if (!uniformInfo)
                    break;
                this.uniforms[uniformInfo.name] = BdvEngine.gl.getUniformLocation(this.program, uniformInfo.name);
            }
        }
    }
    BdvEngine.Shader = Shader;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class Sprite {
        constructor(name, textureName, width = 100, height = 100) {
            this.position = new BdvEngine.vec3();
            this.name = name;
            this.width = width;
            this.height = height;
            this.textureName = textureName;
            this.texture = BdvEngine.TextureManager.getTexture(textureName);
        }
        destructor() {
            this.buffer.destroy();
            BdvEngine.TextureManager.flushTexture(this.textureName);
        }
        get getName() {
            return this.name;
        }
        load() {
            this.buffer = new BdvEngine.glBuffer(5);
            let positionAttr = new BdvEngine.glAttrInfo();
            positionAttr.location = 0;
            positionAttr.offset = 0;
            positionAttr.size = 3;
            this.buffer.addAttrLocation(positionAttr);
            let textCoordAttr = new BdvEngine.glAttrInfo();
            textCoordAttr.location = 1;
            textCoordAttr.offset = 3;
            textCoordAttr.size = 2;
            this.buffer.addAttrLocation(textCoordAttr);
            let vertices = [
                0, 0, 0, 0, 0,
                0, this.height, 0, 0, 1.0,
                this.width, this.height, 0, 1.0, 1.0,
                this.width, this.height, 0, 1.0, 1.0,
                this.width, 0, 0, 1.0, 0,
                0, 0, 0, 0, 0
            ];
            this.buffer.pushBack(vertices);
            this.buffer.upload();
            this.buffer.unbind();
        }
        update(tick) {
        }
        render(shader) {
            this.texture.activate(0);
            let diffuseLocation = shader.getUniformLocation("u_diffuse");
            BdvEngine.gl.uniform1i(diffuseLocation, 0);
            this.buffer.bind();
            this.buffer.draw();
        }
    }
    BdvEngine.Sprite = Sprite;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    const LEVEL = 0;
    const BORDER = 0;
    const TEMP_IMAGE_DATA = new Uint8Array([255, 255, 255, 255]);
    class Texture {
        constructor(name, width = 1, height = 1) {
            this.isLoaded = false;
            this.name = name;
            this.width = width;
            this.height = height;
            this.handle = BdvEngine.gl.createTexture();
            BdvEngine.Message.subscribe(`${BdvEngine.MESSAGE_ASSET_LOADER_LOADED}::${this.name}`, this);
            this.bind();
            BdvEngine.gl.pixelStorei(BdvEngine.gl.UNPACK_ALIGNMENT, 1);
            BdvEngine.gl.texImage2D(BdvEngine.gl.TEXTURE_2D, LEVEL, BdvEngine.gl.RGBA, 1, 1, BORDER, BdvEngine.gl.RGBA, BdvEngine.gl.UNSIGNED_BYTE, TEMP_IMAGE_DATA);
            let asset = BdvEngine.AssetManager.get(this.name);
            if (asset) {
                this.loadTexture(asset);
            }
        }
        destructor() {
            BdvEngine.gl.deleteTexture(this.handle);
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
            BdvEngine.gl.activeTexture(BdvEngine.gl.TEXTURE0 + textureUnit);
            this.bind();
        }
        bind() {
            BdvEngine.gl.bindTexture(BdvEngine.gl.TEXTURE_2D, this.handle);
        }
        unbind() {
            BdvEngine.gl.bindTexture(BdvEngine.gl.TEXTURE_2D, undefined);
        }
        onMessage(message) {
            if (message.code === `${BdvEngine.MESSAGE_ASSET_LOADER_LOADED}::${this.name}`) {
                this.loadTexture(message.context);
            }
        }
        loadTexture(asset) {
            this.width = asset.width;
            this.height = asset.height;
            this.bind();
            BdvEngine.gl.texImage2D(BdvEngine.gl.TEXTURE_2D, LEVEL, BdvEngine.gl.RGBA, BdvEngine.gl.RGBA, BdvEngine.gl.UNSIGNED_BYTE, asset.data);
            if (this.isPow2()) {
                BdvEngine.gl.generateMipmap(BdvEngine.gl.TEXTURE_2D);
            }
            else {
                BdvEngine.gl.texParameteri(BdvEngine.gl.TEXTURE_2D, BdvEngine.gl.TEXTURE_WRAP_S, BdvEngine.gl.CLAMP_TO_EDGE);
                BdvEngine.gl.texParameteri(BdvEngine.gl.TEXTURE_2D, BdvEngine.gl.TEXTURE_WRAP_T, BdvEngine.gl.CLAMP_TO_EDGE);
                BdvEngine.gl.texParameteri(BdvEngine.gl.TEXTURE_2D, BdvEngine.gl.TEXTURE_MIN_FILTER, BdvEngine.gl.LINEAR);
            }
            this.isLoaded = true;
        }
        isPow2() {
            return (this.isValPow2(this.width) && this.isValPow2(this.height));
        }
        isValPow2(value) {
            return (value & (value - 1)) == 0;
        }
    }
    BdvEngine.Texture = Texture;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class TextureManager {
        constructor() { }
        static getTexture(name) {
            if (!TextureManager.textures[name]) {
                let texture = new BdvEngine.Texture(name);
                TextureManager.textures[name] = new BdvEngine.TextureNode(texture);
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
    BdvEngine.TextureManager = TextureManager;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class TextureNode {
        constructor(texture) {
            this.count = 1;
            this.texture = texture;
        }
    }
    BdvEngine.TextureNode = TextureNode;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class m4x4 {
        constructor() {
            this.data = [];
            this.data = [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ];
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
    }
    BdvEngine.m4x4 = m4x4;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
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
        toArray() {
            return [this.x, this.y];
        }
        toFloat32() {
            return new Float32Array(this.toArray());
        }
    }
    BdvEngine.vec2 = vec2;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
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
        toArray() {
            return [this.x, this.y, this.z];
        }
        toFloat32() {
            return new Float32Array(this.toArray());
        }
    }
    BdvEngine.vec3 = vec3;
})(BdvEngine || (BdvEngine = {}));
//# sourceMappingURL=main.js.map