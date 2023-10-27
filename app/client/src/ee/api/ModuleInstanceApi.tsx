import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";
import type { Module } from "@appsmith/constants/ModuleConstants";
import type { ActionResponse } from "api/ActionAPI";
import type { AxiosPromise } from "axios";
import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";

interface GetModuleInstancePayload {
  creatorId: string;
  creatorType: string;
}
interface RunModuleInstancePayload {
  moduleInstanceId: string;
  actionId: string;
}

interface CreateModuleInstancePayload {
  moduleId: string;
  creatorId: string;
  creatorType: string;
}

interface UpdateModuleInstancePayload {
  moduleInstanceId: string;
  moduleInstance: ModuleInstance;
}

export interface GetModuleInstancesResponse {
  moduleInstances: ModuleInstance[];
  modules: Module[];
}

export interface RunModuleInstanceResponse extends ActionResponse {}

export interface CreateModuleInstanceResponse {
  moduleInstance: ModuleInstance;
  module: Module;
}

export interface UpdateModuleInstanceResponse extends ModuleInstance {}

export interface DeleteModuleInstanceResponse {
  id: string;
}

class ModuleInstancesApi extends Api {
  static moduleInstancesUrl = "v1/moduleInstances";

  static async getModuleInstances(
    payload: GetModuleInstancePayload,
  ): Promise<AxiosPromise<ApiResponse<GetModuleInstancesResponse>>> {
    const url = ModuleInstancesApi.moduleInstancesUrl;
    return Api.get(url, payload);
  }

  static async runModuleInstance(
    payload: RunModuleInstancePayload,
  ): Promise<AxiosPromise<ApiResponse<RunModuleInstanceResponse>>> {
    const url = `${ModuleInstancesApi.moduleInstancesUrl}/execute`;
    return Api.post(url, payload);
  }

  static async createModuleInstance(
    payload: CreateModuleInstancePayload,
  ): Promise<AxiosPromise<ApiResponse<CreateModuleInstanceResponse>>> {
    const url = ModuleInstancesApi.moduleInstancesUrl;
    return Api.post(url, payload);
  }

  static async updateModuleInstance(
    payload: UpdateModuleInstancePayload,
  ): Promise<AxiosPromise<ApiResponse<UpdateModuleInstanceResponse>>> {
    const url = `${ModuleInstancesApi.moduleInstancesUrl}/${payload.moduleInstanceId}`;
    return Api.put(url, { moduleInstance: payload.moduleInstance });
  }

  static async deleteModuleInstance(
    moduleInstanceId: string,
  ): Promise<AxiosPromise<ApiResponse<DeleteModuleInstanceResponse>>> {
    const url = `${ModuleInstancesApi.moduleInstancesUrl}/${moduleInstanceId}`;
    return Api.delete(url);
  }
}

export default ModuleInstancesApi;
