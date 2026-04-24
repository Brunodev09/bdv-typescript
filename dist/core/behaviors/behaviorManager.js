export class BehaviorManager {
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
//# sourceMappingURL=behaviorManager.js.map