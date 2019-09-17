import { normalize, schema, denormalize } from "normalizr";
import { FetchPageResponse } from "../api/PageApi";
import { ContainerWidgetProps } from "../widgets/ContainerWidget";

export const widgetSchema = new schema.Entity(
  "canvasWidgets",
  {},
  { idAttribute: "widgetId" },
);
widgetSchema.define({ children: [widgetSchema] });

class CanvasWidgetsNormalizer {
  static normalize(
    pageResponse: FetchPageResponse,
  ): { entities: any; result: any } {
    return normalize(pageResponse.layout.dsl, widgetSchema);
  }

  static denormalize(
    pageWidgetId: string,
    entities: any,
  ): ContainerWidgetProps<any> {
    return denormalize(pageWidgetId, widgetSchema, entities);
  }
}

export default CanvasWidgetsNormalizer;
