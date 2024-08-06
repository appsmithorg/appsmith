import type { Response, Request } from "express";
import { StatusCodes } from "http-status-codes";

import BaseController from "@controllers/BaseController";

export default class HealthCheckController extends BaseController {
  constructor() {
    super();
  }

  async performHealthCheck(req: Request, res: Response) {
    try {
      return super.sendResponse(res);
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
