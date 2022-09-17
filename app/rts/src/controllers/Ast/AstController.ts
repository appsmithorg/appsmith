import { Response, Request } from "express";
import { StatusCodes } from "http-status-codes";

import BaseController from "@controllers/BaseController";
import AstService from "@services/AstService";

type ScriptToIdentifiersType = {
  script: string;
  evalVersion?: number;
};

type MultipleScriptToIdentifiersType = {
  scripts: string[];
  evalVersion?: number;
};
export default class AstController extends BaseController {
  constructor() {
    super();
  }

  async getInfoFromScript(req: Request, res: Response) {
    try {
      // By default the application eval version is set to be 2
      const { script, evalVersion = 2 }: ScriptToIdentifiersType = req.body;
      const data = await AstService.extractInfoFromScript(script, evalVersion);
      return super.sendResponse(res, data);
    } catch (err) {
      return super.sendError(
        res,
        super.serverErrorMessaage,
        [err.message],
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getInfoFromMultipleScripts(req: Request, res: Response) {
    try {
      // By default the application eval version is set to be 2
      const { scripts, evalVersion = 2 }: MultipleScriptToIdentifiersType =
        req.body;

      Promise.all(
        scripts.map(
          async (script) =>
            await AstService.extractInfoFromScript(script, evalVersion)
        )
      ).then((data) => {
        return super.sendResponse(res, data);
      });
    } catch (err) {
      return super.sendError(
        res,
        super.serverErrorMessaage,
        [err.message],
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}
