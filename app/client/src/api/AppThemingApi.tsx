import API from "api/Api";
import type { AxiosPromise } from "axios";
import type { AppTheme } from "entities/AppTheming";
import type { ApiResponse } from "./ApiResponses";

class AppThemingApi extends API {
  static baseUrl = "/v1";

  /**
   * fires api to get all themes
   *
   * @returns
   */
  static async fetchThemes(
    applicationId: string,
  ): Promise<AxiosPromise<ApiResponse<AppTheme[]>>> {
    return API.get(
      `${AppThemingApi.baseUrl}/themes/applications/${applicationId}`,
    );
  }

  /**
   * fires api to fetch selected theme
   *
   * @param applicationId
   * @returns
   */
  static async fetchSelected(
    applicationId: string,
    mode = "EDIT",
  ): Promise<AxiosPromise<ApiResponse<AppTheme[]>>> {
    return API.get(
      `${AppThemingApi.baseUrl}/themes/applications/${applicationId}/current?mode=${mode}`,
    );
  }

  /**
   * fires api to updating current theme
   *
   * @param applicationId
   * @param theme
   * @returns
   */
  static async updateTheme(
    applicationId: string,
    theme: AppTheme,
  ): Promise<AxiosPromise<ApiResponse<AppTheme[]>>> {
    const payload = {
      ...theme,
      new: undefined,
    };

    return API.put(
      `${AppThemingApi.baseUrl}/themes/applications/${applicationId}`,
      payload,
    );
  }

  /**
   * fires api to updating current theme
   *
   * @param applicationId
   * @param theme
   * @returns
   */
  static async changeTheme(
    applicationId: string,
    theme: AppTheme,
  ): Promise<AxiosPromise<ApiResponse<AppTheme[]>>> {
    return API.patch(
      `${AppThemingApi.baseUrl}/applications/${applicationId}/themes/${theme.id}`,
      theme,
    );
  }

  /**
   * fires api for deleting theme
   *
   * @param applicationId
   * @param theme
   * @returns
   */
  static async deleteTheme(
    themeId: string,
  ): Promise<AxiosPromise<ApiResponse<AppTheme[]>>> {
    return API.delete(`${AppThemingApi.baseUrl}/themes/${themeId}`);
  }
}

export default AppThemingApi;
