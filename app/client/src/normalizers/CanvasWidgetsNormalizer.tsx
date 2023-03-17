import { normalize, schema, denormalize } from "normalizr";
import { DSLWidget } from "widgets/constants";

export const widgetSchema = new schema.Entity(
  "canvasWidgets",
  {},
  { idAttribute: "widgetId" },
);
widgetSchema.define({ children: [widgetSchema] });

class CanvasWidgetsNormalizer {
  static normalize(dsl: Partial<DSLWidget>): { entities: any; result: any } {
    return normalize(dsl, widgetSchema);
  }

  static denormalize(pageWidgetId: string, entities: any): DSLWidget {
    return denormalize(pageWidgetId, widgetSchema, entities);
  }
}

export default CanvasWidgetsNormalizer;
