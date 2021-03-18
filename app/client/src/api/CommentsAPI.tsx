import { AxiosPromise } from "axios";
import Api from "./Api";
import { ApiResponse } from "./ApiResponses";
import {
  CreateCommentThreadRequest,
  CreateCommentRequest,
} from "components/ads/Comments/CommentsInterfaces";

class CommentsApi extends Api {
  static baseURL = "v1/comments";
  static getCreateThreadAPI = () => `${CommentsApi.baseURL}/threads`;
  static getCreateNewThreadCommentAPI = () => CommentsApi.baseURL;

  static createNewThread(
    request: CreateCommentThreadRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.post(CommentsApi.getCreateThreadAPI(), request);
  }

  static createNewThreadComment(
    request: CreateCommentRequest,
    threadId: string,
  ): AxiosPromise<ApiResponse> {
    return Api.post(CommentsApi.getCreateNewThreadCommentAPI(), request, {
      threadId,
    });
  }
}

export default CommentsApi;
