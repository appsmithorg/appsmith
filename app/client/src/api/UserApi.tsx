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

class UserApi extends Api {
  static createURL = "v1/users";
  static forgotPasswordURL = "v1/users/forgotPassword";
  static verifyResetPasswordTokenURL = "v1/users/verifyPasswordResetToken";
  static resetPasswordURL = "v1/users/resetPassword";
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
}

export default UserApi;
