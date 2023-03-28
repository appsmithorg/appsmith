import { normalize, schema, denormalize } from "normalizr";
import BaseController from "@controllers/BaseController";
import { Response, Request } from "express";

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

  async normalize(req: Request, res: Response) {
    const dsl =  req.body;
    console.log("dsl response ------------", JSON.stringify(normalize(dsl, widgetSchema)));
    console.log("dsl request ------------", dsl);
    return super.sendResponse(res, normalize(dsl, widgetSchema));
  }
}
