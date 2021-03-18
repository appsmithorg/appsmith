import { AxiosPromise } from "axios";
import Api from "./Api";
import { ApiResponse } from "./ApiResponses";
import { CreateCommentThreadRequest } from "components/ads/Comments/CommentsInterfaces";

class CommentsApi extends Api {
  static baseURL = "v1/comments";
  static getCreateThreadAPI = () => `${CommentsApi.baseURL}/threads`;

  static createNewThread(
    request: CreateCommentThreadRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.post(CommentsApi.getCreateThreadAPI(), request);
  }
}

export default CommentsApi;
