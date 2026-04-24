/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

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
        this.sprite.render(shader, this.getOwner.getWorldMatrix);
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
        this.sprite.render(shader, this.getOwner.getWorldMatrix);
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
/* harmony import */ var _gl_shaders_defaultShader__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./gl/shaders/defaultShader */ "./BdvEngine/core/gl/shaders/defaultShader.ts");
/* harmony import */ var _assets_assetManager__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./assets/assetManager */ "./BdvEngine/core/assets/assetManager.ts");
/* harmony import */ var _input_inputManager__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./input/inputManager */ "./BdvEngine/core/input/inputManager.ts");
/* harmony import */ var _world_zoneManager__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./world/zoneManager */ "./BdvEngine/core/world/zoneManager.ts");
/* harmony import */ var _graphics_material__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./graphics/material */ "./BdvEngine/core/graphics/material.ts");
/* harmony import */ var _graphics_materialManager__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./graphics/materialManager */ "./BdvEngine/core/graphics/materialManager.ts");
/* harmony import */ var _graphics_color__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./graphics/color */ "./BdvEngine/core/graphics/color.ts");
/* harmony import */ var _utils_m4x4__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./utils/m4x4 */ "./BdvEngine/core/utils/m4x4.ts");
/* harmony import */ var _com_message__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./com/message */ "./BdvEngine/core/com/message.ts");
/* harmony import */ var _com_messageBus__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./com/messageBus */ "./BdvEngine/core/com/messageBus.ts");













class Engine {
    constructor(canvas) {
        this.previousTime = 0;
        this.canvas = canvas;
    }
    start() {
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.GLUTools.init(this.canvas);
        _assets_assetManager__WEBPACK_IMPORTED_MODULE_3__.AssetManager.init();
        _input_inputManager__WEBPACK_IMPORTED_MODULE_4__.InputManager.initialize();
        _world_zoneManager__WEBPACK_IMPORTED_MODULE_5__.ZoneManager.init();
        _com_message__WEBPACK_IMPORTED_MODULE_10__.Message.subscribe("MOUSE_UP", this);
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.clearColor(0, 0, 0.3, 1);
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.enable(_gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.BLEND);
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.blendFunc(_gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.SRC_ALPHA, _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.ONE_MINUS_SRC_ALPHA);
        this.defaultShader = new _gl_shaders_defaultShader__WEBPACK_IMPORTED_MODULE_2__.DefaultShader();
        this.defaultShader.use();
        _graphics_materialManager__WEBPACK_IMPORTED_MODULE_7__.MaterialManager.register(new _graphics_material__WEBPACK_IMPORTED_MODULE_6__.Material("block", "assets/textures/block.png", _graphics_color__WEBPACK_IMPORTED_MODULE_8__.Color.white()));
        _graphics_materialManager__WEBPACK_IMPORTED_MODULE_7__.MaterialManager.register(new _graphics_material__WEBPACK_IMPORTED_MODULE_6__.Material("duck", "assets/textures/duck.png", _graphics_color__WEBPACK_IMPORTED_MODULE_8__.Color.white()));
        this.projectionMatrix = _utils_m4x4__WEBPACK_IMPORTED_MODULE_9__.m4x4.ortho(0, this.canvas.width, this.canvas.height, 0, -100.0, 100.0);
        _world_zoneManager__WEBPACK_IMPORTED_MODULE_5__.ZoneManager.changeZone(0);
        this.resize();
        this.loop();
    }
    onMessage(message) {
        if (message.code === "MOUSE_UP") {
            let context = message.context;
            document.title = `Pos: [${context.position.vx},${context.position.vy}]`;
        }
    }
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.viewport(0, 0, _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.canvas.width, _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.canvas.height);
        this.projectionMatrix = _utils_m4x4__WEBPACK_IMPORTED_MODULE_9__.m4x4.ortho(0, this.canvas.width, this.canvas.height, 0, -100.0, 100.0);
    }
    loop() {
        this.update();
        this.render();
    }
    update() {
        let delta = performance.now() - this.previousTime;
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.clear(_gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.COLOR_BUFFER_BIT);
        _com_messageBus__WEBPACK_IMPORTED_MODULE_11__.MessageBus.update(delta);
        _world_zoneManager__WEBPACK_IMPORTED_MODULE_5__.ZoneManager.update(delta);
        this.previousTime = performance.now();
    }
    render() {
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.clear(_gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.COLOR_BUFFER_BIT);
        _world_zoneManager__WEBPACK_IMPORTED_MODULE_5__.ZoneManager.render(this.defaultShader);
        let projectionPosition = this.defaultShader.getUniformLocation("u_proj");
        _gl_gl__WEBPACK_IMPORTED_MODULE_1__.gl.uniformMatrix4fv(projectionPosition, false, new Float32Array(this.projectionMatrix.mData));
        requestAnimationFrame(this.loop.bind(this));
    }
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
        let totalWidth = 0;
        let yValue = 0;
        for (let i = 0; i < this._frameCount; ++i) {
            totalWidth += this._frameWidth;
            if (totalWidth > this._assetWidth) {
                yValue++;
                totalWidth = 0;
            }
            console.log("w/h", this._assetWidth, this._assetHeight);
            let u = (i * this._frameWidth) / this._assetWidth;
            let v = (yValue * this._frameHeight) / this._assetHeight;
            let min = new _utils_vec2__WEBPACK_IMPORTED_MODULE_3__.vec2(u, v);
            let uMax = (i * this._frameWidth + this._frameWidth) / this._assetWidth;
            let vMax = (yValue * this._frameHeight + this._frameHeight) / this._assetHeight;
            let max = new _utils_vec2__WEBPACK_IMPORTED_MODULE_3__.vec2(uMax, vMax);
            this._frameUVs.push(new UVInfo(min, max));
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

/***/ "./BdvEngine/core/graphics/material.ts"
/*!*********************************************!*\
  !*** ./BdvEngine/core/graphics/material.ts ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Material: () => (/* binding */ Material)
