import type { AxiosPromise } from "axios";
import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";
import type { FeatureFlags } from "@appsmith/entities/FeatureFlag";
import type { ProductAlert } from "../../reducers/uiReducers/usersReducer";

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
}

export type CreateUserResponse = ApiResponse & {
  email: string;
  id: string;
};

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

export type FetchUserResponse = ApiResponse & {
  id: string;
};

export interface FetchUserRequest {
  id: string;
}

export interface LeaveWorkspaceRequest {
  workspaceId: string;
}

export interface InviteUserRequest {
  email: string;
  groupIds: string[];
  status?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  proficiency?: string;
  role?: string;
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
  static addWorkspaceURL = `${UserApi.usersURL}/addWorkspace`;
  static leaveWorkspaceURL = `${UserApi.usersURL}/leaveWorkspace`;
  static logoutURL = "v1/logout";
  static currentUserURL = "v1/users/me";
  static photoURL = "v1/users/photo";
  static featureFlagsURL = "v1/users/features";
  static superUserURL = "v1/users/super";
  static adminSettingsURL = "v1/admin/env";
  static restartServerURL = "v1/admin/restart";
  static downloadConfigURL = "v1/admin/env/download";
  static sendTestEmailURL = "/v1/admin/send-test-email";

  static async createUser(
    request: CreateUserRequest,
  ): Promise<AxiosPromise<CreateUserResponse>> {
    return Api.post(UserApi.usersURL, request);
  }

  static async updateUser(
    request: UpdateUserRequest,
  ): Promise<AxiosPromise<ApiResponse>> {
    return Api.put(UserApi.usersURL, request);
  }

  static async fetchUser(
    request: FetchUserRequest,
  ): Promise<AxiosPromise<FetchUserResponse>> {
    return Api.get(UserApi.usersURL + "/" + request.id);
  }

  static async getCurrentUser(): Promise<AxiosPromise<ApiResponse>> {
    // api/v1/users/me

    return {
      responseMeta: {
        status: 200,
        success: true,
      },
      data: {
        email: "vamsi@appsmith.com",
        username: "vamsi@appsmith.com",
        name: "SuryaVamsi Vemparala",
        useCase: "just exploring",
        enableTelemetry: true,
        roles: [
          "Upgrade to business edition to access roles and groups for conditional business logic",
        ],
        groups: [
          "Upgrade to business edition to access roles and groups for conditional business logic",
        ],
        accountNonExpired: true,
        accountNonLocked: true,
        credentialsNonExpired: true,
        emptyInstance: false,
        isAnonymous: false,
        isEnabled: true,
        isSuperUser: true,
        isConfigurable: true,
        adminSettingsVisible: false,
        isIntercomConsentGiven: false,
      },
      errorDisplay: "",
    };
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
    return Api.post(UserApi.inviteUserURL, request);
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
    // users/features
    return {
      responseMeta: {
        status: 200,
        success: true,
      },
      data: {
        license_git_unlimited_repo_enabled: false,
        license_sso_saml_enabled: false,
        ab_gsheet_schema_enabled: true,
        deprecate_custom_fusioncharts_enabled: true,
        ab_ds_binding_enabled: true,
        ask_ai_js: false,
        license_connection_pool_size_enabled: false,
        release_show_new_sidebar_pages_pane_enabled: false,
        release_widgetdiscovery_enabled: true,
        release_embed_hide_share_settings_enabled: true,
        ab_create_new_apps_enabled: true,
        ab_show_templates_instead_of_blank_canvas_enabled: true,
        ab_ai_js_function_completion_enabled: true,
        release_git_connect_v2_enabled: true,
        release_workflows_enabled: false,
        license_scim_enabled: false,
        ask_ai: false,
        license_audit_logs_enabled: false,
        license_gac_enabled: false,
        ask_ai_sql: false,
        release_show_partial_import_export_enabled: true,
        release_query_module_enabled: true,
        release_server_dsl_migrations_enabled: false,
        ab_mock_mongo_schema_enabled: true,
        ab_one_click_learning_popover_enabled: false,
        ab_ds_schema_enabled: true,
        release_git_autocommit_feature_enabled: true,
        release_app_sidebar_enabled: true,
        release_anvil_enabled: false,
        license_branding_enabled: false,
        ab_onboarding_flow_start_with_data_dev_only_enabled: false,
        license_git_branch_protection_enabled: false,
        release_table_serverside_filtering_enabled: false,
        license_session_limit_enabled: false,
        release_show_new_sidebar_announcement_enabled: false,
        release_custom_widgets_enabled: true,
        rollout_app_sidebar_enabled: false,
        rollout_datasource_test_rate_limit_enabled: true,
        license_scheduled_backup_enabled: false,
        ab_ai_button_sql_enabled: true,
        ab_wds_enabled: false,
        license_message_listener_enabled: false,
        release_custom_echarts_enabled: true,
        release_git_status_lite_enabled: false,
        license_custom_environments_enabled: false,
        release_appnavigationlogoupload_enabled: true,
        license_pac_enabled: false,
        license_private_embeds_enabled: false,
        ab_gif_signposting_enabled: false,
        release_show_publish_app_to_community_enabled: true,
        ab_env_walkthrough_enabled: false,
        release_datasource_environments_enabled: false,
        release_knowledge_base_enabled: false,
        license_widget_rtl_support_enabled: false,
        release_git_branch_protection_enabled: true,
        license_sso_oidc_enabled: false,
      },
      errorDisplay: "",
    };
  }

  static async createSuperUser(
    request: CreateSuperUserRequest,
  ): Promise<AxiosPromise<CreateUserResponse>> {
    return Api.post(UserApi.superUserURL, request);
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
