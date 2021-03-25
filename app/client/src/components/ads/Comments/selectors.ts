import { AppState } from "reducers";
import { get } from "lodash";

export const refCommentThreadsSelector = (
  refId: string,
  applicationId?: string,
) => (state: AppState) =>
  get(
    state.ui.comments.applicationCommentThreadsByRef,
    `${applicationId}.${refId}`,
    [],
  );

export const commentThreadsSelector = (commentThreadId: string) => (
  state: AppState,
) => state.ui.comments.commentThreadsMap[commentThreadId];

export const isCommentMode = (state: AppState) =>
  state.ui.comments.isCommentMode;

export const unpublishedCommentThreadSelector = (refId: string) => (
  state: AppState,
) => state.ui.comments.unpublishedCommentThreads[refId];

export const commentModeSelector = (state: AppState) =>
  state.ui.comments.isCommentMode;

export const applicationCommentsSelector = (applicationId: string) => (
  state: AppState,
) => state.ui.comments.applicationCommentThreadsByRef[applicationId];
