import { normalize, schema, denormalize } from "normalizr";
import type { DSLWidget } from "widgets/constants";

export const widgetSchema = new schema.Entity(
  "canvasWidgets",
  {},
  { idAttribute: "widgetId" },
);
widgetSchema.define({ children: [widgetSchema] });

class CanvasWidgetsNormalizer {
  static normalize(dsl: Partial<DSLWidget>): { entities: any; result: any } {
    console.log({ dsl, ndsl: normalize(dsl, widgetSchema) });
    return normalize(dsl, widgetSchema);
  }

  static denormalize(pageWidgetId: string, entities: any): DSLWidget {
    console.log({ pageWidgetId, entities });
    return denormalize(pageWidgetId, widgetSchema, entities);
  }
}

export default CanvasWidgetsNormalizer;
