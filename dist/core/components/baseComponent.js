export class BaseComponent {
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
//# sourceMappingURL=baseComponent.js.map