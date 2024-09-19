import BaseController from "@controllers/BaseController";
import { validationResult } from "express-validator";
import type { Response, Request, NextFunction } from "express";

export class Validator extends BaseController {
  validateRequest(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);

    if (!errors.isEmpty())
      return super.sendError(res, "Validation error", errors);

    next();
  }
}
