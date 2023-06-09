import BaseController from "@controllers/BaseController";
import type { Request, Response } from "express";
import {
  getFlattenedDSLForGit,
  getNestedDSLFromGit,
} from "@services/DSLService";

export default class DSLController extends BaseController {
  constructor() {
    super();
  }

  async getNormalizedDSLForGit(req: Request, res: Response) {
    const DSLData = req.body;
    return super.sendResponse(res, getFlattenedDSLForGit(DSLData));
  }

  async getDenormalizedDSLForGit(req: Request, res: Response) {
    const DSLData = req.body;
    return super.sendResponse(res, getNestedDSLFromGit(DSLData));
  }
}
