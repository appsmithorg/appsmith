import Api from "./Api";
import { ApiResponse } from "./ApiResponses";
import { AxiosPromise } from "axios";

export interface PublishApplicationRequest {
  applicationId: string;
}

export interface ChangeAppViewAccessRequest {
  applicationId: string;
  publicAccess: boolean;
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
  appIsExample: boolean;
}

// export interface FetchApplicationResponse extends ApiResponse {
//   data: ApplicationResponsePayload & { pages: ApplicationPagePayload[] };
// }

export interface FetchApplicationsResponse extends ApiResponse {
  data: Array<ApplicationResponsePayload & { pages: ApplicationPagePayload[] }>;
}

export interface CreateApplicationResponse extends ApiResponse {
  data: ApplicationResponsePayload;
}

export interface CreateApplicationRequest {
  name: string;
  orgId: string;
}

export interface SetDefaultPageRequest {
  id: string;
  applicationId: string;
}

export interface DeleteApplicationRequest {
  applicationId: string;
}

export interface DuplicateApplicationRequest {
  applicationId: string;
}

export interface GetAllApplicationResponse extends ApiResponse {
  data: Array<ApplicationResponsePayload & { pages: ApplicationPagePayload[] }>;
}

export type UpdateApplicationPayload = {
  icon?: string;
  color?: string;
  name?: string;
};

export type UpdateApplicationRequest = UpdateApplicationPayload & {
  id: string;
};

export interface ApplicationObject {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  organizationId: string;
  pages: ApplicationPagePayload[];
  userPermissions: string[];
}

export interface OrganizationApplicationObject {
  applications: Array<ApplicationObject>;
  organization: {
    id: string;
    name: string;
  };
}
export interface FetchUsersApplicationsOrgsResponse extends ApiResponse {
  data: {
    organizationApplications: Array<OrganizationApplicationObject>;
    user: string;
  };
}

class ApplicationApi extends Api {
  static baseURL = "v1/applications/";
  static publishURLPath = (applicationId: string) => `publish/${applicationId}`;
  static createApplicationPath = (orgId: string) => `?orgId=${orgId}`;
  static changeAppViewAccessPath = (applicationId: string) =>
    `${applicationId}/changeAccess`;
  static setDefaultPagePath = (request: SetDefaultPageRequest) =>
    `${ApplicationApi.baseURL}${request.applicationId}/page/${request.id}/makeDefault`;
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

  static getAllApplication(): AxiosPromise<GetAllApplicationResponse> {
    return Api.get(ApplicationApi.baseURL + "new");
  }

  static fetchApplication(
    applicationId: string,
  ): AxiosPromise<FetchApplicationsResponse> {
    return Api.get(ApplicationApi.baseURL + applicationId);
  }

  static createApplication(
    request: CreateApplicationRequest,
  ): AxiosPromise<PublishApplicationResponse> {
    return Api.post(
      ApplicationApi.baseURL +
        ApplicationApi.createApplicationPath(request.orgId),
      { name: request.name },
    );
  }

  static setDefaultApplicationPage(
    request: SetDefaultPageRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.put(ApplicationApi.setDefaultPagePath(request));
  }

  static changeAppViewAccess(
    request: ChangeAppViewAccessRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.put(
      ApplicationApi.baseURL +
        ApplicationApi.changeAppViewAccessPath(request.applicationId),
      { publicAccess: request.publicAccess },
    );
  }

  static updateApplication(
    request: UpdateApplicationRequest,
  ): AxiosPromise<ApiResponse> {
    const { id, ...rest } = request;
    return Api.put(ApplicationApi.baseURL + id, rest);
  }

  static deleteApplication(
    request: DeleteApplicationRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.delete(ApplicationApi.baseURL + request.applicationId);
  }

  static duplicateApplication(
    request: DuplicateApplicationRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.post(ApplicationApi.baseURL + "clone/" + request.applicationId);
  }
}

export default ApplicationApi;
