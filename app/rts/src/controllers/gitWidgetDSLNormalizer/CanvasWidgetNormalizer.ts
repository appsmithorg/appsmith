
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
    return super.sendResponse(res, normalize(dsl, widgetSchema));
  }

  async denormalize(req: Request, res: Response) {
    const dsl =  req.body;
    return super.sendResponse(res, denormalize(0, widgetSchema, dsl));
  }
}