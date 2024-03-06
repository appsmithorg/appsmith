import type { WorkflowService } from "@temporalio/client";
import { WorkflowNotFoundError } from "@temporalio/common";
import { temporal } from "@temporalio/proto";
import { ConnectionSingleton, timestampToDate } from "./utils";
import {
  WORKFLOW_NAMESPACE,
  WORKFLOW_TYPE,
  WORKFLOW_RUN_HISTORY_PAGE_SIZE,
  WORKFLOW_ACTIVITY_HISTORY_PAGE_SIZE,
} from "@workflowProxy/constants/messages";
import log from "loglevel";

///////////////////////////////////////////
export interface RunsHistoryRequest {
  appsmithWorkflowId: string;
  status?: string;
  pageSize?: number;
  nextPageToken?: Uint8Array;
}

export interface RunsHistoryResponse<T = RunsHistoryResponseData | string> {
  success: boolean;
  message: string;
  data: T;
}

export interface RunsHistoryResponseData {
  runs: WorkflowExecution[];
  nextPageToken?: Uint8Array;
}

export interface WorkflowExecution {
  workflowRunId: string; // temporal workflowID is passed as workflowRunId .
  startTime: string;
  endTime: string;
  status: number;
}

///////////////////////////////////////////

export interface ActivitiesHistoryRequest {
  workflowRunId: string;
  maximumPageSize?: number;
  nextPageToken?: Uint8Array;
}

export interface ActivitiesHistoryResponse<
  T = ActivitiesHistoryResponseData | string,
> {
  success: boolean;
  message: string;
  data: T;
}

export interface ActivitiesHistoryResponseData {
  activities: WorfkflowActivity[];
}

export interface WorfkflowActivity {
  activityId: string;
  description: string;
  status: number;
  eventTime: string;
  result: temporal.api.common.v1.IPayloads;
}

///////////////////////////////////////////

export class HistoryService {
  static async listWorkflowRuns(runsHistoryRequest: RunsHistoryRequest) {
    const connection = ConnectionSingleton.getInstance();
    const service: WorkflowService = (await connection).workflowService;

    const executionStatus = temporal.api.enums.v1.WorkflowExecutionStatus;

    const whereQueryForAll = `WorkflowType="${WORKFLOW_TYPE}" AND appsmithWorkflowId="${runsHistoryRequest.appsmithWorkflowId}"`;
    const whereQueryForFailed = `WorkflowType="${WORKFLOW_TYPE}" AND appsmithWorkflowId="${runsHistoryRequest.appsmithWorkflowId}" 
      AND ExecutionStatus IN (
      ${executionStatus.WORKFLOW_EXECUTION_STATUS_FAILED},
      ${executionStatus.WORKFLOW_EXECUTION_STATUS_TERMINATED},
      ${executionStatus.WORKFLOW_EXECUTION_STATUS_TIMED_OUT}
    )`;

    const whereQuery =
      runsHistoryRequest.status?.toUpperCase() === "FAILED"
        ? whereQueryForFailed
        : whereQueryForAll;

    const request: temporal.api.workflowservice.v1.IListWorkflowExecutionsRequest =
      {
        namespace: WORKFLOW_NAMESPACE,
        pageSize: runsHistoryRequest.pageSize
          ? runsHistoryRequest.pageSize
          : WORKFLOW_RUN_HISTORY_PAGE_SIZE,
        nextPageToken: runsHistoryRequest.nextPageToken
          ? runsHistoryRequest.nextPageToken
          : null,
        query: whereQuery,
      };

    let runsHistoryResponse:
      | RunsHistoryResponse<RunsHistoryResponseData>
      | RunsHistoryResponse<string> = null;

    try {
      const response: temporal.api.workflowservice.v1.IListWorkflowExecutionsResponse =
        await service.listWorkflowExecutions(request);
      const executions = response.executions ?? [];
      const data: RunsHistoryResponseData = {
        runs: [],
        nextPageToken: response.nextPageToken ? response.nextPageToken : null,
      };

      data.runs = executions.map((execution) => {
        const workflowExecution: WorkflowExecution = {
          workflowRunId: execution.execution?.workflowId,
          startTime: timestampToDate(execution.startTime).toISOString(),
          endTime: execution.closeTime
            ? timestampToDate(execution.closeTime).toISOString()
            : "",
          status: execution.status,
        };
        return workflowExecution;
      });

      runsHistoryResponse = {
        success: true,
        message: "Workflow runs history fetched succesfully",
        data: data,
      };
    } catch (error) {
      log.error("Error retrieving workflow runs history", error);
      runsHistoryResponse = {
        success: false,
        message: "Error retrieving workflow runs history",
        data: error.message,
      };
    }

    return runsHistoryResponse;
  }

