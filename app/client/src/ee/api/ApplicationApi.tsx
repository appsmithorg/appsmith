export * from "ce/api/ApplicationApi";
import { ApplicationApi as CE_ApplicationApi } from "ce/api/ApplicationApi";
import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";
import type { AxiosPromise } from "axios";
import type { WorkspaceRole } from "@appsmith/constants/workspaceConstants";

export interface FetchAllAppUsersRequest {
  applicationId: string;
}

export interface FetchAllAppUsersResponse extends ApiResponse {
  data: WorkspaceRole[];
}

export interface FetchAllAppRolesRequest {
  applicationId: string;
}

export interface FetchAllAppRolesResponse extends ApiResponse {
  data: {
    description: string;
    autoCreated: boolean;
    type: string;
    name: string;
  }[];
}

export interface InviteUserToAppRequest {
  usernames: string[];
  groups: string[];
  applicationId: string;
  roleType: string;
}

export interface DeleteApplicationUserRequest {
  applicationId: string;
  username: string;
  userGroupId?: string;
}

export interface ChangeAppUserRoleRequest {
  applicationId: string;
  newRole: string;
  username: string;
  userGroupId?: string;
}

export class ApplicationApi extends CE_ApplicationApi {
  static async fetchApplicationUsers(
    request: FetchAllAppUsersRequest,
  ): Promise<AxiosPromise<FetchAllAppUsersResponse>> {
    return Api.get(
      `${ApplicationApi.baseURL}/${request.applicationId}/members`,
    );
  }

  static async fetchApplicationRoles(
    request: FetchAllAppRolesRequest,
  ): Promise<AxiosPromise<FetchAllAppRolesResponse>> {
    return Api.get(`${ApplicationApi.baseURL}/${request.applicationId}/roles`);
  }

  static async inviteUsersToApplication(
    request: InviteUserToAppRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.post(`${ApplicationApi.baseURL}/invite`, request);
  }

  static async deleteApplicationUser(
    request: DeleteApplicationUserRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.put(`${ApplicationApi.baseURL}/${request.applicationId}/role`, {
      ...(request.userGroupId
        ? { userGroupId: request.userGroupId }
        : { username: request.username }),
    });
  }

  static async changeApplicationUserRole(
    request: ChangeAppUserRoleRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.put(`${ApplicationApi.baseURL}/${request.applicationId}/role`, {
      ...(request.userGroupId
        ? { userGroupId: request.userGroupId }
        : { username: request.username }),
      newRole: request.newRole,
    });
  }

  static async fetchDefaultApplicationRoles(): Promise<
    AxiosPromise<ApiResponse>
  > {
    return Api.get(`${ApplicationApi.baseURL}/defaultRoles`);
  }
}

export default ApplicationApi;
