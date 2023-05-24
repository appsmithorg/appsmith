import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";
import type { AxiosPromise } from "axios";
import type { AppColorCode } from "constants/DefaultTheme";
import type { IconNames } from "design-system";
import type {
  AppLayoutConfig,
  AppPositioningTypeConfig,
} from "reducers/entityReducers/pageListReducer";
import type { APP_MODE } from "entities/App";
import type { ApplicationVersion } from "@appsmith/actions/applicationActions";
import type { Datasource } from "entities/Datasource";
import type { NavigationSetting } from "constants/AppConstants";
import { getSnapShotAPIRoute } from "@appsmith/constants/ApiConstants";

export type EvaluationVersion = number;

export interface PublishApplicationRequest {
  applicationId: string;
}

export interface ChangeAppViewAccessRequest {
  applicationId: string;
  publicAccess: boolean;
}

export type PublishApplicationResponse = ApiResponse;

export interface ApplicationPagePayload {
  id: string;
  name: string;
  isDefault: boolean;
  slug: string;
  isHidden?: boolean;
  customSlug?: string;
  userPermissions?: string;
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
  workspaceId: string;
  evaluationVersion?: EvaluationVersion;
  pages: ApplicationPagePayload[];
  appIsExample: boolean;
  appLayout?: AppLayoutConfig;
  gitApplicationMetadata: GitApplicationMetadata;
  slug: string;
  applicationVersion: ApplicationVersion;
  isPublic?: boolean;
}

export interface FetchApplicationPayload {
  applicationId?: string;
  pageId?: string;
  mode: APP_MODE;
}

export interface FetchApplicationResponseData {
  application: Omit<ApplicationResponsePayload, "pages">;
  pages: ApplicationPagePayload[];
  workspaceId: string;
}

export type FetchApplicationResponse =
  ApiResponse<FetchApplicationResponseData>;

export type FetchApplicationsResponse = ApiResponse<
  FetchApplicationResponseData[]
>;

export type CreateApplicationResponse = ApiResponse<ApplicationResponsePayload>;
export interface CreateApplicationRequest {
  name: string;
  workspaceId: string;
  color?: AppColorCode;
  icon?: IconNames;
}

export interface SetDefaultPageRequest {
  id: string;
  applicationId: string;
}

export interface DeleteApplicationRequest {
  applicationId: string;
}

export interface ForkApplicationRequest {
  applicationId: string;
  workspaceId: string;
  editMode?: boolean;
}

export type GetAllApplicationResponse = ApiResponse<ApplicationPagePayload[]>;

export type UpdateApplicationPayload = {
  icon?: string;
  color?: string;
  name?: string;
  currentApp?: boolean;
  appLayout?: AppLayoutConfig;
  applicationVersion?: number;
  embedSetting?: AppEmbedSetting;
  applicationDetail?: {
    navigationSetting?: NavigationSetting;
    appPositioning?: AppPositioningTypeConfig;
  };
  forkingEnabled?: boolean;
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
  workspaceId: string;
  pages: ApplicationPagePayload[];
  userPermissions: string[];
}

export interface PermissionGroup {
  permissionGroupId: string;
  permissionGroupName: string;
}

export interface UserRoles extends PermissionGroup {
  name: string;
  username: string;
  userId: string;
}

export interface WorkspaceApplicationObject {
  applications: Array<ApplicationObject>;
  workspace: {
    id: string;
    name: string;
  };
  users: Array<UserRoles>;
}
export interface FetchUsersApplicationsWorkspacesResponse extends ApiResponse {
  data: {
    workspaceApplications: Array<WorkspaceApplicationObject>;
    user: string;
    newReleasesCount?: string;
    releaseItems?: Array<Record<string, any>>;
  };
}
export interface FetchReleaseItemsResponse extends ApiResponse {
  data: {
    newReleasesCount: string;
    releaseItems: Array<Record<string, any>>;
  };
}
export interface FetchUnconfiguredDatasourceListResponse extends ApiResponse {
  data: Array<Datasource>;
}

export interface ImportApplicationRequest {
  workspaceId: string;
  applicationFile?: File;
  progress?: (progressEvent: ProgressEvent) => void;
  onSuccessCallback?: () => void;
  appId?: string;
}

export interface AppEmbedSetting {
  height?: string;
  width?: string;
  showNavigationBar?: boolean;
}

