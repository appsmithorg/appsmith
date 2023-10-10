import Api from "api/Api";
import type { Package } from "@appsmith/constants/PackageConstants";
import type { ApiResponse } from "api/ApiResponses";
import type { AxiosPromise } from "axios";
import type { Module } from "@appsmith/constants/ModuleConstants";

export type CreatePackagePayload = {
  workspaceId: string;
  name: string;
  icon?: string;
  color?: string;
};

type FetchPackagePayload = {
  packageId: string;
};

export type FetchPackageResponse = {
  packageData: Package;
  modules: Module[];
};

const BASE_URL = "v1/packages";

class PackageApi extends Api {
  static fetchAllPackages() {
    const url = `${BASE_URL}/`;

    return Api.get(url);
  }

  static createPackage(
    payload: CreatePackagePayload,
  ): AxiosPromise<ApiResponse<Package>> {
    const url = BASE_URL;
    const { workspaceId, ...body } = payload;
    const queryParams = {
      workspaceId,
    };

    return Api.post(url, body, queryParams);
  }

  static fetchPackage(
    payload: FetchPackagePayload,
  ): AxiosPromise<ApiResponse<FetchPackageResponse>> {
    const { packageId } = payload;
    const url = `${BASE_URL}/${packageId}`;

    return Api.get(url);
  }
}

export default PackageApi;
