import type { Response, Request } from "express";
import BaseController from "@controllers/BaseController";
import { latestDSLVersion, migrateDSLToLatest } from "@services/DslService";
import { StatusCodes } from "http-status-codes";

export default class DSLController extends BaseController {
  constructor() {
    super();
  }

  migrateDSL(req: Request, res: Response) {
    const { dsl } = req.body;
    try {
      const latestDSL = migrateDSLToLatest(dsl);
      super.sendResponse(res, {
        dsl: latestDSL,
        latestVersion: latestDSLVersion,
      });
    } catch (err) {
      return super.sendError(
        res,
        super.serverErrorMessaage,
        [err.message],
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  getLatestDSLVersion(req: Request, res: Response) {
    try {
      super.sendResponse(res, { latestVersion: latestDSLVersion });
    } catch (err) {
      return super.sendError(
        res,
        super.serverErrorMessaage,
        [err.message],
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
