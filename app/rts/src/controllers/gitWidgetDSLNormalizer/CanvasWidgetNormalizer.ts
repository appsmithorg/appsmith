import { normalize, schema, denormalize } from "normalizr";
import BaseController from "@controllers/BaseController";

export const widgetSchema = new schema.Entity(
  "canvasWidgets",
  {},
  { idAttribute: "widgetId" }
);
widgetSchema.define({ children: [widgetSchema] });

export default class CanvasWidgetNormalizer extends BaseController {
  constructor() {
    super();
  }

  async normalize(dsl: Partial<any>, res: any): Promise<any> {
    return super.sendResponse(res, normalize(dsl, widgetSchema));
  }

  async denormalize(pageWidgetId: string, entities: any): Promise<any> {
    return denormalize(pageWidgetId, widgetSchema, entities);
  }
}
