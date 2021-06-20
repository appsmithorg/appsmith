import { AxiosPromise } from "axios";
import Api from "./Api";
import { ApiResponse } from "./ApiResponses";
import {
  CreateCommentThreadRequest,
  CreateCommentRequest,
} from "entities/Comments/CommentsInterfaces";

class CommentsApi extends Api {
  static baseURL = "v1/comments";
  static getThreadsAPI = `${CommentsApi.baseURL}/threads`;
  static getCommentsAPI = CommentsApi.baseURL;
  static getReactionsAPI = (commentId: string) =>
    `${CommentsApi.getCommentsAPI}/${commentId}/reactions`;

  static createNewThread(
    request: CreateCommentThreadRequest,
  ): AxiosPromise<ApiResponse> {
    return Api.post(CommentsApi.getThreadsAPI, request);
  }

  static createNewThreadComment(
    request: CreateCommentRequest,
    threadId: string,
  ): AxiosPromise<ApiResponse> {
    return Api.post(CommentsApi.getCommentsAPI, request, {
      threadId,
    });
  }

  static fetchAppCommentThreads(
    applicationId: string,
  ): AxiosPromise<ApiResponse> {
    return Api.get(CommentsApi.getThreadsAPI, { applicationId });
  }

  static updateCommentThread(
    updateCommentThreadRequest: Partial<CreateCommentThreadRequest>,
    threadId: string,
  ): AxiosPromise<ApiResponse> {
    return Api.put(
      `${CommentsApi.getThreadsAPI}/${threadId}`,
      updateCommentThreadRequest,
    );
  }

  static updateComment(
    updateCommentRequest: Partial<CreateCommentRequest>,
    commentId: string,
  ): AxiosPromise<ApiResponse> {
    return Api.put(
      `${CommentsApi.getCommentsAPI}/${commentId}`,
      updateCommentRequest,
    );
  }

  static deleteComment(commentId: string): AxiosPromise<ApiResponse> {
    return Api.delete(`${CommentsApi.getCommentsAPI}/${commentId}`);
  }

  static deleteCommentThread(threadId: string): AxiosPromise<ApiResponse> {
    return Api.delete(`${CommentsApi.getThreadsAPI}/${threadId}`);
  }

  static addCommentReaction(
    commentId: string,
    request: { emoji: string },
  ): AxiosPromise<ApiResponse> {
    return Api.post(CommentsApi.getReactionsAPI(commentId), request);
  }

  static removeCommentReaction(
    commentId: string,
    request: { emoji: string },
  ): AxiosPromise<ApiResponse> {
    return Api.delete(CommentsApi.getReactionsAPI(commentId), null, {
      data: request,
    });
  }

  // eslint-disable-next-line
  static fetchUnreadCommentThreads(applicationId: string) {
    return Promise.resolve({ data: { count: 10 } });
  }
}

export default CommentsApi;
