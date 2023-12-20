import type { Response, Request } from "express";
import { StatusCodes } from "http-status-codes";

import BaseController from "@controllers/BaseController";
import type { RunRequest } from "@workflowProxy/services/RunService";
import { RunService } from "@workflowProxy/services/RunService";

export default class RunController extends BaseController {
  constructor() {
    super();
  }

  async runWorkflow(req: Request, res: Response) {
    try {
      //check if cookie is present in the request, if not throw error
      if (!req.headers["cookie"]) {
        throw new Error("Cookie not found in request");
      }

      const reqHeaders = {
        "Content-type": "application/json",
        cookie: req.headers["cookie"],
      };

      // Use deploy service to deploy the workflow
      const { actionMap, data, workflowDef } = req.body;
      const { workflowId } = req.params;
      const runRequest: RunRequest = {
        reqHeaders,
        workflowId,
        workflowDef,
        actionMap,
        data,
      };

      const runResponse = await RunService.run(runRequest);
      if (runResponse.success) {
        return super.sendResponse(
          res,
          runResponse.data,
          runResponse.message,
          StatusCodes.OK,
        );
      } else {
        return super.sendError(
          res,
          "Workflow instance run failed",
          runResponse.message,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (err) {
      return super.sendError(
        res,
        super.serverErrorMessaage,
        [err.message],
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async executeInboxResolutionRequest(req: Request, res: Response) {
    try {
      const result = await RunService.executeInboxResolutionRequest(req.body);
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
