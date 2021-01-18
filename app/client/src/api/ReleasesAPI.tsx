import { AxiosPromise } from "axios";
import Api from "./Api";
import { ApiResponse } from "./ApiResponses";

class ReleasesAPI extends Api {
  static markAsReadURL = `v1/users/setReleaseNotesViewed`;

  static markAsRead(): AxiosPromise<ApiResponse> {
    return Api.put(ReleasesAPI.markAsReadURL);
  }
}

export default ReleasesAPI;
