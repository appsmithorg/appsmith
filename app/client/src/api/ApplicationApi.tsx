import Api from "./Api";
import { ApiResponse } from "./ApiResponses";
import { AxiosPromise } from "axios";

export interface PublishApplicationRequest {
  applicationId: string;
}

export interface PublishApplicationResponse extends ApiResponse {
  data: {};
}

export interface ApplicationPagePayload {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface ApplicationResponsePayload {
  id: string;
  name: string;
  organizationId: string;
  pages?: ApplicationPagePayload[];
}

export interface FetchApplicationResponse extends ApiResponse {
  data: ApplicationResponsePayload & { pages: ApplicationPagePayload[] };
}

export interface FetchApplicationsResponse extends ApiResponse {
  data: Array<ApplicationResponsePayload & { pages: ApplicationPagePayload[] }>;
}

export interface CreateApplicationResponse extends ApiResponse {
  data: ApplicationResponsePayload;
}

export interface CreateApplicationRequest {
  name: string;
}

export interface SetDefaultPageRequest {
  pageId: string;
  applicationId: string;
}

export interface DeleteApplicationRequest {
  applicationId: string;
}

class ApplicationApi extends Api {
  static baseURL = "v1/applications/";
  static publishURLPath = (applicationId: string) => `publish/${applicationId}`;
  static setDefaultPagePath = (request: SetDefaultPageRequest) =>
    `${ApplicationApi.baseURL}${request.applicationId}/page/${request.pageId}/makeDefault`;
  static publishApplication(
    publishApplicationRequest: PublishApplicationRequest,
  ): AxiosPromise<PublishApplicationResponse> {
    return Api.post(
      ApplicationApi.baseURL +
        ApplicationApi.publishURLPath(publishApplicationRequest.applicationId),
      undefined,
      {},
    );
  }
  static fetchApplications(): AxiosPromise<FetchApplicationsResponse> {
    return Api.get(ApplicationApi.baseURL);
  }
  static fetchApplication(
    applicationId: string,
  ): AxiosPromise<FetchApplicationsResponse> {
    return Api.get(ApplicationApi.baseURL + applicationId);
  }
  static createApplication(
    request: CreateApplicationRequest,
  ): AxiosPromise<CreateApplicationResponse> {
    return Api.post(ApplicationApi.baseURL, request);
  }

  static setDefaultApplicationPage(
    request: SetDefaultPageRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.put(ApplicationApi.setDefaultPagePath(request));
  }
  static deleteApplication(
    request: DeleteApplicationRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.delete(ApplicationApi.baseURL + request.applicationId);
  }
}

export default ApplicationApi;
