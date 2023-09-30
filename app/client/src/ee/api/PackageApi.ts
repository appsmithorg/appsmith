import Api from "api/Api";
import type { Package } from "@appsmith/constants/PackageConstants";
import type { ApiResponse } from "api/ApiResponses";
import type { AxiosPromise } from "axios";

export type CreatePackagePayload = {
  workspaceId: string;
  name: string;
  icon?: string;
  color?: string;
};

const BASE_URL = "v1/packages";

class PackageApi extends Api {
  static fetchAllPackages() {
    const url = `${BASE_URL}/all`;

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
}

export default PackageApi;
