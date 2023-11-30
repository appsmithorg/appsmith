import type { DeleteWorkflowPayload } from "@appsmith/actions/workflowActions";
import type { Workflow } from "@appsmith/constants/WorkflowConstants";
import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";
import type { AxiosPromise } from "axios";

export interface FetchWorkflowResponseData extends Workflow {}

export type FetchWorkflowResponse = ApiResponse<FetchWorkflowResponseData>;
export type FetchWorkflowsResponse = ApiResponse<FetchWorkflowResponseData[]>;

export interface CreateWorkflowPayload {
  workspaceId: string;
  name: string;
  icon?: string;
  color?: string;
}

const BASE_URL = "v1/workflows";

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
    payload: Workflow,
  ): Promise<AxiosPromise<ApiResponse<Workflow>>> {
    const url = `${BASE_URL}/${payload.id}`;

    return Api.put(url, payload);
  }
}

export default WorkflowApi;
