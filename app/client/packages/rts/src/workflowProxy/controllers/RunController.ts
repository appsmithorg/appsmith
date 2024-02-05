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
      if (!req.headers["cookie"] && !req.headers["Authorization"]) {
        throw new Error("workflow-proxy Cookie or Token not found in request");
      }

      const reqHeaders = {
        "Content-type": "application/json",
      };

      if (req.headers["cookie"]) {
        reqHeaders["cookie"] = req.headers["cookie"];
      }

      if (req.headers["Authorization"]) {
        reqHeaders["Authorization"] = req.headers["Authorization"];
      }

      // Use deploy service to deploy the workflow
      const { actionNameToActionIdMap, triggerData, workflowDef } = req.body;
      const runRequest: RunRequest = {
        reqHeaders,
        workflowId: workflowDef.workflowId,
        workflowDef: workflowDef.body,
        actionMap: actionNameToActionIdMap,
        triggerData: triggerData,
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
          "Workflow instance run failed: " + runResponse.message,
          runResponse.data,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (err) {
      return super.sendError(
        res,
        "Workflow instance run failed",
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
        "Workflow resolution has failed",
        [err.message],
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
