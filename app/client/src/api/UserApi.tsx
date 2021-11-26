import { AxiosPromise } from "axios";
import Api from "api/Api";
import { ApiResponse } from "./ApiResponses";
import { CommentsOnboardingState } from "../constants/userConstants";

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

export interface LeaveOrgRequest {
  orgId: string;
}

export interface InviteUserRequest {
  email: string;
  groupIds: string[];
  status?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
  useCase?: string;
}

export interface CommentsOnboardingStateRequest {
  commentOnboardingState: CommentsOnboardingState;
}

export interface CreateSuperUserRequest {
  email: string;
  name: string;
  source: "FORM";
  state: "ACTIVATED";
  isEnabled: boolean;
  password: string;
  role: "Developer";
  companyName: string;
  allowCollectingAnonymousData: boolean;
  signupForNewsletter: boolean;
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
  static leaveOrgURL = `${UserApi.usersURL}/leaveOrganization`;
  static logoutURL = "v1/logout";
  static currentUserURL = "v1/users/me";
  static photoURL = "v1/users/photo";
  static featureFlagsURL = "v1/users/features";
  static superUserURL = "v1/users/super";
  static commentsOnboardingStateURL = `${UserApi.usersURL}/comment/state`;
  static adminSettingsURL = "v1/admin/env";
  static restartServerURL = "v1/admin/restart";
  static downloadConfigURL = "v1/admin/env/download";
  static sendTestEmailURL = "/v1/admin/send-test-email";

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

  static uploadPhoto(request: { file: File }): AxiosPromise<ApiResponse> {
    const formData = new FormData();
    if (request.file) {
      formData.append("file", request.file);
    }

    return Api.post(UserApi.photoURL, formData, null, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  static deletePhoto(): AxiosPromise<ApiResponse> {
    return Api.delete(UserApi.photoURL);
  }

  static leaveOrg(request: LeaveOrgRequest): AxiosPromise<LeaveOrgRequest> {
    return Api.put(UserApi.leaveOrgURL + "/" + request.orgId);
  }

  static fetchFeatureFlags(): AxiosPromise<ApiResponse> {
    return Api.get(UserApi.featureFlagsURL);
  }

  static createSuperUser(
    request: CreateSuperUserRequest,
  ): AxiosPromise<CreateUserResponse> {
    return Api.post(UserApi.superUserURL, request);
  }

  static updateUsersCommentOnboardingState(
    request: CommentsOnboardingStateRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.patch(UserApi.commentsOnboardingStateURL, request);
  }

  /*
   * Super user endpoints
   */

  static fetchAdminSettings(): AxiosPromise<ApiResponse> {
    return Api.get(UserApi.adminSettingsURL);
  }

  static saveAdminSettings(
    request: Record<string, string>,
  ): AxiosPromise<ApiResponse> {
    return Api.put(UserApi.adminSettingsURL, request);
  }

  static restartServer(): AxiosPromise<ApiResponse> {
    return Api.post(UserApi.restartServerURL);
  }

  static sendTestEmail(): AxiosPromise<ApiResponse> {
    return Api.post(UserApi.sendTestEmailURL);
  }
}

export default UserApi;
