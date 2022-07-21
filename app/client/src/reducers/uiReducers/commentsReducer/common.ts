import { CommentsReduxState } from "./interfaces";

export const deleteCommentThreadFromState = (
  state: CommentsReduxState,
  commentThreadId: string,
  applicationId: string,
) => {
  if (!state.applicationCommentThreadsByRef[applicationId]) return state;

  const { refId } = state.commentThreadsMap[commentThreadId] || {};

  if (!refId) return state;

  let refComments = state.applicationCommentThreadsByRef[applicationId][refId];
  if (refComments) {
    refComments = refComments.filter(
      (threadId: string) => threadId !== commentThreadId,
    );
  }

  // Delete the thread from store
  delete state.commentThreadsMap[commentThreadId];

  state.commentThreadsMap = { ...state.commentThreadsMap };

  state.applicationCommentThreadsByRef[applicationId as string] = {
    ...state.applicationCommentThreadsByRef[applicationId as string],
    [refId]: [...refComments], // Delete the threadId from the ref to thread mapping
  };

  return state;
};

export const deleteCommentFromState = (
  state: CommentsReduxState,
  commentId: string,
  threadId: string,
) => {
  const commentThread = state.commentThreadsMap[threadId];

  if (!commentThread) return state;

  state.commentThreadsMap[threadId] = {
    ...commentThread,
    comments: commentThread.comments.filter(
      (comment) => comment.id !== commentId,
    ),
  };

  return state;
};
