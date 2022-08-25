import { Response, Request } from "express";
import { validationResult } from "express-validator";
import BaseController from "../BaseController";
import AstService from "../../services/AstService";

type ScriptToIdentifiersType = {
  script: string;
  evalVersion?: number;
};
export default class AstController extends BaseController {
  constructor() {
    super();
  }

  getDependentIdentifiers(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return super.sendError(res, "Validation error", errors);

      // By default the application eval version is set to be 2
      const { script, evalVersion = 2 } : ScriptToIdentifiersType = req.body;
      const data = AstService.getIdentifiersFromScript(script, evalVersion);

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
