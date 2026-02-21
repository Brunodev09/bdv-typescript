namespace BdvEngine {
  export class ComponentManager {
    private static registeredBuilders: { [type: string]: IComponentBuilder } =
      {};

    public static registerBuilder(builder: IComponentBuilder): void {
      ComponentManager.registeredBuilders[builder.type] = builder;
    }

    public static extractComponent(json: any): IComponent {
      if (json.type !== undefined) {
        if (
          ComponentManager.registeredBuilders[String(json.type)] !== undefined
        ) {
          return ComponentManager.registeredBuilders[
            String(json.type)
          ].buildFromJson(json);
        }

        throw new Error(
          "Component manager error - type is missing or builder is not registered for this type.",
        );
      }
    }
  }
}
