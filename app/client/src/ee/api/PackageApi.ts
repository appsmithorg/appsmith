import Api from "api/Api";
import type { Package } from "@appsmith/constants/PackageConstants";
import type { ApiResponse } from "api/ApiResponses";
import type { AxiosPromise } from "axios";
import type { Module } from "@appsmith/constants/ModuleConstants";
import type {
  DeletePackagePayload,
  PublishPackagePayload,
  FetchAllPackagesInWorkspacePayload,
} from "@appsmith/actions/packageActions";

export interface CreatePackagePayload {
  workspaceId: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface FetchPackagePayload {
  packageId: string;
}

export interface FetchPackageResponse {
  packageData: Package;
  modules: Module[];
}

export interface FetchPackagesInWorkspaceResponse {
  packages: Package[];
  modules: Module[];
}

const BASE_URL = "v1/packages";

class PackageApi extends Api {
  static async fetchAllPackages() {
    const url = `${BASE_URL}`;

    return Api.get(url);
  }

  static async fetchAllPackagesInWorkspace(
    payload: FetchAllPackagesInWorkspacePayload,
  ): Promise<AxiosPromise<ApiResponse<FetchPackagesInWorkspaceResponse>>> {
    const url = `${BASE_URL}/consumables?workspaceId=${payload.workspaceId}`;

    return Api.get(url);
  }

  static async createPackage(
    payload: CreatePackagePayload,
  ): Promise<AxiosPromise<ApiResponse<Package>>> {
    const url = BASE_URL;
    const { workspaceId, ...body } = payload;
    const queryParams = {
      workspaceId,
    };

    return Api.post(url, body, queryParams);
  }

  static async fetchPackage(
    payload: FetchPackagePayload,
  ): Promise<AxiosPromise<ApiResponse<FetchPackageResponse>>> {
    const { packageId } = payload;
    const url = `${BASE_URL}/${packageId}`;

    return Api.get(url);
  }

  static async updatePackage(
    payload: Package,
  ): Promise<AxiosPromise<ApiResponse<Package>>> {
    const url = `${BASE_URL}/${payload.id}`;

    return Api.put(url, payload);
  }

  static async deletePackage(
    payload: DeletePackagePayload,
  ): Promise<AxiosPromise<ApiResponse<Package>>> {
    const url = `${BASE_URL}/${payload.id}`;

    return Api.delete(url);
  }

  static async publishPackage(
    payload: PublishPackagePayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    const { packageId } = payload;
    const url = `${BASE_URL}/${packageId}/publish`;

    return Api.post(url);
  }
}

export default PackageApi;
