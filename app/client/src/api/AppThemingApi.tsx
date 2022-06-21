import API from "api/Api";
import { AxiosPromise } from "axios";
import { AppTheme } from "entities/AppTheming";
import { ApiResponse } from "./ApiResponses";

class AppThemingApi extends API {
  static baseUrl = "/v1";

  /**
   * fires api to get all themes
   *
   * @returns
   */
  static fetchThemes(
    applicationId: string,
  ): AxiosPromise<ApiResponse<AppTheme[]>> {
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
  static fetchSelected(
    applicationId: string,
    mode = "EDIT",
  ): AxiosPromise<ApiResponse<AppTheme[]>> {
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
  static updateTheme(
    applicationId: string,
    theme: AppTheme,
  ): AxiosPromise<ApiResponse<AppTheme[]>> {
    return API.put(
      `${AppThemingApi.baseUrl}/themes/applications/${applicationId}`,
      theme,
    );
  }

  /**
   * fires api to updating current theme
   *
   * @param applicationId
   * @param theme
   * @returns
   */
  static changeTheme(
    applicationId: string,
    theme: AppTheme,
  ): AxiosPromise<ApiResponse<AppTheme[]>> {
    return API.patch(
      `${AppThemingApi.baseUrl}/applications/${applicationId}/themes/${theme.id}`,
      theme,
    );
  }

  /**
   * fires api for saving current theme
   *
   * @param applicationId
   * @param theme
   * @returns
   */
  static saveTheme(
    applicationId: string,
    payload: { name: string },
  ): AxiosPromise<ApiResponse<AppTheme[]>> {
    return API.patch(
      `${AppThemingApi.baseUrl}/themes/applications/${applicationId}`,
      payload,
    );
  }

  /**
   * fires api for deleting theme
   *
   * @param applicationId
   * @param theme
   * @returns
   */
  static deleteTheme(themeId: string): AxiosPromise<ApiResponse<AppTheme[]>> {
    return API.delete(`${AppThemingApi.baseUrl}/themes/${themeId}`);
  }
}

export default AppThemingApi;
