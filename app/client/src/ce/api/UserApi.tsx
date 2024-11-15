import type { AxiosPromise } from "axios";
import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";
import type { FeatureFlags } from "ee/entities/FeatureFlag";
import type { ProductAlert } from "../../reducers/uiReducers/usersReducer";

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

export interface LeaveWorkspaceRequest {
  workspaceId: string;
}

export interface InviteUserRequest {
  email: string;
  groupIds: string[];
  status?: string;
  recaptchaToken?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  proficiency?: string;
  useCase?: string;
  intercomConsentGiven?: boolean;
}

export interface SendTestEmailPayload {
  smtpHost: string;
  fromEmail: string;
  smtpPort?: string;
  username?: string;
  password?: string;
}

export class UserApi extends Api {
  static usersURL = "v1/users";
  static productAlertURL = "v1/product-alert/alert";
  static forgotPasswordURL = `${UserApi.usersURL}/forgotPassword`;
  static verifyResetPasswordTokenURL = `${UserApi.usersURL}/verifyPasswordResetToken`;
  static resetPasswordURL = `${UserApi.usersURL}/resetPassword`;
  static resendEmailVerificationURL = `${UserApi.usersURL}/resendEmailVerification`;
  static inviteUserURL = "v1/users/invite";
  static verifyInviteTokenURL = `${UserApi.inviteUserURL}/verify`;
  static confirmUserInviteURL = `${UserApi.inviteUserURL}/confirm`;
  static leaveWorkspaceURL = `${UserApi.usersURL}/leaveWorkspace`;
  static logoutURL = "v1/logout";
  static currentUserURL = "v1/users/me";
  static photoURL = "v1/users/photo";
  static featureFlagsURL = "v1/users/features";
  static adminSettingsURL = "v1/admin/env";
  static restartServerURL = "v1/admin/restart";
  static sendTestEmailURL = "/v1/admin/send-test-email";

  static async updateUser(
    request: UpdateUserRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.put(UserApi.usersURL, request);
  }

  static async getCurrentUser(): Promise<AxiosPromise<ApiResponse>> {
    return Api.get(UserApi.currentUserURL);
  }

  static async forgotPassword(
    request: ForgotPasswordRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.post(UserApi.forgotPasswordURL, request);
  }

  static async verifyResetPasswordToken(
    request: VerifyTokenRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.get(UserApi.verifyResetPasswordTokenURL, request);
  }

  static async resetPassword(
    request: TokenPasswordUpdateRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.put(UserApi.resetPasswordURL, request);
  }

  static async inviteUser(
    request: InviteUserRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    const { recaptchaToken, ...requestPayload } = request;

    return Api.post(
      UserApi.inviteUserURL,
      requestPayload,
      undefined,
      recaptchaToken
        ? {
            params: { recaptchaToken },
          }
        : {},
    );
  }

  static async verifyUserInvite(
    request: VerifyTokenRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.get(UserApi.verifyInviteTokenURL, request);
  }

  static async confirmInvitedUserSignup(
    request: TokenPasswordUpdateRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.put(UserApi.confirmUserInviteURL, request);
  }

  static async logoutUser(): Promise<AxiosPromise<ApiResponse>> {
    return Api.post(UserApi.logoutURL);
  }

  static async uploadPhoto(request: { file: File }): Promise<
    AxiosPromise<{
      id: string;
      new: boolean;
      profilePhotoAssetId: string;
      recentlyUsedWorkspaceIds: string[];
    }>
  > {
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

  static async deletePhoto(): Promise<AxiosPromise<ApiResponse>> {
    return Api.delete(UserApi.photoURL);
  }

  static async leaveWorkspace(
    request: LeaveWorkspaceRequest,
  ): Promise<AxiosPromise<LeaveWorkspaceRequest>> {
    return Api.put(UserApi.leaveWorkspaceURL + "/" + request.workspaceId);
  }

  static async fetchFeatureFlags(): Promise<
    AxiosPromise<ApiResponse<FeatureFlags>>
  > {
    return Api.get(UserApi.featureFlagsURL);
  }

  /*
   * Super user endpoints
   */

  static async fetchAdminSettings(): Promise<AxiosPromise<ApiResponse>> {
    return Api.get(UserApi.adminSettingsURL);
  }

  static async saveAdminSettings(
    request: Record<string, string>,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.put(UserApi.adminSettingsURL, request);
  }

  static async restartServer(): Promise<AxiosPromise<ApiResponse>> {
    return Api.post(UserApi.restartServerURL);
  }

  static async sendTestEmail(
    payload: SendTestEmailPayload,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.post(UserApi.sendTestEmailURL, payload);
  }

  static async getProductAlert(): Promise<
    AxiosPromise<ApiResponse<ProductAlert>>
  > {
    return Api.get(UserApi.productAlertURL);
  }

  static async resendEmailVerification(email: string) {
    return Api.post(UserApi.resendEmailVerificationURL, { email });
  }
}

export default UserApi;
