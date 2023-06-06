import BaseController from "@controllers/BaseController";
import type { Request, Response } from "express";
import type { WidgetProps } from "@shared/dsl/src";
import { getDSLForGit, getNestedDSLFromGit } from "@services/DSLService";

export default class DSLController extends BaseController {
  constructor() {
    super();
  }

  async getNormalizedDSLForGit(req: Request, res: Response) {
    const DSLData: WidgetProps = req.body;
    return super.sendResponse(res, getDSLForGit(DSLData));
  }

  async getDenormalizedDSLForGit(req: Request, res: Response) {
    const DSLData: WidgetProps = req.body;
    return super.sendResponse(res, getNestedDSLFromGit(DSLData));
  }
}
