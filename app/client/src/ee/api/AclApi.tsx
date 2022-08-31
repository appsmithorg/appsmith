import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "api/ApiResponses";
import { uniqueId } from "lodash";

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

export class AclApi extends Api {
  static aclUsersURL = "/mockUsers";
  static aclGroupsURL = "/mockGroups";
  static aclRolesURL = "/mockRoles";

  static async fetchAclUsers(): Promise<AxiosPromise<ApiResponse>> {
    const testRes = await Api.get(AclApi.aclUsersURL, "", { baseURL: "/" });
    return testRes;
    // const response = Api.get(AclApi.aclUsersURL, "", { baseURL: "/" });
    // return response;
  }

  static async fetchSingleAclUser(
    payload: FetchSingleDataPayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    const res = await Api.get(`${AclApi.aclUsersURL}/${payload.id}`, "", {
      baseURL: "/",
    });
    return res;
    // return Api.get(`${AclApi.aclUsersURL}/${payload.id}`, "", { baseURL: "/" });
    // const response = Api.get(AclApi.aclUsersURL, "", { baseURL: "/" });
    // const result = response.then((data) => {
    //   const user = data.data.find((user: any) => user?.userId === payload.id);
    //   return { responseMeta: { status: 200, success: true }, data: user };
    // });
    // return result;
  }

  static createAclUser(request: any): AxiosPromise<ApiResponse> {
    return Api.post(AclApi.aclUsersURL, request, { baseURL: "/" });
  }

  static updateAclUser(request: any): AxiosPromise<ApiResponse> {
    return Api.patch(AclApi.aclUsersURL, request, { baseURL: "/" });
  }

  static deleteAclUser(id: string): Promise<ApiResponse> {
    // return Api.delete(AclApi.aclUsersURL, id, { baseURL: "/" });
    const response = Api.get(AclApi.aclUsersURL, "", { baseURL: "/" });
    const result = response.then((data) => {
      const user = data.data.filter((user: any) => user?.userId !== id);
      return { responseMeta: { status: 200, success: true }, data: user };
    });
    return result;
  }

  static async fetAclGroups(): Promise<AxiosPromise<ApiResponse>> {
    const testRes = await Api.get(AclApi.aclGroupsURL, "", { baseURL: "/" });
    return testRes;
    // return Api.get(AclApi.aclGroupsURL, "", { baseURL: "/" });
  }

  static async fetchSingleAclGroup(
    payload: FetchSingleDataPayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    // return Api.get(`${AclApi.aclUsersURL}/${payload.id}`, "", { baseURL: "/" });
    const response = await Api.get(`${AclApi.aclGroupsURL}/${payload.id}`, "", {
      baseURL: "/",
    });
    return response;
    // const result = response.then((data) => {
    //   const userGroup = data.data.find(
    //     (userGroup: any) => userGroup?.id === payload.id,
    //   );
    //   return { responseMeta: { status: 200, success: true }, data: userGroup };
    // });
    // return result;
  }

  static createAclGroup(request: any): AxiosPromise<ApiResponse> {
    return Api.post(AclApi.aclGroupsURL, request, { baseURL: "/" });
  }

  static updateAclGroup(request: any): AxiosPromise<ApiResponse> {
    return Api.put(AclApi.aclGroupsURL, request, { baseURL: "/" });
  }

  static cloneAclGroup(payload: any): Promise<ApiResponse> {
    // return Api.post(AclApi.aclGroupsURL, request, { baseURL: "/" });
    const response = Api.get(AclApi.aclGroupsURL, "", {
      baseURL: "/",
    });
    const clonedData = {
      ...payload,
      id: uniqueId("ug"),
      rolename: `Copy of ${payload.rolename}`,
    };
    const result = response.then((data) => {
      const updatedResponse = [...data.data, clonedData];
      return {
        responseMeta: { status: 200, success: true },
        data: updatedResponse,
      };
    });
    return result;
  }

  static deleteAclGroup(id: string): Promise<ApiResponse> {
    // return Api.delete(AclApi.aclGroupsURL, id, { baseURL: "/" });
    const response = Api.get(AclApi.aclGroupsURL, "", { baseURL: "/" });
    const result = response.then((data) => {
      const userGroup = data.data.filter(
        (userGroup: any) => userGroup?.id !== id,
      );
      return { responseMeta: { status: 200, success: true }, data: userGroup };
    });
    return result;
  }

  static async fetchAclRoles(): Promise<AxiosPromise<ApiResponse>> {
    const testRes = await Api.get(AclApi.aclRolesURL, "", {
      baseURL: "/",
    });
    return testRes;
    // return Api.get(AclApi.aclRolesURL, "", {
    //   baseURL: "/",
    // });
  }

  static async fetchSingleRole(
    payload: FetchSingleDataPayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    // return Api.get(`${AclApi.aclUsersURL}/${payload.id}`, "", { baseURL: "/" });
    const response = await Api.get(`${AclApi.aclRolesURL}/${payload.id}`, "", {
      baseURL: "/",
    });
    return response;
    // const result = response.then((data) => {
    //   const permissionGroup = data.data.find(
    //     (permissionGroup: any) => permissionGroup?.id === payload.id,
    //   );
    //   return {
    //     responseMeta: { status: 200, success: true },
    //     data: permissionGroup,
    //   };
    // });
    // return result;
  }

  static createAclRole(request: any): AxiosPromise<ApiResponse> {
    return Api.post(AclApi.aclRolesURL, request, { baseURL: "/" });
  }

  static updateAclRole(request: any): AxiosPromise<ApiResponse> {
    return Api.put(AclApi.aclRolesURL, request, { baseURL: "/" });
  }

  static cloneAclRole(payload: any): Promise<ApiResponse> {
    // return Api.post(AclApi.aclRolesURL, request, { baseURL: "/" });
    const response = Api.get(AclApi.aclRolesURL, "", {
      baseURL: "/",
    });
    const clonedData = {
      ...payload,
      id: uniqueId("pg"),
      permissionName: `Copy of ${payload.permissionName}`,
    };
    const result = response.then((data) => {
      const updatedResponse = [...data.data, clonedData];
      return {
        responseMeta: { status: 200, success: true },
        data: updatedResponse,
      };
    });
    return result;
  }

  static deleteAclRole(id: string): Promise<ApiResponse> {
    // return Api.delete(AclApi.aclRolesURL, id, { baseURL: "/" });
    const response = Api.get(AclApi.aclRolesURL, "", {
      baseURL: "/",
    });
    const result = response.then((data) => {
      const permissionGroup = data.data.filter(
        (permissionGroup: any) => permissionGroup?.id !== id,
      );
      return {
        responseMeta: { status: 200, success: true },
        data: permissionGroup,
      };
    });
    return result;
  }
}

export default AclApi;
