import { Response, Request } from "express";
import { validationResult } from "express-validator";
import BaseController from "../BaseController";
import AstService from "../../services/AstService";

export default class AstController extends BaseController {
  constructor() {
    super();
  }

  getAST(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return super.sendError(res, "Validation error", errors);
      const data = AstService.getAST();

      return super.sendResponse(res, data);
    } catch (err) {
      return super.sendError(
        res,
        super.serverErrorMessaage,
        [err.message],
        500
      );
    }
  }
}
