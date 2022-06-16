import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "./ApiResponses";
import { WorkspaceRole, Workspace } from "constants/workspaceConstants";

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
  role: string;
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
  progress: (progressEvent: ProgressEvent) => void;
}

export interface CreateWorkspaceRequest {
  name: string;
}

class WorkspaceApi extends Api {
  static rolesURL = "v1/groups";
  static workspacesURL = "v1/workspaces";
  static fetchRoles(): AxiosPromise<FetchWorkspaceRolesResponse> {
    return Api.get(WorkspaceApi.rolesURL);
  }
  static fetchWorkspaces(): AxiosPromise<FetchWorkspacesResponse> {
    return Api.get(WorkspaceApi.workspacesURL);
  }
  static fetchWorkspace(
    request: FetchWorkspaceRequest,
  ): AxiosPromise<FetchWorkspaceResponse> {
    return Api.get(WorkspaceApi.workspacesURL + "/" + request.workspaceId);
  }
  static saveWorkspace(
    request: SaveWorkspaceRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.put(WorkspaceApi.workspacesURL + "/" + request.id, request);
  }
  static createWorkspace(
    request: CreateWorkspaceRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.post(WorkspaceApi.workspacesURL, request);
  }
  static fetchAllUsers(
    request: FetchAllUsersRequest,
  ): AxiosPromise<FetchAllUsersResponse> {
    return Api.get(
      WorkspaceApi.workspacesURL + "/" + request.workspaceId + "/members",
    );
  }
  static fetchAllRoles(
    request: FetchAllRolesRequest,
  ): AxiosPromise<FetchAllRolesResponse> {
    return Api.get(
      WorkspaceApi.workspacesURL + `/roles?workspaceId=${request.workspaceId}`,
    );
  }
  static changeWorkspaceUserRole(
    request: ChangeUserRoleRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.put(
      WorkspaceApi.workspacesURL + "/" + request.workspaceId + "/role",
      {
        username: request.username,
        roleName: request.role,
      },
    );
  }
  static deleteWorkspaceUser(
    request: DeleteWorkspaceUserRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.put(
      WorkspaceApi.workspacesURL + "/" + request.workspaceId + "/role",
      {
        username: request.username,
        roleName: null,
      },
    );
  }
  static saveWorkspaceLogo(
    request: SaveWorkspaceLogo,
  ): AxiosPromise<ApiResponse> {
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
  static deleteWorkspaceLogo(request: {
    id: string;
  }): AxiosPromise<ApiResponse> {
    return Api.delete(WorkspaceApi.workspacesURL + "/" + request.id + "/logo");
  }
  static deleteWorkspace(workspaceId: string): AxiosPromise<ApiResponse> {
    return Api.delete(`${WorkspaceApi.workspacesURL}/${workspaceId}`);
  }
}
export default WorkspaceApi;
