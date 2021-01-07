import { AxiosPromise } from "axios";
import Api from "./Api";
import { ApiResponse } from "./ApiResponses";

export interface MarkAsReadRequest {
  lastReadRelease: string;
}

class ReleasesAPI extends Api {
  static markAsReadURL = `v1/mark-releases-as-read`;

  static markAsRead(request: MarkAsReadRequest): AxiosPromise<ApiResponse> {
    return Api.post(ReleasesAPI.markAsReadURL, request);
  }
}

export default ReleasesAPI;
