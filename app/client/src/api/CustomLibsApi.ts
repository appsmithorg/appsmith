import { AxiosPromise } from "axios";
import Api from "./Api";

export default class CustomLibsApi extends Api {
  private static cdnJSBaseUrl = "https://api.cdnjs.com";
  private static cdnJSSearchUrl = `${CustomLibsApi.cdnJSBaseUrl}/libraries?fields=filename,description,version&limit=10`;
  private static buildSearchUrl = (query: string): string =>
    `${CustomLibsApi.cdnJSSearchUrl}${query ? `&search=${query}` : ""}`;
  public static searchLibrary(query: string): AxiosPromise<any> {
    return Api.get(CustomLibsApi.buildSearchUrl(query));
  }
}
