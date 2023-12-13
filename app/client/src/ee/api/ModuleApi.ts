import type { AxiosPromise } from "axios";
import type { DeleteModulePayload } from "@appsmith/actions/moduleActions";

import Api from "api/Api";
import type {
  MODULE_ENTITY_TYPE,
  MODULE_TYPE,
  Module,
} from "@appsmith/constants/ModuleConstants";
import type { ApiResponse } from "api/ApiResponses";
import type { Action } from "entities/Action";
import type { CreateJSCollectionRequest } from "@appsmith/api/JSActionAPI";
import type { JSCollection } from "entities/JSCollection";

interface FetchModuleActionsPayload {
  moduleId: string;
}

interface FetchModuleEntitiesPayload {
  moduleId: string;
}

export interface CreateModulePayload {
  packageId: string;
  type: MODULE_TYPE;
  name?: string;
  inputsForm: Module["inputsForm"];
  entity: (Partial<Action> | CreateJSCollectionRequest) & {
    type: MODULE_ENTITY_TYPE;
  };
}

export type UpdateModuleActionsResponse = Action;

export type FetchModuleActionsResponse = Action[];

export interface FetchModuleEntitiesResponse {
  actions: Action[];
  jsCollections: JSCollection[];
}

const BASE_URL = "v1/modules";

class ModuleApi extends Api {
  static async fetchActions(
    payload: FetchModuleActionsPayload,
  ): Promise<AxiosPromise<ApiResponse<FetchModuleActionsResponse>>> {
    const { moduleId } = payload;
    const url = `${BASE_URL}/${moduleId}/actions`;

    return Api.get(url);
  }

  static async getModuleEntities(
    payload: FetchModuleEntitiesPayload,
  ): Promise<AxiosPromise<ApiResponse<FetchModuleEntitiesResponse>>> {
    const { moduleId } = payload;
    const url = `${BASE_URL}/${moduleId}/entities`;

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
    payload: Action,
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
    payload: CreateModulePayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.post(BASE_URL, payload);
  }
}

export default ModuleApi;
