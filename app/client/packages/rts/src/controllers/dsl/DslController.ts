import type { Response, Request } from "express";
import { StatusCodes } from "http-status-codes";

import BaseController from "@controllers/BaseController";
import DslService from "@services/DslService";

type LatestDslVersion = {
  version: number;
};

export default class DslController extends BaseController {
  constructor() {
    super();
  }

  async getLatestDslVersion(req: Request, res: Response) {
    try {
      const latestVersionNumber: number =
        await DslService.getLatestDslVersionNumber();
      const data: LatestDslVersion = { version: latestVersionNumber };
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
      const inputDsl: any = req.body;
      const data: any = await DslService.migrateDsl(inputDsl);

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
