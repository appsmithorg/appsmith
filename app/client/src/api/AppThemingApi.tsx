import API from "api/Api";
import { AxiosPromise } from "axios";
import { AppTheme } from "entities/AppTheming";
import { GenericApiResponse } from "./ApiResponses";

class AppThemingApi extends API {
  static url = "themes/:applicationId";

  static fetchThemes(
    applicationId: string,
  ): AxiosPromise<GenericApiResponse<AppTheme[]>> {
    return API.get(AppThemingApi.url, { applicationId });
  }
}

export default AppThemingApi;
