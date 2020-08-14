import { AxiosPromise } from "axios";
import Api from "./Api";
import { ApiResponse } from "./ApiResponses";
import { OrgRole, Org } from "constants/orgConstants";

export interface FetchOrgRolesResponse extends ApiResponse {
  data: OrgRole[];
}

export interface FetchOrgsResponse extends ApiResponse {
  data: Org[];
}
export interface FetchOrgResponse extends ApiResponse {
  data: Org;
}

export interface FetchAllUsersResponse extends ApiResponse {
  data: OrgRole[];
}

export interface FetchAllRolesResponse extends ApiResponse {
  data: Org[];
}

export interface FetchOrgRequest {
  orgId: string;
}

export interface FetchAllUsersRequest {
  orgId: string;
}

export interface ChangeUserRoleRequest {
  orgId: string;
  role: string;
  username: string;
}

export interface DeleteOrgUserRequest {
  orgId: string;
  username: string;
}

export interface FetchAllRolesRequest {
  orgId: string;
}

export interface SaveOrgRequest {
  id: string;
  name: string;
  website: string;
}

export interface CreateOrgRequest {
  name: string;
}

class OrgApi extends Api {
  static rolesURL = "v1/groups";
  static orgsURL = "v1/organizations";
  static fetchRoles(): AxiosPromise<FetchOrgRolesResponse> {
    return Api.get(OrgApi.rolesURL);
  }
  static fetchOrgs(): AxiosPromise<FetchOrgsResponse> {
    return Api.get(OrgApi.orgsURL);
  }
  static fetchOrg(request: FetchOrgRequest): AxiosPromise<FetchOrgResponse> {
    return Api.get(OrgApi.orgsURL + "/" + request.orgId);
  }
  static saveOrg(request: SaveOrgRequest): AxiosPromise<ApiResponse> {
    return Api.put(OrgApi.orgsURL + "/" + request.id, request);
  }
  static createOrg(request: CreateOrgRequest): AxiosPromise<ApiResponse> {
    return Api.post(OrgApi.orgsURL, request);
  }
  static fetchAllUsers(
    request: FetchAllUsersRequest,
  ): AxiosPromise<FetchAllUsersResponse> {
    return Api.get(OrgApi.orgsURL + "/" + request.orgId + "/members");
  }
  static fetchAllRoles(
    request: FetchAllRolesRequest,
  ): AxiosPromise<FetchAllRolesResponse> {
    return Api.get(OrgApi.orgsURL + `/roles?organizationId=${request.orgId}`);
  }
  static changeOrgUserRole(
    request: ChangeUserRoleRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.put(OrgApi.orgsURL + "/" + request.orgId + "/role", {
      username: request.username,
      roleName: request.role,
    });
  }
  static deleteOrgUser(
    request: DeleteOrgUserRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.put(OrgApi.orgsURL + "/" + request.orgId + "/role", {
      username: request.username,
      roleName: null,
    });
  }
}
export default OrgApi;
