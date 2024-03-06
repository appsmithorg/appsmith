import type { Response, Request, NextFunction } from "express";
import BaseController from "@controllers/BaseController";

export class AuthValidator extends BaseController {
  validateRequest(req: Request, res: Response, next: NextFunction) {
    //check if cookie is present in the request, if not throw error
    if (!req.headers["cookie"] && !req.headers["authorization"]) {
      return super.sendError(
        res,
        "Authentication error",
        "workflow-proxy Cookie or Token not found in request",
        401,
      );
    }

    next();
  }
}
