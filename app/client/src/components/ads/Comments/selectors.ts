import { AppState } from "reducers";

export const refCommentThreadsSelector = (refId: string) => (state: AppState) =>
  state.ui.comments.refCommentThreads[refId];

export const commentThreadsSelector = (commentThreadId: string) => (
  state: AppState,
) => state.ui.comments.commentThreadsMap[commentThreadId];

export const isCommentMode = (state: AppState) =>
  state.ui.comments.isCommentMode;

export const unpublishedCommentThreadSelector = (refId: string) => (
  state: AppState,
) => state.ui.comments.unpublishedCommentThreads[refId];
