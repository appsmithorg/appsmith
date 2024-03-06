import type { Response, Request } from "express";
import { StatusCodes } from "http-status-codes";

import BaseController from "@controllers/BaseController";

export default class CommonController extends BaseController {
  constructor() {
    super();
  }

  // Function to check the status of the temporal server
  async checkStatusOfTemporal(req: Request, res: Response) {
    try {
      //TODO: Check the status of the temporal server and return the status
      return super.sendResponse(res);
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
