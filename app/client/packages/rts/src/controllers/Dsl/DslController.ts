import type { Response, Request } from "express";
import BaseController from "@controllers/BaseController";
import { latestDSLVersion, migrateDSLToLatest } from "@services/DslService";
import { StatusCodes } from "http-status-codes";
import { startSpan, endSpan } from "../../utils/tracing";

export default class DSLController extends BaseController {
  constructor() {
    super();
  }

  async migrateDSL(req: Request, res: Response) {
    const span = startSpan("dsl-migration");

    try {
      const latestDSL = await migrateDSLToLatest(req.body);
      super.sendResponse(res, latestDSL);
    } catch (err) {
      endSpan(span, err);
      return super.sendError(
        res,
        this.serverErrorMessage,
        [err.message],
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
    endSpan(span);
  }

  getLatestDSLVersion(req: Request, res: Response) {
    const span = startSpan("get-latest-dsl-version");
    const childSpan = startSpan("version-check", {}, span);

    try {
      super.sendResponse(res, { version: latestDSLVersion });
    } catch (err) {
      endSpan(childSpan, err);
      endSpan(span, err);
      return super.sendError(
        res,
        this.serverErrorMessage,
        [err.message],
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
    endSpan(childSpan);
    endSpan(span);
  }
}
