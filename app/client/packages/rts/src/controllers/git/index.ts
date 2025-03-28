import type { Response, Request } from "express";
import { StatusCodes } from "http-status-codes";

import BaseController from "@controllers/BaseController";
import { reset } from "@services/gitService";
import log from "loglevel";
import type { GitResetRequestDTO } from "../../types/git.dto";

export default class GitController extends BaseController {
  async reset(req: Request, res: Response) {
    try {
      const request: GitResetRequestDTO = req.body;

      const result = await reset(request);

      return super.sendResponse(res, result);
    } catch (err) {
      log.error(err);

      return super.sendError(
        res,
        "Something went wrong",
        [err.message],
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
