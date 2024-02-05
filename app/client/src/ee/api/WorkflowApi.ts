import type {
  DeleteWorkflowPayload,
  PublishWorkflowPayload,
} from "@appsmith/actions/workflowActions";
import type {
  Workflow,
  WorkflowMetadata,
} from "@appsmith/constants/WorkflowConstants";
import type {
  WorkflowRunDetailsData,
  WorkflowRunHistoryData,
} from "@appsmith/reducers/uiReducers/workflowHistoryPaneReducer";
import type { ActionCreateUpdateResponse } from "api/ActionAPI";
import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";
import type { AxiosPromise } from "axios";
import type { Action } from "entities/Action";

export interface FetchWorkflowResponseData extends Workflow {}

export type FetchWorkflowResponse = ApiResponse<FetchWorkflowResponseData>;
export interface FetchWorkflowsResponse extends ApiResponse {
  data: Array<FetchWorkflowResponse>;
}

export interface CreateWorkflowApiKeysResponse {
  data: string;
}

export interface CreateWorkflowPayload {
  workspaceId: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface CreateWorkflowQueryActionPayload {
  id: string;
  name: string;
  actionConfiguration: any;
}

export interface FetchWorkflowRunsResponse {
  runs: Array<WorkflowRunHistoryData>;
}

export interface FetchWorkflowRunDetailsResponse {
  activities: Array<WorkflowRunDetailsData>;
}

const BASE_URL = "v1/workflows";
const API_KEY_BASE_URL = "v1/api-key/workflow";

class WorkflowApi extends Api {
  static async fetchWorkflows(params: {
    workspaceId: string;
  }): Promise<AxiosPromise<FetchWorkflowsResponse>> {
    const url = `${BASE_URL}`;

    return Api.get(url, params);
  }

  static async fetchWorkflowById(params: {
    workflowId: string;
  }): Promise<AxiosPromise<FetchWorkflowResponse>> {
    const url = `${BASE_URL}/${params.workflowId}`;

    return Api.get(url, params);
  }

  static async createWorkflow(
    payload: CreateWorkflowPayload,
  ): Promise<AxiosPromise<FetchWorkflowResponse>> {
    const url = `${BASE_URL}`;
    const { workspaceId, ...body } = payload;
    const queryParams = {
      workspaceId,
    };

    return Api.post(url, body, queryParams);
  }

  static async deleteWorkflow(
    payload: DeleteWorkflowPayload,
  ): Promise<AxiosPromise<FetchWorkflowResponse>> {
    const url = `${BASE_URL}/${payload.id}`;

    return Api.delete(url);
  }

  static async updateWorkflow(
    payload: WorkflowMetadata,
  ): Promise<AxiosPromise<ApiResponse<Workflow>>> {
    const url = `${BASE_URL}/${payload.id}`;

    return Api.put(url, payload);
  }

  static async CreateWorkflowAction(
    payload: Partial<Action>,
  ): Promise<AxiosPromise<ActionCreateUpdateResponse>> {
    const url = `${BASE_URL}/${payload.workflowId}/action`;

    return Api.post(url, payload);
  }

  static async publishWorkflow(
    payload: PublishWorkflowPayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    const { workflowId } = payload;
    // TODO (workflows): fix the url once server side is fixed
    // const url = `${BASE_URL}/${workflowId}/publish`;
    const url = `${BASE_URL}/publish/${workflowId}`;

    return Api.post(url);
  }

  static async createWorkflowApiKey(
    workflowId: string,
  ): Promise<AxiosPromise<ApiResponse<CreateWorkflowApiKeysResponse>>> {
    const url = `${API_KEY_BASE_URL}/${workflowId}`;

    return Api.post(url);
  }

  static async archiveWorkflowApiKey(
    workflowId: string,
  ): Promise<AxiosPromise<ApiResponse<CreateWorkflowApiKeysResponse>>> {
    const url = `${BASE_URL}/token/${workflowId}`;

    return Api.delete(url);
  }

  static async fetchWorkflowRuns(
    workflowId: string,
    paramString: string,
  ): Promise<AxiosPromise<ApiResponse<FetchWorkflowRunsResponse>>> {
    const url = `${BASE_URL}/${workflowId}/runs${paramString}`;

    return Api.get(url);
  }

  static async fetchWorkflowRunDetails(
    workflowId: string,
    runId: string,
  ): Promise<AxiosPromise<ApiResponse<FetchWorkflowRunDetailsResponse>>> {
    const url = `${BASE_URL}/${workflowId}/runs/${runId}/activities`;

    return Api.get(url);
  }
}

export default WorkflowApi;
