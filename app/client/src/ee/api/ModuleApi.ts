import type { AxiosPromise } from "axios";
import type { DeleteModulePayload } from "@appsmith/actions/moduleActions";

import Api from "api/Api";
import type {
  MODULE_ACTION_TYPE,
  MODULE_TYPE,
  Module,
  ModuleAction,
} from "@appsmith/constants/ModuleConstants";
import type { ApiResponse } from "api/ApiResponses";
import type { Action } from "entities/Action";

interface FetchModuleActionsPayload {
  moduleId: string;
}

export interface CreateModuleActionPayload {
  packageId: string;
  type: MODULE_TYPE;
  name?: string;
  entity: Partial<Action> & {
    type: MODULE_ACTION_TYPE;
  };
}

export type UpdateModuleActionsResponse = ModuleAction;

export type FetchModuleActionsResponse = ModuleAction[];

const BASE_URL = "v1/modules";

class ModuleApi extends Api {
  static async fetchActions(
    payload: FetchModuleActionsPayload,
  ): Promise<AxiosPromise<ApiResponse<FetchModuleActionsResponse>>> {
    const { moduleId } = payload;
    const url = `${BASE_URL}/${moduleId}/actions`;

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
    payload: ModuleAction,
  ): Promise<AxiosPromise<ApiResponse<UpdateModuleActionsResponse>>> {
    const { id, moduleId } = payload;
    const url = `${BASE_URL}/${moduleId}/${id}`;

    return Api.put(url, payload);
  }

  static async updateModule(
    payload: Module,
  ): Promise<AxiosPromise<ApiResponse>> {
    const { id } = payload;
    const url = `${BASE_URL}/${id}`;

    return Api.put(url, payload);
  }

  static async createModule(
    payload: CreateModuleActionPayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.post(BASE_URL, payload);
  }
}

export default ModuleApi;
