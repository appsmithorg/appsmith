import type { AxiosProgressEvent, AxiosPromise } from "axios";
import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";
import type {
  WorkspaceRole,
  Workspace,
} from "@appsmith/constants/workspaceConstants";

export interface FetchWorkspaceRolesResponse extends ApiResponse {
  data: WorkspaceRole[];
}

export interface FetchWorkspacesResponse extends ApiResponse {
  data: Workspace[];
}
export interface FetchWorkspaceResponse extends ApiResponse {
  data: Workspace;
}

export interface FetchAllUsersResponse extends ApiResponse {
  data: WorkspaceRole[];
}

export interface FetchAllRolesResponse extends ApiResponse {
  data: Workspace[];
}

export interface FetchWorkspaceRequest {
  workspaceId: string;
  skipValidation?: boolean;
}

export interface FetchAllUsersRequest {
  workspaceId: string;
}

export interface ChangeUserRoleRequest {
  workspaceId: string;
  newPermissionGroupId?: string;
  username: string;
}

export interface DeleteWorkspaceUserRequest {
  workspaceId: string;
  username: string;
}

export interface FetchAllRolesRequest {
  workspaceId: string;
}

export interface SaveWorkspaceRequest {
  id: string;
  name?: string;
  website?: string;
  email?: string;
}

export interface SaveWorkspaceLogo {
  id: string;
  logo: File;
  progress: (progressEvent: AxiosProgressEvent) => void;
}

export interface CreateWorkspaceRequest {
  name: string;
}

class WorkspaceApi extends Api {
  static rolesURL = "v1/groups";
  static workspacesURL = "v1/workspaces";
  static async fetchRoles(): Promise<
    AxiosPromise<FetchWorkspaceRolesResponse>
  > {
    return Api.get(WorkspaceApi.rolesURL);
  }
  static async fetchWorkspaces(): Promise<
    AxiosPromise<FetchWorkspacesResponse>
  > {
    return Api.get(WorkspaceApi.workspacesURL);
  }
  static async fetchWorkspace(
    request: FetchWorkspaceRequest,
  ): Promise<AxiosPromise<FetchWorkspaceResponse>> {
    return Api.get(WorkspaceApi.workspacesURL + "/" + request.workspaceId);
  }
  static async saveWorkspace(
    request: SaveWorkspaceRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.put(WorkspaceApi.workspacesURL + "/" + request.id, request);
  }
  static async createWorkspace(
    request: CreateWorkspaceRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.post(WorkspaceApi.workspacesURL, request);
  }
  static async fetchAllUsers(
    request: FetchAllUsersRequest,
  ): Promise<AxiosPromise<FetchAllUsersResponse>> {
    return Api.get(
      `${WorkspaceApi.workspacesURL}/${request.workspaceId}/members`,
    );
  }
  static async fetchAllRoles(
    request: FetchAllRolesRequest,
  ): Promise<AxiosPromise<FetchAllRolesResponse>> {
    return Api.get(
      `${WorkspaceApi.workspacesURL}/${request.workspaceId}/permissionGroups`,
    );
  }
  static async changeWorkspaceUserRole(
    request: ChangeUserRoleRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.put(
      `${WorkspaceApi.workspacesURL}/${request.workspaceId}/permissionGroup`,
      {
        username: request.username,
        newPermissionGroupId: request.newPermissionGroupId,
      },
    );
  }
  static async deleteWorkspaceUser(
    request: DeleteWorkspaceUserRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.put(
      `${WorkspaceApi.workspacesURL}/${request.workspaceId}/permissionGroup`,
      {
        username: request.username,
      },
    );
  }
  static async saveWorkspaceLogo(
    request: SaveWorkspaceLogo,
  ): Promise<AxiosPromise<ApiResponse>> {
    const formData = new FormData();
    if (request.logo) {
      formData.append("file", request.logo);
    }

    return Api.post(
      WorkspaceApi.workspacesURL + "/" + request.id + "/logo",
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
  static async deleteWorkspaceLogo(request: {
    id: string;
  }): Promise<AxiosPromise<ApiResponse>> {
    return Api.delete(WorkspaceApi.workspacesURL + "/" + request.id + "/logo");
  }
  static async deleteWorkspace(
    workspaceId: string,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.delete(`${WorkspaceApi.workspacesURL}/${workspaceId}`);
  }
}
export default WorkspaceApi;
