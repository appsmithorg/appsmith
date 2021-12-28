import API from "api/Api";
import { AxiosPromise } from "axios";
import { AppTheme } from "entities/AppTheming";
import { GenericApiResponse } from "./ApiResponses";

class AppThemingApi extends API {
  static baseUrl = "/v1";

  /**
   * fires request to get all themes
   *
   * @returns
   */
  static fetchThemes(): AxiosPromise<GenericApiResponse<AppTheme[]>> {
    return API.get(`${AppThemingApi.baseUrl}/themes`);
  }

  /**
   * fires api to fetch selected theme
   *
   * @param applicationId
   * @returns
   */
  static fetchSelected(
    applicationId: string,
  ): AxiosPromise<GenericApiResponse<AppTheme[]>> {
    return API.get(
      `${AppThemingApi.baseUrl}/themes/applications/${applicationId}?mode=EDIT`,
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
  ): AxiosPromise<GenericApiResponse<AppTheme[]>> {
    return API.post(
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
  ): AxiosPromise<GenericApiResponse<AppTheme[]>> {
    return API.patch(
      `${AppThemingApi.baseUrl}/applications/${applicationId}/themes/${theme.id}`,
      theme,
    );
  }
}

export default AppThemingApi;
