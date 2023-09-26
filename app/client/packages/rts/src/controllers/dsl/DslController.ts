import type { Response, Request } from "express";
import { StatusCodes } from "http-status-codes";

import BaseController from "@controllers/BaseController";
import DslService from "@services/DslService";

type LatestDslVersion = {
  versionNumber: string;
};

export default class DslController extends BaseController {
  constructor() {
    super();
  }

  async getLatestDslVersion(req: Request, res: Response) {
    try {
      // TODO: get the latest DSL version from the library
      const data: LatestDslVersion = { versionNumber: "v4" };
      return super.sendResponse(res, data);
    } catch (err) {
      return super.sendError(
        res,
        super.serverErrorMessaage,
        [err.message],
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async migrateDsl(req: Request, res: Response) {
    try {
      // TODO: migrate the actual DSL
      const data: any = await DslService.migrateDsl(req.body);

      return super.sendResponse(res, data);
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
