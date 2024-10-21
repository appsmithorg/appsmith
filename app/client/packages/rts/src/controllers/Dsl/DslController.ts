import type { Response, Request } from "express";
import BaseController from "@controllers/BaseController";
import { latestDSLVersion, migrateDSLToLatest } from "@services/DslService";
import { StatusCodes } from "http-status-codes";

export default class DSLController extends BaseController {
  constructor() {
    super();
  }

  async migrateDSL(req: Request, res: Response) {
    try {
      const latestDSL = await migrateDSLToLatest(req.body);

      super.sendResponse(res, latestDSL);
    } catch (err) {
      return super.sendError(
        res,
        this.serverErrorMessage,
        [err.message],
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  getLatestDSLVersion(req: Request, res: Response) {
    try {
      super.sendResponse(res, { version: latestDSLVersion });
    } catch (err) {
      return super.sendError(
        res,
        this.serverErrorMessage,
        [err.message],
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
