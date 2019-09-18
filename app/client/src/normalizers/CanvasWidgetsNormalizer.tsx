import { normalize, schema, denormalize } from "normalizr";
import { WidgetProps } from "../widgets/BaseWidget";
import { ContainerWidgetProps } from "../widgets/ContainerWidget";

export const widgetSchema = new schema.Entity(
  "canvasWidgets",
  {},
  { idAttribute: "widgetId" },
);
widgetSchema.define({ children: [widgetSchema] });

class CanvasWidgetsNormalizer {
  static normalize(
    dsl: ContainerWidgetProps<WidgetProps>,
  ): { entities: any; result: any } {
    return normalize(dsl, widgetSchema);
  }

  static denormalize(
    pageWidgetId: string,
    entities: any,
  ): ContainerWidgetProps<WidgetProps> {
    return denormalize(pageWidgetId, widgetSchema, entities);
  }
}

export default CanvasWidgetsNormalizer;
