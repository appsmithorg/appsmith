import Api from "./Api";
import { ApiResponse } from "./ApiResponses";

export interface PublishApplicationRequest {
  applicationId: string;
}

export interface PublishApplicationResponse extends ApiResponse {
  data: {};
}

class ApplicationApi extends Api {
  static baseURL = "v1/applications/";
  static publishURLPath = (applicationId: string) => `publish/${applicationId}`;
  static publishApplication(
    publishApplicationRequest: PublishApplicationRequest,
  ): Promise<PublishApplicationResponse> {
    return Api.post(
      ApplicationApi.baseURL +
        ApplicationApi.publishURLPath(publishApplicationRequest.applicationId),
      undefined,
      {},
    );
  }
}

export default ApplicationApi;
