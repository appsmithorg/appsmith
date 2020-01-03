import { AxiosPromise } from "axios";
import Api from "./Api";
import { ApiResponse } from "./ApiResponses";
import { getAppsmithConfigs } from "configs";

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

export interface ResetPasswordRequest {
  token: string;
  user: {
    password: string;
    email: string;
  };
}

export interface ResetPasswordVerifyTokenRequest {
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

class UserApi extends Api {
  //TODO(abhinav): make a baseURL, to which the other paths are added.
  static createURL = "v1/users";
  static forgotPasswordURL = "v1/users/forgotPassword";
  static verifyResetPasswordTokenURL = "v1/users/verifyPasswordResetToken";
  static resetPasswordURL = "v1/users/resetPassword";
  static fetchUserURL = "v1/users";
  static inviteUserURL = "v1/users/invite";
  static logoutURL = "/logout";
  static createUser(
    request: CreateUserRequest,
  ): AxiosPromise<CreateUserResponse> {
    return Api.post(UserApi.createURL, request);
  }

  static forgotPassword(
    request: ForgotPasswordRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.get(UserApi.forgotPasswordURL, request);
  }

  static resetPassword(
    request: ResetPasswordRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.put(UserApi.resetPasswordURL, request);
  }

  static verifyResetPasswordToken(
    request: ResetPasswordVerifyTokenRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.get(UserApi.verifyResetPasswordTokenURL, request);
  }

  static fetchUser(request: FetchUserRequest): AxiosPromise<FetchUserResponse> {
    return Api.get(UserApi.fetchUserURL + "/" + request.id);
  }

  static inviteUser(request: InviteUserRequest): AxiosPromise<ApiResponse> {
    request.status = "INVITED";
    return Api.post(UserApi.inviteUserURL, request);
  }

  static logoutUser(): AxiosPromise<ApiResponse> {
    const { baseUrl } = getAppsmithConfigs();
    return Api.post(UserApi.logoutURL, undefined, undefined, {
      baseURL: baseUrl,
      withCredentials: true,
    });
  }
}

export default UserApi;
