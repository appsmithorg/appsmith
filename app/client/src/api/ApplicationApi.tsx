import Api from "api/Api";
import { ApiResponse } from "./ApiResponses";
import { AxiosPromise } from "axios";
import { AppColorCode } from "constants/DefaultTheme";
import { AppIconName } from "components/ads/AppIcon";
import { AppLayoutConfig } from "reducers/entityReducers/pageListReducer";
import { APP_MODE } from "entities/App";
import { ApplicationVersion } from "actions/applicationActions";
import { Datasource } from "entities/Datasource";

export type EvaluationVersion = number;

export interface PublishApplicationRequest {
  applicationId: string;
}

export interface ChangeAppViewAccessRequest {
  applicationId: string;
  publicAccess: boolean;
}

export type PublishApplicationResponse = ApiResponse<unknown>;

export interface ApplicationPagePayload {
  id: string;
  name: string;
  isDefault: boolean;
  slug?: string;
  isHidden?: boolean;
}

export type GitApplicationMetadata =
  | {
      branchName: string;
      defaultBranchName: string;
      remoteUrl: string;
      repoName: string;
      browserSupportedUrl?: string;
      isRepoPrivate?: boolean;
      browserSupportedRemoteUrl: string;
      defaultApplicationId: string;
    }
  | undefined;

export interface ApplicationResponsePayload {
  id: string;
  name: string;
  organizationId: string;
  evaluationVersion?: EvaluationVersion;
  pages: ApplicationPagePayload[];
  appIsExample: boolean;
  appLayout?: AppLayoutConfig;
  unreadCommentThreads?: number;
  gitApplicationMetadata: GitApplicationMetadata;
  slug: string;
  applicationVersion: ApplicationVersion;
}

export interface FetchApplicationPayload {
  applicationId?: string;
  pageId?: string;
  mode: APP_MODE;
}

export interface FetchApplicationResponseData {
  application: Omit<ApplicationResponsePayload, "pages">;
  pages: ApplicationPagePayload[];
  organizationId: string;
}

export type FetchApplicationResponse = ApiResponse<
  FetchApplicationResponseData
>;

export type FetchApplicationsResponse = ApiResponse<
  FetchApplicationResponseData[]
>;

export type CreateApplicationResponse = ApiResponse<ApplicationResponsePayload>;
export interface CreateApplicationRequest {
  name: string;
  orgId: string;
  color?: AppColorCode;
  icon?: AppIconName;
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
export interface ForkApplicationRequest {
  applicationId: string;
  organizationId: string;
}

export type GetAllApplicationResponse = ApiResponse<ApplicationPagePayload[]>;

export type UpdateApplicationPayload = {
  icon?: string;
  color?: string;
  name?: string;
  currentApp?: boolean;
  appLayout?: AppLayoutConfig;
  applicationVersion?: number;
};

export type UpdateApplicationRequest = UpdateApplicationPayload & {
  id: string;
  callback?: () => void;
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

export interface UserRoles {
  name: string;
  roleName: string;
  username: string;
}

export interface OrganizationApplicationObject {
  applications: Array<ApplicationObject>;
  organization: {
    id: string;
    name: string;
  };
  userRoles: Array<UserRoles>;
}
export interface FetchUsersApplicationsOrgsResponse extends ApiResponse {
  data: {
    organizationApplications: Array<OrganizationApplicationObject>;
    user: string;
    newReleasesCount: string;
    releaseItems: Array<Record<string, any>>;
  };
}

export interface FetchUnconfiguredDatasourceListResponse extends ApiResponse {
  data: Array<Datasource>;
}

export interface ImportApplicationRequest {
  orgId: string;
  applicationFile?: File;
  progress?: (progressEvent: ProgressEvent) => void;
  onSuccessCallback?: () => void;
}

class ApplicationApi extends Api {
  static baseURL = "v1/applications";
  static publishURLPath = (applicationId: string) =>
    `/publish/${applicationId}`;
  static createApplicationPath = (orgId: string) => `?orgId=${orgId}`;
  static changeAppViewAccessPath = (applicationId: string) =>
    `/${applicationId}/changeAccess`;
  static setDefaultPagePath = (request: SetDefaultPageRequest) =>
    `${ApplicationApi.baseURL}/${request.applicationId}/page/${request.id}/makeDefault`;
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
    return Api.get(ApplicationApi.baseURL + "/new");
  }

  static fetchApplication(
    applicationId: string,
  ): AxiosPromise<FetchApplicationResponse> {
    return Api.get(ApplicationApi.baseURL + "/" + applicationId);
  }

  static fetchUnconfiguredDatasourceList(payload: {
    applicationId: string;
    orgId: string;
  }): AxiosPromise<FetchUnconfiguredDatasourceListResponse> {
    return Api.get(
      `${ApplicationApi.baseURL}/import/${payload.orgId}/datasources?defaultApplicationId=${payload.applicationId}`,
    );
  }

  static fetchApplicationForViewMode(
    applicationId: string,
  ): AxiosPromise<FetchApplicationResponse> {
    return Api.get(ApplicationApi.baseURL + `/view/${applicationId}`);
  }

  static createApplication(
    request: CreateApplicationRequest,
  ): AxiosPromise<PublishApplicationResponse> {
    return Api.post(
      ApplicationApi.baseURL +
        ApplicationApi.createApplicationPath(request.orgId),
      { name: request.name, color: request.color, icon: request.icon },
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
    return Api.put(ApplicationApi.baseURL + "/" + id, rest);
  }

  static deleteApplication(
    request: DeleteApplicationRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.delete(ApplicationApi.baseURL + "/" + request.applicationId);
  }

  static duplicateApplication(
    request: DuplicateApplicationRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.post(ApplicationApi.baseURL + "/clone/" + request.applicationId);
  }

  static forkApplication(
    request: ForkApplicationRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.post(
      ApplicationApi.baseURL +
        "/" +
        request.applicationId +
        "/fork/" +
        request.organizationId,
    );
  }

  static importApplicationToOrg(
    request: ImportApplicationRequest,
  ): AxiosPromise<ApiResponse> {
    const formData = new FormData();
    if (request.applicationFile) {
      formData.append("file", request.applicationFile);
    }
    return Api.post(
      ApplicationApi.baseURL + "/import/" + request.orgId,
      formData,
      null,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: request.progress,
      },
    );
  }
}

export default ApplicationApi;
