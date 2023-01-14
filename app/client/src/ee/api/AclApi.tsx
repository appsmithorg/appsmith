import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "api/ApiResponses";
import { uniqueId } from "lodash";
import {
  BaseAclProps,
  UpdateRoleData,
} from "@appsmith/pages/AdminSettings/AccessControl/types";

export interface FetchAclUsersResponse extends ApiResponse {
  id: string;
}

export interface CreateUserResponse extends ApiResponse {
  email: string;
  id: string;
}

export interface FetchSingleDataPayload {
  id: string;
}

export type RoleResponsePayload = BaseAclProps & {
  assignedToGroupIds: string[];
  assignedToUserIds: string[];
  new?: boolean;
  permissions: {
    documentId: string;
    aclPermission: string;
  }[];
  tenantId: string;
  userPermissions: string[];
  isSaving: boolean;
};

export type RoleResponse = ApiResponse<RoleResponsePayload>;

export type GroupResponsePayload = BaseAclProps & {
  new?: boolean;
  tenantId: string;
  userPermissions: string[];
  users: string[];
  roles: BaseAclProps[];
};

export type GroupResponse = ApiResponse<GroupResponsePayload>;

export type UpdateGroupsInUserRequestPayload = {
  userId: string;
  usernames: string[];
  groupsAdded: BaseAclProps[];
  groupsRemoved: BaseAclProps[];
};

export type UpdateRolesInUserRequestPayload = {
  users: { id: string; username: string }[];
  rolesAdded: BaseAclProps[];
  rolesRemoved: BaseAclProps[];
};

export type UpdateRolesInGroupRequestPayload = {
  groups: BaseAclProps[];
  rolesAdded: BaseAclProps[];
  rolesRemoved: BaseAclProps[];
};

export type UpdateRoleRequestPayload = {
  tabName: string;
  entitiesChanged: UpdateRoleData;
  roleId: string;
};

export class AclApi extends Api {
  static users = "/v1/users";
  static roles = "/v1/roles";
  static userGroups = "/v1/user-groups";
  static inviteViaRoles = "/v1/roles/assign";
  static inviteViaGroups = "/v1/user-groups/for-invite";
  static iconLocation = "/v1/plugins/icon-location";

  static async fetchAclUsers(): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.get(`${AclApi.users}/manage/all`);
    return response;
  }

  static async fetchSingleAclUser(
    payload: FetchSingleDataPayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.get(`${AclApi.users}/manage/${payload.id}`);
    return response;
  }

  static async deleteAclUser(
    payload: FetchSingleDataPayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.delete(`${AclApi.users}/id/${payload.id}`);
    return response;
  }

  static async updateGroupsInUser(
    payload: UpdateGroupsInUserRequestPayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    const groupsAdded = payload.groupsAdded.map((g) => g.id);
    const groupsRemoved = payload.groupsRemoved.map((g) => g.id);
    const response = await Api.put(`${AclApi.userGroups}/users`, {
      usernames: payload.usernames,
      groupsAdded,
      groupsRemoved,
    });
    return response;
  }

  static async updateRolesInUser(
    payload: UpdateRolesInUserRequestPayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.put(`${AclApi.roles}/associate`, payload);
    return response;
  }

  static async fetchAclRoles(): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.get(AclApi.roles);
    return response;
  }

  static async fetchSingleRole(
    payload: FetchSingleDataPayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.get(`${AclApi.roles}/configure/${payload.id}`);
    return response;
  }

  static async updateAclRole(
    payload: UpdateRoleRequestPayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.put(
      `${AclApi.roles}/configure/${payload.roleId}`,
      {
        tabName: payload.tabName,
        entitiesChanged: payload.entitiesChanged,
      },
    );
    return response;
  }

  static async createAclRole(request: any): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.post(AclApi.roles, request);
    return response;
  }

  static async updateAclRoleName(
    payload: any,
  ): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.put(`${AclApi.roles}/${payload.id}`, {
      name: payload.name,
      description: payload.description,
    });
    return response;
  }

  static async deleteAclRole(
    payload: FetchSingleDataPayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.delete(`${AclApi.roles}/${payload.id}`);
    return response;
  }

  static async cloneAclRole(payload: any): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.get(AclApi.roles);
    const clonedData = {
      ...payload,
      id: uniqueId("pg"),
      name: `Copy of ${payload.name}`,
    };
    const updatedResponse = [...response.data, clonedData];
    response.data = updatedResponse;
    return response;
  }

  static async fetchAclGroups(): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.get(AclApi.userGroups);
    return response;
  }

  static async fetchSingleAclGroup(
    payload: FetchSingleDataPayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.get(`${AclApi.userGroups}/${payload.id}`);
    return response;
  }

  static async createAclGroup(
    request: any,
  ): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.post(AclApi.userGroups, request);
    return response;
  }

  static async updateAclGroupName(
    payload: any,
  ): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.put(`${AclApi.userGroups}/${payload.id}`, {
      name: payload.name,
      description: payload.description,
    });
    return response;
  }

  static async updateRolesInGroup(
    payload: UpdateRolesInGroupRequestPayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.put(`${AclApi.roles}/associate`, payload);
    return response;
  }

  static async deleteAclGroup(
    payload: FetchSingleDataPayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.delete(`${AclApi.userGroups}/${payload.id}`);
    return response;
  }

  static async cloneAclGroup(payload: any): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.get(AclApi.userGroups);
    const clonedData = {
      ...payload,
      id: uniqueId("pg"),
      name: `Copy of ${payload.name}`,
    };
    const updatedResponse = [...response.data, clonedData];
    response.data = updatedResponse;
    return response;
  }

  static async addUsersInSelectedGroup(
    payload: any,
  ): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.post(`${AclApi.userGroups}/invite`, payload);
    return response;
  }

  static async removeUsersFromSelectedGroup(
    payload: any,
  ): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.post(
      `${AclApi.userGroups}/removeUsers`,
      payload,
    );
    return response;
  }

  static async fetchRolesForInvite(): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.get(AclApi.inviteViaRoles);
    return response;
  }

  static async fetchGroupsForInvite(): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.get(AclApi.inviteViaGroups);
    return response;
  }

  static async inviteUsersViaRoles(
    payload: any,
  ): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.put(`${AclApi.roles}/associate`, payload);
    return response;
  }

  static async inviteUsersViaGroups(
    payload: any,
  ): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.post(`${AclApi.userGroups}/invite`, payload);
    return response;
  }

  static async fetchIconLocation(): Promise<AxiosPromise<ApiResponse>> {
    const response = await Api.get(AclApi.iconLocation);
    return response;
  }
}

export default AclApi;
