let engine;
window.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'mainFrame';
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
            this.defaultShader = new BdvEngine.DefaultShader();
            this.defaultShader.use();
            BdvEngine.MaterialManager.register(new BdvEngine.Material('block_mat', 'assets/block.png', new BdvEngine.Color(0, 128, 255, 255)));
            let zoneId = BdvEngine.ZoneManager.createTestZone();
            this.projectionMatrix = BdvEngine.m4x4.ortho(0, this.canvas.width, this.canvas.height, 0, -100.0, 100.0);
            BdvEngine.ZoneManager.changeZone(zoneId);
            this.resize();
            this.loop();
        }
        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            BdvEngine.gl.viewport(0, 0, BdvEngine.gl.canvas.width, BdvEngine.gl.canvas.height);
            this.projectionMatrix = BdvEngine.m4x4.ortho(0, this.canvas.width, this.canvas.height, 0, -100.0, 100.0);
        }
        loop() {
            BdvEngine.MessageBus.update(0);
            BdvEngine.ZoneManager.update(0);
            BdvEngine.gl.clear(BdvEngine.gl.COLOR_BUFFER_BIT);
            BdvEngine.ZoneManager.render(this.defaultShader);
            let projectionPosition = this.defaultShader.getUniformLocation('u_proj');
            BdvEngine.gl.uniformMatrix4fv(projectionPosition, false, new Float32Array(this.projectionMatrix.mData));
            requestAnimationFrame(this.loop.bind(this));
        }
    }
    BdvEngine.Engine = Engine;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    BdvEngine.MESSAGE_ASSET_LOADER_LOADED = 'MESSAGE_ASSET_LOADER_LOADED';
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
            let ext = assetName.split('.').pop().toLowerCase();
            for (let loader of AssetManager.loaders) {
                if (loader.fileExt.indexOf(ext) !== -1) {
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
            return ['png', 'gif', 'jpg'];
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
    class BaseComponent {
        constructor(name) {
            this.name = name;
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
    BdvEngine.BaseComponent = BaseComponent;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class SpriteComponent extends BdvEngine.BaseComponent {
        constructor(name, materialName) {
            super(name);
            this.sprite = new BdvEngine.Sprite(name, materialName);
        }
        load() {
            this.sprite.load();
        }
        render(shader) {
            this.sprite.render(shader, this.getOwner.getWorldMatrix);
            super.render(shader);
        }
    }
    BdvEngine.SpriteComponent = SpriteComponent;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class GLUTools {
        static init(canvas) {
            BdvEngine.gl = canvas.getContext('webgl');
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
        constructor(name) {
            this.attributes = {};
            this.uniforms = {};
            this.shaderName = name;
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
        load(vertexSource, fragmentSource) {
            let vertexShader = this.loadShader(vertexSource, BdvEngine.gl.VERTEX_SHADER);
            let fragmentShader = this.loadShader(fragmentSource, BdvEngine.gl.FRAGMENT_SHADER);
            this.createProgram(vertexShader, fragmentShader);
            this.getAttributes();
            this.getUniforms();
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
    class DefaultShader extends BdvEngine.Shader {
        constructor() {
            super('default');
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
    BdvEngine.DefaultShader = DefaultShader;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
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
            return [this.red / 255.0, this.green / 255.0, this.blue / 255.0, this.alpha / 255.0];
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
    BdvEngine.Color = Color;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class Material {
        constructor(name, diffuseTextureName, color) {
            this.name = name;
            this.diffuseTextureName = diffuseTextureName;
            this.color = color;
            if (this.diffuseTextureName) {
                this.diffuseTexture = BdvEngine.TextureManager.getTexture(this.diffuseTextureName);
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
                BdvEngine.TextureManager.flushTexture(this.diffuseTextureName);
            }
            this.diffuseTextureName = value;
            if (this.diffuseTextureName) {
                this.diffuseTexture = BdvEngine.TextureManager.getTexture(this.diffuseTextureName);
            }
        }
        get diffColor() {
            return this.color;
        }
        set diffColor(color) {
            this.color = color;
        }
        destructor() {
            BdvEngine.TextureManager.flushTexture(this.diffuseTextureName);
            this.diffuseTexture = undefined;
        }
    }
    BdvEngine.Material = Material;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class MaterialManager {
        constructor() { }
        static register(material) {
            if (!MaterialManager.materials[material.materialName]) {
                MaterialManager.materials[material.materialName] = new BdvEngine.MaterialRefNode(material);
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
    BdvEngine.MaterialManager = MaterialManager;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class MaterialRefNode {
        constructor(material) {
            this.refCount = 1;
            this.material = material;
        }
    }
    BdvEngine.MaterialRefNode = MaterialRefNode;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class Sprite {
        constructor(name, materialName, width = 100, height = 100) {
            this.name = name;
            this.width = width;
            this.height = height;
            this.materialName = materialName;
            this.material = BdvEngine.MaterialManager.get(this.materialName);
        }
        destructor() {
            this.buffer.destroy();
            BdvEngine.MaterialManager.flush(this.materialName);
            this.material = undefined;
            this.materialName = undefined;
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
                0,
                0,
                0,
                0,
                0,
                0,
                this.height,
                0,
                0,
                1.0,
                this.width,
                this.height,
                0,
                1.0,
                1.0,
                this.width,
                this.height,
                0,
                1.0,
                1.0,
                this.width,
                0,
                0,
                1.0,
                0,
                0,
                0,
                0,
                0,
                0,
            ];
            this.buffer.pushBack(vertices);
            this.buffer.upload();
            this.buffer.unbind();
        }
        update(tick) { }
        render(shader, modelMatrix) {
            const transformLocation = shader.getUniformLocation('u_transf');
            BdvEngine.gl.uniformMatrix4fv(transformLocation, false, modelMatrix.toFloat32Array());
            const colorLocation = shader.getUniformLocation('u_color');
            BdvEngine.gl.uniform4fv(colorLocation, this.material.diffColor.toArrayFloat32());
            if (this.material.diffTexture) {
                this.material.diffTexture.activate(0);
                const diffuseLocation = shader.getUniformLocation('u_diffuse');
                BdvEngine.gl.uniform1i(diffuseLocation, 0);
            }
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
            return this.isValPow2(this.width) && this.isValPow2(this.height);
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
        toFloat32Array() {
            return new Float32Array(this.data);
        }
        copyFrom(m) {
            for (let i = 0; i < 16; i++) {
                this.data[i] = m.data[i];
            }
        }
    }
    BdvEngine.m4x4 = m4x4;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class transform {
        constructor() {
            this.position = BdvEngine.vec3.zero;
            this.rotation = BdvEngine.vec3.zero;
            this.scale = BdvEngine.vec3.one;
        }
        copyFrom(transform) {
            this.position.copyFrom(transform.position);
            this.rotation.copyFrom(transform.rotation);
            this.scale.copyFrom(transform.scale);
        }
        getTransformationMatrix() {
            let translation = BdvEngine.m4x4.translation(this.position);
            let rotation = BdvEngine.m4x4.rotationXYZ(this.rotation.vx, this.rotation.vy, this.rotation.vz);
            let scale = BdvEngine.m4x4.scale(this.scale);
            return BdvEngine.m4x4.multiply(BdvEngine.m4x4.multiply(translation, rotation), scale);
        }
    }
    BdvEngine.transform = transform;
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
    }
    BdvEngine.vec3 = vec3;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class Scene {
        constructor() {
            this.root = new BdvEngine.SimObject(0, '__root__', this);
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
    BdvEngine.Scene = Scene;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class SimObject {
        constructor(id, name, scene) {
            this.children = [];
            this.isLoaded = false;
            this.components = [];
            this.localMatrix = BdvEngine.m4x4.identity();
            this.worldMatrix = BdvEngine.m4x4.identity();
            this.transform = new BdvEngine.transform();
            this.id = id;
            this.name = name;
            this.scene = scene;
        }
        onAdded(scene) {
            this.scene = scene;
        }
        updateWorldMatrix(parentWorldMatrix) {
            if (parentWorldMatrix) {
                this.worldMatrix = BdvEngine.m4x4.multiply(parentWorldMatrix, this.localMatrix);
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
        addComponent(component) {
            this.components.push(component);
            component.setOwner(this);
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
    BdvEngine.SimObject = SimObject;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    let ZoneState;
    (function (ZoneState) {
        ZoneState[ZoneState["UNINITIALIZED"] = 0] = "UNINITIALIZED";
        ZoneState[ZoneState["LOADING"] = 1] = "LOADING";
        ZoneState[ZoneState["UPDATING"] = 2] = "UPDATING";
    })(ZoneState = BdvEngine.ZoneState || (BdvEngine.ZoneState = {}));
    class Zone {
        constructor(id, name, description) {
            this.state = ZoneState.UNINITIALIZED;
            this.id = id;
            this.name = name;
            this.description = description;
            this.scene = new BdvEngine.Scene();
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
    BdvEngine.Zone = Zone;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class ZoneManager {
        constructor() { }
        static createZone(name, description) {
            ZoneManager.globalZoneId++;
            let zone = new BdvEngine.Zone(ZoneManager.globalZoneId, name, description);
            ZoneManager.zones[ZoneManager.globalZoneId] = zone;
            return ZoneManager.globalZoneId;
        }
        static createTestZone() {
            ZoneManager.globalZoneId++;
            ZoneManager.zones[ZoneManager.globalZoneId] = new BdvEngine.ZoneTest(ZoneManager.globalZoneId, 'test', 'simple test zone');
            return ZoneManager.globalZoneId;
        }
        static changeZone(zoneId) {
            if (ZoneManager.currentZone) {
                ZoneManager.currentZone.onDeactivate();
                ZoneManager.currentZone.unload();
            }
            if (ZoneManager.zones[zoneId]) {
                ZoneManager.currentZone = ZoneManager.zones[zoneId];
                ZoneManager.currentZone.onActivate();
                ZoneManager.currentZone.load();
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
    }
    ZoneManager.globalZoneId = -1;
    ZoneManager.zones = {};
    BdvEngine.ZoneManager = ZoneManager;
})(BdvEngine || (BdvEngine = {}));
var BdvEngine;
(function (BdvEngine) {
    class ZoneTest extends BdvEngine.Zone {
        load() {
            this.parentObject = new BdvEngine.SimObject(0, 'parentObject');
            this.parentObject.transform.position.vx = 300;
            this.parentObject.transform.position.vy = 300;
            this.parentSprite = new BdvEngine.SpriteComponent('parentSprite', 'block_mat');
            this.parentObject.addComponent(this.parentSprite);
            this.testObject = new BdvEngine.SimObject(1, 'testObject');
            this.testSprite = new BdvEngine.SpriteComponent('testSprite', 'block_mat');
            this.testObject.addComponent(this.testSprite);
            this.testObject.transform.position.vx = 120;
            this.testObject.transform.position.vy = 120;
            this.parentObject.addChild(this.testObject);
            this.getScene.addObject(this.parentObject);
            this.testObject.load();
            super.load();
        }
        update(deltaTime) {
            this.parentObject.transform.rotation.vz += 0.01;
            this.testObject.transform.rotation.vz += 0.01;
            super.update(deltaTime);
        }
    }
    BdvEngine.ZoneTest = ZoneTest;
})(BdvEngine || (BdvEngine = {}));
//# sourceMappingURL=main.js.map