export interface UpdateApplicationResponse {
  id: string;
  modifiedBy: string;
  userPermissions: string[];
  name: string;
  workspaceId: string;
  isPublic: boolean;
  pages: PageDefaultMeta[];
  appIsExample: boolean;
  unreadCommentThreads: number;
  color: string;
  icon: IconNames;
  slug: string;
  lastDeployedAt: Date;
  evaluationVersion: number;
  applicationVersion: number;
  isManualUpdate: boolean;
  forkingEnabled: boolean;
  appLayout: AppLayoutConfig;
  new: boolean;
  modifiedAt: Date;
  embedSetting: AppEmbedSetting;
  applicationDetail?: {
    navigationSetting?: NavigationSetting;
  };
}

export interface PageDefaultMeta {
  id: string;
  isDefault: boolean;
  defaultPageId: string;
  default: boolean;
}

export interface UploadNavigationLogoRequest {
  applicationId: string;
  logo: File;
  onSuccessCallback?: () => void;
}

export interface DeleteNavigationLogoRequest {
  applicationId: string;
}

export interface snapShotApplicationRequest {
  applicationId: string;
}
export class ApplicationApi extends Api {
  static baseURL = "v1/applications";
  static publishURLPath = (applicationId: string) =>
    `/publish/${applicationId}`;
  static createApplicationPath = (workspaceId: string) =>
    `?workspaceId=${workspaceId}`;
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

  static getReleaseItems(): AxiosPromise<FetchReleaseItemsResponse> {
    return Api.get(ApplicationApi.baseURL + "/releaseItems");
  }

  static fetchApplication(
    applicationId: string,
  ): AxiosPromise<FetchApplicationResponse> {
    return Api.get(ApplicationApi.baseURL + "/" + applicationId);
  }

  static fetchUnconfiguredDatasourceList(payload: {
    applicationId: string;
    workspaceId: string;
  }): AxiosPromise<FetchUnconfiguredDatasourceListResponse> {
    return Api.get(
      `${ApplicationApi.baseURL}/import/${payload.workspaceId}/datasources?defaultApplicationId=${payload.applicationId}`,
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
        ApplicationApi.createApplicationPath(request.workspaceId),
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
  ): AxiosPromise<ApiResponse<UpdateApplicationResponse>> {
    const { id, ...rest } = request;
    return Api.put(ApplicationApi.baseURL + "/" + id, rest);
  }

  static deleteApplication(
    request: DeleteApplicationRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.delete(ApplicationApi.baseURL + "/" + request.applicationId);
  }

  static forkApplication(
    request: ForkApplicationRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.post(
      ApplicationApi.baseURL +
        "/" +
        request.applicationId +
        "/fork/" +
        request.workspaceId,
    );
  }

  static importApplicationToWorkspace(
    request: ImportApplicationRequest,
  ): AxiosPromise<ApiResponse> {
    const formData = new FormData();
    if (request.applicationFile) {
      formData.append("file", request.applicationFile);
    }
    return Api.post(
      `${ApplicationApi.baseURL}/import/${request.workspaceId}${
        request.appId ? `?applicationId=${request.appId}` : ""
      }`,
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

  static uploadNavigationLogo(
    request: UploadNavigationLogoRequest,
  ): AxiosPromise<ApiResponse> {
    const formData = new FormData();

    if (request.logo) {
      formData.append("file", request.logo);
    }

    return Api.post(
      ApplicationApi.baseURL + "/" + request.applicationId + "/logo",
      formData,
      null,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  }

  static deleteNavigationLogo(
    request: DeleteNavigationLogoRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.delete(
      ApplicationApi.baseURL + "/" + request.applicationId + "/logo",
    );
  }

  static createApplicationSnapShot(request: snapShotApplicationRequest) {
    return Api.post(getSnapShotAPIRoute(request.applicationId));
  }

  static getSnapShotDetails(request: snapShotApplicationRequest) {
    return Api.get(getSnapShotAPIRoute(request.applicationId));
  }

  static restoreApplicationFromSnapshot(request: snapShotApplicationRequest) {
    return Api.post(getSnapShotAPIRoute(request.applicationId) + "/restore");
  }

  static deleteApplicationSnapShot(request: snapShotApplicationRequest) {
    return Api.delete(getSnapShotAPIRoute(request.applicationId));
  }
}

export default ApplicationApi;
