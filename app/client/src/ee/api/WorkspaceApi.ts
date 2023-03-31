export * from "ce/api/WorkspaceApi";
import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";
import type { AxiosPromise } from "axios";
import { default as CE_WorkspaceApi } from "ce/api/WorkspaceApi";

export interface ChangeUserRoleRequest {
  workspaceId: string;
  newPermissionGroupId?: string;
  username: string;
  userGroupId?: string;
}

export interface DeleteWorkspaceUserRequest {
  workspaceId: string;
  username: string;
  userGroupId?: string;
}
class WorkspaceApi extends CE_WorkspaceApi {
  static fetchGroupSuggestionsURL = "/v1/user-groups/for-invite";

  static fetchGroupSuggestions(): AxiosPromise<ApiResponse> {
    return Api.get(WorkspaceApi.fetchGroupSuggestionsURL);
  }

  static changeWorkspaceUserRole(
    request: ChangeUserRoleRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.put(
      `${WorkspaceApi.workspacesURL}/${request.workspaceId}/permissionGroup`,
      {
        ...(request.userGroupId
          ? { userGroupId: request.userGroupId }
          : { username: request.username }),
        newPermissionGroupId: request.newPermissionGroupId,
      },
    );
  }

  static deleteWorkspaceUser(
    request: DeleteWorkspaceUserRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.put(
      `${WorkspaceApi.workspacesURL}/${request.workspaceId}/permissionGroup`,
      {
        ...(request.userGroupId
          ? { userGroupId: request.userGroupId }
          : { username: request.username }),
      },
    );
  }
}

export default WorkspaceApi;
