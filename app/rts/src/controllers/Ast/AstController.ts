import { Response, Request } from "express";
import { StatusCodes } from "http-status-codes";

import BaseController from "@controllers/BaseController";
import AstService from "@services/AstService";

type ScriptToIdentifiersType = {
  script: string;
  evalVersion?: number;
};

type entityRefactorType = {
  script: string;
  oldName: string;
  newName: string;
  isJSObject: boolean;
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

  async getIdentifierDataFromScript(req: Request, res: Response) {
    try {
      // By default the application eval version is set to be 2
      const { script, evalVersion = 2 }: ScriptToIdentifiersType = req.body;
      const data = await AstService.extractIdentifierDataFromScript(
        script,
        evalVersion
      );
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

  async getIdentifierDataFromMultipleScripts(req: Request, res: Response) {
    try {
      // By default the application eval version is set to be 2
      const { scripts, evalVersion = 2 }: MultipleScriptToIdentifiersType =
        req.body;

      Promise.all(
        scripts.map(
          async (script) =>
            await AstService.extractIdentifierDataFromScript(
              script,
              evalVersion
            )
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

  async entityRefactorController(req: Request, res: Response) {
    try {
      // By default the application eval version is set to be 2
      const { script, oldName, newName, isJSObject, evalVersion = 2 }: entityRefactorType =
        req.body;
      const data = await AstService.entityRefactor(
        script,
        oldName,
        newName,
        isJSObject,
        evalVersion
      );
      return super.sendEntityResponse(res, data.body, data.isSuccess);
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
