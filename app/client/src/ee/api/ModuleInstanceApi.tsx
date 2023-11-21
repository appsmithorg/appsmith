import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";
import type { Module } from "@appsmith/constants/ModuleConstants";
import type { ActionResponse } from "api/ActionAPI";
import type { AxiosPromise } from "axios";
import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import type {
  CreateQueryModuleInstancePayload,
  FetchModuleInstanceEntitiesPayload,
  FetchModuleInstancesPayload,
} from "@appsmith/actions/moduleInstanceActions";
import type { ActionData } from "@appsmith/reducers/entityReducers/actionsReducer";
import type { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
interface RunModuleInstancePayload {
  moduleInstanceId: string;
  actionId: string;
}

export interface FetchModuleInstancesResponse {
  moduleInstances: ModuleInstance[];
  modules: Module[];
}

export interface RunModuleInstanceResponse extends ActionResponse {}

export interface CreateModuleInstanceResponse {
  moduleInstance: ModuleInstance;
  module: Module;
}

export interface DeleteModuleInstanceResponse {
  id: string;
}

export interface FetchModuleInstanceEntitiesResponse {
  actions: ActionData[];
  actionCollections: JSCollectionData[];
}

class ModuleInstancesApi extends Api {
  static moduleInstancesUrl = "v1/moduleInstances";

  static async fetchModuleInstances(
    payload: FetchModuleInstancesPayload,
  ): Promise<AxiosPromise<ApiResponse<FetchModuleInstancesResponse>>> {
    const url = ModuleInstancesApi.moduleInstancesUrl;
    return Api.get(url, payload);
  }

  static async fetchModuleInstancesForView(
    payload: FetchModuleInstancesPayload,
  ): Promise<AxiosPromise<ApiResponse<FetchModuleInstancesResponse>>> {
    const url = `${ModuleInstancesApi.moduleInstancesUrl}/view`;
    return Api.get(url, payload);
  }

  static async runModuleInstance(
    payload: RunModuleInstancePayload,
  ): Promise<AxiosPromise<ApiResponse<RunModuleInstanceResponse>>> {
    const url = `${ModuleInstancesApi.moduleInstancesUrl}/execute`;
    return Api.post(url, payload);
  }

  static async createModuleInstance(
    payload: CreateQueryModuleInstancePayload,
  ): Promise<AxiosPromise<ApiResponse<CreateModuleInstanceResponse>>> {
    const url = ModuleInstancesApi.moduleInstancesUrl;
    return Api.post(url, payload);
  }

  static async updateModuleInstance(
    payload: ModuleInstance,
  ): Promise<AxiosPromise<ApiResponse<ModuleInstance>>> {
    const url = `${ModuleInstancesApi.moduleInstancesUrl}/${payload.id}`;

    return Api.put(url, payload);
  }

  static async deleteModuleInstance(
    moduleInstanceId: string,
  ): Promise<AxiosPromise<ApiResponse<DeleteModuleInstanceResponse>>> {
    const url = `${ModuleInstancesApi.moduleInstancesUrl}/${moduleInstanceId}`;
    return Api.delete(url);
  }

  static async fetchModuleInstanceEntities(
    payload: FetchModuleInstanceEntitiesPayload,
  ): Promise<AxiosPromise<ApiResponse<FetchModuleInstanceEntitiesResponse>>> {
    const url = `${ModuleInstancesApi.moduleInstancesUrl}/entities`;
    return Api.get(url, payload);
  }
}

export default ModuleInstancesApi;
