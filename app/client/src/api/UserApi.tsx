import { AxiosPromise } from "axios";
import Api from "./Api";
import { ApiResponse } from "./ApiResponses";

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
}

export interface CreateUserResponse extends ApiResponse {
  email: string;
  id: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface TokenPasswordUpdateRequest {
  token: string;
  password: string;
  email: string;
}

export interface VerifyTokenRequest {
  email: string;
  token: string;
}

export interface FetchUserResponse extends ApiResponse {
  id: string;
}

export interface FetchUserRequest {
  id: string;
}

export interface InviteUserRequest {
  email: string;
  groupIds: string[];
  status?: string;
}

export interface UpdateUserRequest {
  name: string;
}

class UserApi extends Api {
  static usersURL = "v1/users";
  static forgotPasswordURL = `${UserApi.usersURL}/forgotPassword`;
  static verifyResetPasswordTokenURL = `${UserApi.usersURL}/verifyPasswordResetToken`;
  static resetPasswordURL = `${UserApi.usersURL}/resetPassword`;
  static inviteUserURL = "v1/users/invite";
  static verifyInviteTokenURL = `${UserApi.inviteUserURL}/verify`;
  static confirmUserInviteURL = `${UserApi.inviteUserURL}/confirm`;
  static addOrgURL = `${UserApi.usersURL}/addOrganization`;
  static logoutURL = "v1/logout";
  static currentUserURL = "v1/users/me";

  static createUser(
    request: CreateUserRequest,
  ): AxiosPromise<CreateUserResponse> {
    return Api.post(UserApi.usersURL, request);
  }

  static updateUser(request: UpdateUserRequest): AxiosPromise<ApiResponse> {
    return Api.put(UserApi.usersURL, request);
  }

  static fetchUser(request: FetchUserRequest): AxiosPromise<FetchUserResponse> {
    return Api.get(UserApi.usersURL + "/" + request.id);
  }

  static getCurrentUser(): AxiosPromise<ApiResponse> {
    return Api.get(UserApi.currentUserURL);
  }

  static forgotPassword(
    request: ForgotPasswordRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.post(UserApi.forgotPasswordURL, request);
  }

  static verifyResetPasswordToken(
    request: VerifyTokenRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.get(UserApi.verifyResetPasswordTokenURL, request);
  }

  static resetPassword(
    request: TokenPasswordUpdateRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.put(UserApi.resetPasswordURL, request);
  }

  static inviteUser(request: InviteUserRequest): AxiosPromise<ApiResponse> {
    return Api.post(UserApi.inviteUserURL, request);
  }

  static verifyUserInvite(
    request: VerifyTokenRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.get(UserApi.verifyInviteTokenURL, request);
  }

  static confirmInvitedUserSignup(
    request: TokenPasswordUpdateRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.put(UserApi.confirmUserInviteURL, request);
  }

  static logoutUser(): AxiosPromise<ApiResponse> {
    return Api.post(UserApi.logoutURL);
  }
}

export default UserApi;
