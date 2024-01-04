import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";
import type { ActionResponse } from "api/ActionAPI";
import type { AxiosPromise } from "axios";
import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import type {
  CreateQueryModuleInstancePayload,
  DeleteModuleInstancePayload,
  FetchModuleInstanceEntitiesPayload,
  FetchModuleInstancesPayload,
} from "@appsmith/actions/moduleInstanceActions";
import type { JSCollection } from "entities/JSCollection";
import type { Action } from "entities/Action";
import type { MODULE_TYPE, Module } from "@appsmith/constants/ModuleConstants";
import type { Package } from "@appsmith/constants/PackageConstants";
interface RunModuleInstancePayload {
  moduleInstanceId: string;
  actionId: string;
}

export interface RunModuleInstanceResponse extends ActionResponse {}

export interface CreateModuleInstanceResponse {
  moduleInstance: ModuleInstance;
  entities: FetchModuleInstanceEntitiesResponse;
}

export interface FetchModuleInstanceEntitiesResponse {
  actions: Action[];
  jsCollections: JSCollection[];
}

export interface RefactorModuleInstancePayload {
  layoutId: string;
  moduleInstanceId: string;
  pageId: string;
  oldName: string;
  newName: string;
}

export interface ConvertEntityToInstancePayload {
  packageId?: string;
  publicEntityId: string;
  moduleType: MODULE_TYPE;
}

export interface ConvertEntityToInstanceResponse {
  moduleInstanceData: {
    moduleInstance: ModuleInstance;
    entities: {
      actions: Action[];
      jsCollections: JSCollection[];
    };
  };
  module: Module;
  packageData: Package;
  originalEntityId: string;
  originPackageId: string;
  originModuleId: string;
}

class ModuleInstancesApi extends Api {
  static moduleInstancesUrl = "v1/moduleInstances";

  static async fetchModuleInstances(
    payload: FetchModuleInstancesPayload,
  ): Promise<AxiosPromise<ApiResponse<ModuleInstance[]>>> {
    const url = `${ModuleInstancesApi.moduleInstancesUrl}`;
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
    payload: DeleteModuleInstancePayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    const url = `${ModuleInstancesApi.moduleInstancesUrl}/${payload.id}`;
    return Api.delete(url);
  }

  static async fetchModuleInstanceEntities(
    payload: FetchModuleInstanceEntitiesPayload,
  ): Promise<AxiosPromise<ApiResponse<FetchModuleInstanceEntitiesResponse>>> {
    const url = `${ModuleInstancesApi.moduleInstancesUrl}/entities`;
    return Api.get(url, payload);
  }

  static async refactorModuleInstance(
    payload: RefactorModuleInstancePayload,
  ): Promise<AxiosPromise<ApiResponse<any>>> {
    const url = `${ModuleInstancesApi.moduleInstancesUrl}/refactor`;
    return Api.put(url, payload);
  }

  static async convertEntityToInstance(
    payload: ConvertEntityToInstancePayload,
  ): Promise<AxiosPromise<ApiResponse<ConvertEntityToInstanceResponse>>> {
    const url = `${ModuleInstancesApi.moduleInstancesUrl}/convert`;

    return Api.post(url, payload);
  }
}

export default ModuleInstancesApi;
