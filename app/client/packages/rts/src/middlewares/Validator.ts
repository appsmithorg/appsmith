import BaseController from "@controllers/BaseController";
import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

export class Validator extends BaseController {
  validateRequest(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return super.sendError(res, "Validation error", errors);

    next();
  }
}
