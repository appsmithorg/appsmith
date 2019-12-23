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

export interface FetchOrgRequest {
  orgId: string;
}

export interface SaveOrgRequest {
  id: string;
  name: string;
  website: string;
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
}

export default OrgApi;
