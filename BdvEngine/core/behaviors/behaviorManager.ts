import { IBehaviorBuilder } from './IBehaviorBuilder';
import { IBehavior } from './IBehavior';

export class BehaviorManager {
  private static registeredBuilders: { [type: string]: IBehaviorBuilder } =
    {};

  public static registerBuilder(builder: IBehaviorBuilder): void {
    BehaviorManager.registeredBuilders[builder.type] = builder;
  }

  public static extractBehavior(json: any): IBehavior {
    if (json.type !== undefined) {
      if (
        BehaviorManager.registeredBuilders[String(json.type)] !== undefined
      ) {
        return BehaviorManager.registeredBuilders[
          String(json.type)
        ].buildFromJson(json);
      }

      throw new Error(
        "BehaviorManager::Behavior manager error - type is missing or builder is not registered for this type.",
      );
    }

    throw new Error("BehaviorManager::Behavior type is missing.");
  }
}
