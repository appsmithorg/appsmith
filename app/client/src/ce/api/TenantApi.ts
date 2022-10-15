import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "api/ApiResponses";

export type FetchCurrentTenantConfigResponse = ApiResponse<{
  userPermissions: string[];
  tenantConfiguration: Record<string, string>;
  new: boolean;
}>;

export class TenantApi extends Api {
  static tenantsUrl = "v1/tenants";

  static fetchCurrentTenantConfig(): AxiosPromise<
    FetchCurrentTenantConfigResponse
  > {
    return Api.get(TenantApi.tenantsUrl + "/current");
    // return {
    //   responseMeta: {
    //     status: 200,
    //     success: true,
    //   },
    //   data: {
    //     userPermissions: [],
    //     tenantConfiguration: {
    //       APPSMITH_BRAND_LOGO:
    //         "https://www.google.co.in/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
    //       APPSMITH_BRAND_FAVICON:
    //         "https://upload.wikimedia.org/wikipedia/commons/2/2d/Google-favicon-2015.png",
    //     },
    //     new: true,
    //   },
    // };
  }
}

export default TenantApi;
