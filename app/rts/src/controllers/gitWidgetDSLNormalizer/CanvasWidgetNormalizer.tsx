import { normalize, schema, denormalize } from "normalizr";
import BaseController from "@controllers/BaseController";
import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";

export const widgetSchema = new schema.Entity(
    "canvasWidgets",
    {},
    { idAttribute: "widgetId" },
);
widgetSchema.define({ children: [widgetSchema] });


export default class CanvasWidgetNormalizer extends BaseController {
    constructor() {
        super();
    }

    async normalize(dsl: Partial<any>): Promise<{ entities: any; result: any }> {
        return normalize(dsl, widgetSchema);
    }

    async denormalize(pageWidgetId: string, entities: any): Promise<any> {
        return denormalize(pageWidgetId, widgetSchema, entities);
    }
}
