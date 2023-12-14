import type { Response, Request } from "express";
import { StatusCodes } from "http-status-codes";
import BaseController from "@controllers/BaseController";
import { ExecuteService } from "../services/ExecuteService";

export default class ExecuteController extends BaseController {
  constructor() {
    super();
  }

  async executeAppsmithSpecificActivity(req: Request, res: Response) {
    try {
      const result = await ExecuteService.executeActivity(
        req.body,
        req.headers,
      );
      return super.sendResponse(res, result);
    } catch (err) {
      return super.sendError(
        res,
        super.serverErrorMessaage,
        [err.message],
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async executeInboxCreationRequest(req: Request, res: Response) {
    try {
      const result = await ExecuteService.executeInboxCreationRequest(
        req.body,
        req.headers,
      );
      return super.sendResponse(res, result);
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
