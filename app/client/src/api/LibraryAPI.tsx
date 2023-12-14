import type { APP_MODE } from "entities/App";
import type { JSLibrary } from "workers/common/JSLibrary";
import Api from "./Api";

export default class LibraryApi extends Api {
  static base_url = "v1/libraries";

  static getUpdateLibraryBaseURL = (applicationId: string) =>
    `${LibraryApi.base_url}/${applicationId}`;

  static async addLibrary(
    applicationId: string,
    library: Partial<JSLibrary> & { defs: string },
  ) {
    const url = LibraryApi.getUpdateLibraryBaseURL(applicationId) + "/add";
    return Api.patch(url, library);
  }

  static async removeLibrary(
    applicationId: string,
    library: Partial<JSLibrary>,
  ) {
    const url = LibraryApi.getUpdateLibraryBaseURL(applicationId) + "/remove";
    return Api.patch(url, library);
  }

  static async getLibraries(applicationId: string, mode: APP_MODE) {
    // eslint-disable-next-line no-console
    console.log("applicationId,mode ", applicationId, mode);

    // const url = `${LibraryApi.getUpdateLibraryBaseURL(applicationId)}${
    //   mode === APP_MODE.PUBLISHED ? "/view" : ""
    // }`;
    // api/v1/libraries/657ad510e4a5e56691a2f866
    return {
      responseMeta: { status: 200, success: true },
      data: [],
      errorDisplay: "",
    };
  }
}
