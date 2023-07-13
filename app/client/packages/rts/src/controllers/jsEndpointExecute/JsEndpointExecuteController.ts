import type { Response, Request } from "express";
import { StatusCodes } from "http-status-codes";

import BaseController from "@controllers/BaseController";

export default class JsEndpointExecuteController extends BaseController {
  constructor() {
    super();
  }

  async perfomJSEndpointExecute(req: Request, res: Response) {
    try {
      return super.sendResponse(res, "GOOD");
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
