import type { AxiosPromise } from "axios";
import type {
  DeleteModulePayload,
  SaveModulePayload,
} from "@appsmith/actions/moduleActions";

import Api from "api/Api";
import type { ModuleAction } from "@appsmith/constants/ModuleConstants";
import type { ApiResponse } from "api/ApiResponses";

interface FetchModuleActionsPayload {
  moduleId: string;
}

interface UpdateModuleActionPayload {
  moduleId: string;
  actionId: string;
  action: ModuleAction;
}
export type UpdateModuleActionsResponse = ModuleAction;

export type FetchModuleActionsResponse = ModuleAction[];

const BASE_URL = "v1/modules";

class ModuleApi extends Api {
  static async fetchActions(
    payload: FetchModuleActionsPayload,
  ): Promise<AxiosPromise<ApiResponse<FetchModuleActionsResponse>>> {
    const { moduleId } = payload;
    const url = `${BASE_URL}/${moduleId}`;

    return Api.get(url);
  }

  static async deleteModule(
    payload: DeleteModulePayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    const { id } = payload;
    const url = `${BASE_URL}/${id}`;

    return Api.delete(url);
  }

  static async updateAction(
    payload: UpdateModuleActionPayload,
  ): Promise<AxiosPromise<ApiResponse<UpdateModuleActionsResponse>>> {
    const { action, actionId, moduleId } = payload;
    const url = `${BASE_URL}/${moduleId}/${actionId}`;

    return Api.put(url, action);
  }

  static async saveModuleName(
    payload: SaveModulePayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    const { id } = payload;
    const url = `${BASE_URL}/${id}`;

    return Api.put(url, payload);
  }
}

export default ModuleApi;
