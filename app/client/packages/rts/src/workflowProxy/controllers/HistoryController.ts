import type { Response, Request } from "express";
import { StatusCodes } from "http-status-codes";

import BaseController from "@controllers/BaseController";
import type {
  ActivitiesHistoryRequest,
  ActivitiesHistoryResponse,
  RunsHistoryRequest,
  RunsHistoryResponse,
} from "@workflowProxy/services/HistoryService";
import { HistoryService } from "@workflowProxy/services/HistoryService";
import {
  WORKFLOW_ACTIVITY_HISTORY_PAGE_SIZE,
  WORKFLOW_RUN_HISTORY_PAGE_SIZE,
} from "@workflowProxy/constants/messages";

export default class HistoryController extends BaseController {
  constructor() {
    super();
  }

  async listWorkflowRuns(req: Request, res: Response) {
    try {
      const { nextPageToken, pageSize, status } = req.query;
      const runsHistoryRequest: RunsHistoryRequest = {
        appsmithWorkflowId: req.params.appsmithWorkflowId,
        status: status ? status.toString() : null,
        pageSize: pageSize ? Number(pageSize) : WORKFLOW_RUN_HISTORY_PAGE_SIZE,
        nextPageToken: nextPageToken
          ? Buffer.from(nextPageToken.toString(), "base64")
          : null,
      };

      const runsHistoryResponse: RunsHistoryResponse =
        await HistoryService.listWorkflowRuns(runsHistoryRequest);
      if (runsHistoryResponse.success) {
        return super.sendResponse(
          res,
          runsHistoryResponse.data,
          runsHistoryResponse.message,
          StatusCodes.OK,
        );
      } else {
        return super.sendError(
          res,
          runsHistoryResponse.message,
          runsHistoryResponse.data,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (err) {
      return super.sendError(
        res,
        "Workflow listWorkflowRuns  failed",
        [err.message],
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async listWorkflowActivities(req: Request, res: Response) {
    try {
      const { nextPageToken, pageSize } = req.params;
      const activitiesRequest: ActivitiesHistoryRequest = {
        workflowRunId: req.params.workflowRunId,
        maximumPageSize: pageSize
          ? Number(pageSize)
          : WORKFLOW_ACTIVITY_HISTORY_PAGE_SIZE,
        nextPageToken: nextPageToken
          ? Buffer.from(nextPageToken, "base64")
          : null,
      };

      const activitiesHistoryResponse: ActivitiesHistoryResponse =
        await HistoryService.listWorkflowActivities(activitiesRequest);
      if (activitiesHistoryResponse.success) {
        return super.sendResponse(
          res,
          activitiesHistoryResponse.data,
          activitiesHistoryResponse.message,
          StatusCodes.OK,
        );
      } else {
        return super.sendError(
          res,
          activitiesHistoryResponse.message,
          activitiesHistoryResponse.data,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (err) {
      return super.sendError(
        res,
        "Workflow listWorkflowActivities  failed",
        [err.message],
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
