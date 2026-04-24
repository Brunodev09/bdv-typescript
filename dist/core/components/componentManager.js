export class ComponentManager {
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
//# sourceMappingURL=componentManager.js.map