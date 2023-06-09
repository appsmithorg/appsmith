import { APP_MODE } from "entities/App";
import type { TJSLibrary } from "workers/common/JSLibrary";
import Api from "./Api";

export default class LibraryApi extends Api {
  static base_url = "v1/libraries";

  static getUpdateLibraryBaseURL = (applicationId: string) =>
    `${LibraryApi.base_url}/${applicationId}`;

  static addLibrary(
    applicationId: string,
    library: Partial<TJSLibrary> & { defs: string },
  ) {
    const url = LibraryApi.getUpdateLibraryBaseURL(applicationId) + "/add";
    return Api.patch(url, library);
  }

  static removeLibrary(applicationId: string, library: Partial<TJSLibrary>) {
    const url = LibraryApi.getUpdateLibraryBaseURL(applicationId) + "/remove";
    return Api.patch(url, library);
  }

  static getLibraries(applicationId: string, mode: APP_MODE) {
    const url = `${LibraryApi.getUpdateLibraryBaseURL(applicationId)}${
      mode === APP_MODE.PUBLISHED ? "/view" : ""
    }`;
    return Api.get(url);
  }
}
