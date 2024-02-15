import Api from "api/Api";
import type { Package } from "@appsmith/constants/PackageConstants";
import type { ApiResponse } from "api/ApiResponses";
import type { AxiosPromise } from "axios";
import type {
  Module,
  ModuleMetadata,
} from "@appsmith/constants/ModuleConstants";
import type {
  DeletePackagePayload,
  PublishPackagePayload,
  FetchConsumablePackagesInWorkspacePayload,
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
  modulesMetadata: ModuleMetadata[];
}

export interface FetchConsumablePackagesInWorkspaceResponse {
  packages: Package[];
  modules: Module[];
}

export interface ImportPackagePayload {
  workspaceId: string;
  file?: File;
  packageId?: string;
}

export interface ImportPackageResponse {
  package: Package;
  isPartialImport: boolean;
}

const BASE_URL = "v1/packages";

class PackageApi extends Api {
  static async fetchAllPackages() {
    const url = `${BASE_URL}`;

    return Api.get(url);
  }

  static async fetchConsumablePackagesInWorkspace(
    payload: FetchConsumablePackagesInWorkspacePayload,
  ): Promise<
    AxiosPromise<ApiResponse<FetchConsumablePackagesInWorkspaceResponse>>
  > {
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

  static async importPackage(
    payload: ImportPackagePayload,
  ): Promise<AxiosPromise<ApiResponse<ImportPackageResponse>>> {
    const formData = new FormData();
    const { file, packageId, workspaceId } = payload;

    if (file) {
      formData.append("file", file);
    }

    const url = `${BASE_URL}/import/${workspaceId}`;
    const queryParams: Record<string, string> = {};

    if (packageId) {
      queryParams.packageId = packageId;
    }

    return Api.post(url, formData, queryParams, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }
}

export default PackageApi;