/* harmony export */ });
/* harmony import */ var _textureManager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./textureManager */ "./BdvEngine/core/graphics/textureManager.ts");

class Material {
    constructor(name, diffuseTextureName, color) {
        this.name = name;
        this.diffuseTextureName = diffuseTextureName;
        this.color = color;
        if (this.diffuseTextureName) {
            this.diffuseTexture = _textureManager__WEBPACK_IMPORTED_MODULE_0__.TextureManager.getTexture(this.diffuseTextureName);
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
            _textureManager__WEBPACK_IMPORTED_MODULE_0__.TextureManager.flushTexture(this.diffuseTextureName);
        }
        this.diffuseTextureName = value;
        if (this.diffuseTextureName) {
            this.diffuseTexture = _textureManager__WEBPACK_IMPORTED_MODULE_0__.TextureManager.getTexture(this.diffuseTextureName);
        }
    }
    get diffColor() {
        return this.color;
    }
    set diffColor(color) {
        this.color = color;
    }
    destructor() {
        _textureManager__WEBPACK_IMPORTED_MODULE_0__.TextureManager.flushTexture(this.diffuseTextureName);
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
    update(tick) { }
    render(shader, modelMatrix) {
        const transformLocation = shader.getUniformLocation("u_transf");
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniformMatrix4fv(transformLocation, false, modelMatrix.toFloat32Array());
        const colorLocation = shader.getUniformLocation("u_color");
        _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniform4fv(colorLocation, this.material.diffColor.toArrayFloat32());
        if (this.material.diffTexture) {
            this.material.diffTexture.activate(0);
            const diffuseLocation = shader.getUniformLocation("u_diffuse");
            _gl_gl__WEBPACK_IMPORTED_MODULE_0__.gl.uniform1i(diffuseLocation, 0);
        }
        this.buffer.bind();
        this.buffer.draw();
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
    }
    static isKeyDown(key) {
        return InputManager._keys[key];
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
}
InputManager._keys = [];
InputManager._leftDown = false;
InputManager._rightDown = false;


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
        ZoneManager.registeredZones[0] = "assets/zones/testZone.json";
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
/*!**************************!*\
  !*** ./BdvEngine/app.ts ***!
  \**************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _core_engine__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./core/engine */ "./BdvEngine/core/engine.ts");

let engine;
window.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.id = "mainFrame";
    document.body.appendChild(canvas);
    engine = new _core_engine__WEBPACK_IMPORTED_MODULE_0__.Engine(canvas);
    engine.start();
};
window.onresize = () => {
    engine.resize();
};

})();

/******/ })()
;
//# sourceMappingURL=main.js.map