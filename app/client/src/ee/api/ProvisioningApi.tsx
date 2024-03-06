import type { AxiosPromise } from "axios";
import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";

export interface DisconnectProvisioningRequest {
  keepAllProvisionedResources: boolean;
}

export class ProvisioningApi extends Api {
  static provision = "/v1/provision";
  static provisioningApiKey = "/v1/api-key/provision";

  static async fetchProvisioningStatus(): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.get(`${ProvisioningApi.provision}/status`);
    return response;
  }

  static async disconnectProvisioning(
    request: DisconnectProvisioningRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.post(
      `${ProvisioningApi.provision}/disconnect`,
      request,
    );
    return response;
  }

  static async generateProvisioningToken(): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.post(`${ProvisioningApi.provisioningApiKey}`);
    return response;
  }
}

export default ProvisioningApi;