  static async listWorkflowActivities(
    activitiesRequest: ActivitiesHistoryRequest,
  ) {
    const connection = ConnectionSingleton.getInstance();
    const service: WorkflowService = (await connection).workflowService;

    const request: temporal.api.workflowservice.v1.IGetWorkflowExecutionHistoryRequest =
      {
        namespace: WORKFLOW_NAMESPACE,
        execution: { workflowId: activitiesRequest.workflowRunId }, // workflowId here refers to temporal workflowID not Appsmith's
        maximumPageSize: activitiesRequest.maximumPageSize
          ? activitiesRequest.maximumPageSize
          : WORKFLOW_ACTIVITY_HISTORY_PAGE_SIZE, // Number of runs to return per page
        nextPageToken: activitiesRequest.nextPageToken
          ? activitiesRequest.nextPageToken
          : null,
        skipArchival: true,
      };
    log.debug("HistoryService - request: ", JSON.stringify(request));

    let activitiesHistoryResponse: ActivitiesHistoryResponse = null;

    try {
      const response = await service.getWorkflowExecutionHistory(request);

      const events = response.history?.events;

      // Filtering for activity-related events that are relevant as per our UI
      const activityEvents = events.filter(
        (event) =>
          event.eventType ===
            temporal.api.enums.v1.EventType
              .EVENT_TYPE_WORKFLOW_EXECUTION_STARTED ||
          event.eventType ===
            temporal.api.enums.v1.EventType
              .EVENT_TYPE_WORKFLOW_EXECUTION_COMPLETED ||
          event.eventType ===
            temporal.api.enums.v1.EventType
              .EVENT_TYPE_WORKFLOW_EXECUTION_FAILED ||
          event.eventType ===
            temporal.api.enums.v1.EventType
              .EVENT_TYPE_WORKFLOW_EXECUTION_TERMINATED ||
          event.eventType ===
            temporal.api.enums.v1.EventType.EVENT_TYPE_ACTIVITY_TASK_STARTED ||
          event.eventType ===
            temporal.api.enums.v1.EventType
              .EVENT_TYPE_ACTIVITY_TASK_COMPLETED ||
          event.eventType ===
            temporal.api.enums.v1.EventType
              .EVENT_TYPE_ACTIVITY_TASK_TIMED_OUT ||
          event.eventType ===
            temporal.api.enums.v1.EventType.EVENT_TYPE_ACTIVITY_TASK_FAILED,
      );

      const data: ActivitiesHistoryResponseData = { activities: [] };
      activityEvents.forEach((event) => {
        const worfkflowActivity: WorfkflowActivity = {
          activityId: event.taskId?.toString(),
          description: temporal.api.enums.v1.EventType[event.eventType],
          status: event.eventType,
          eventTime: timestampToDate(event.eventTime).toISOString(),
          result: event.activityTaskCompletedEventAttributes?.result,
        };
        data.activities.push(worfkflowActivity);
      });

      activitiesHistoryResponse = {
        success: true,
        message: "Workflow activities history fetched succesfully",
        data: data,
      };
    } catch (error) {
      if (error instanceof WorkflowNotFoundError) {
        activitiesHistoryResponse = {
          success: false,
          message:
            "Error retrieving workflow activities history. WorkflowRunId does not exist",
          data: error.message,
        };
      } else {
        log.error("Error retrieving workflow activities history", error);
        activitiesHistoryResponse = {
          success: false,
          message: "Error retrieving workflow activities history",
          data: error.message,
        };
      }
    }

    log.debug(JSON.stringify(activitiesHistoryResponse));

    return activitiesHistoryResponse;
  }
}
