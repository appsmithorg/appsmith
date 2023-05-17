import type { AxiosPromise } from "axios";
import Api from "api/Api";
import type { ApiResponse } from "./ApiResponses";

class ReleasesAPI extends Api {
  static markAsReadURL = `v1/users/setReleaseNotesViewed`;

  static markAsRead(): AxiosPromise<ApiResponse> {
    return Api.put(ReleasesAPI.markAsReadURL);
  }
}

export default ReleasesAPI;
