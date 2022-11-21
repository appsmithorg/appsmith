import Api from "./Api";

export default class LibraryApi extends Api {
  static base_url = "v1/libraries";

  static getUpdateLibraryBaseURL = (applicationId: string) =>
    `${LibraryApi.base_url}/${applicationId}`;

  static addLibrary(applicationId: string, library: any) {
    const url = LibraryApi.getUpdateLibraryBaseURL(applicationId) + "/add";
    return Api.patch(url, library);
  }

  static removeLibrary(applicationId: string, library: any) {
    const url = LibraryApi.getUpdateLibraryBaseURL(applicationId) + "/remove";
    return Api.patch(url, library);
  }

  static getLibraries(applicationId: string) {
    const url = LibraryApi.getUpdateLibraryBaseURL(applicationId);
    return Api.get(url);
  }
}
