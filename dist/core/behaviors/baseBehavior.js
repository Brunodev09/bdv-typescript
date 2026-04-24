export class BaseBehavior {
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
//# sourceMappingURL=baseBehavior.js.map