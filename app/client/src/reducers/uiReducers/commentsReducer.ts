import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { createReducer } from "utils/AppsmithUtils";
import { CommentThread } from "components/ads/Comments/CommentsInterfaces";

const initialState: CommentsReduxState = {
  commentThreadsMap: {},
  refCommentThreads: {},
  unpublishedCommentThreads: {},
  isCommentMode: true,
  creatingNewThread: false,
  creatingNewThreadComment: false,
};

const commentsReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_COMMENT_THREADS_SUCCESS]: (
    state: CommentsReduxState,
    action: ReduxAction<any>,
  ) => ({
    ...state,
    ...action.payload,
  }),
  [ReduxActionTypes.CREATE_UNPUBLISHED_COMMENT_THREAD_SUCCESS]: (
    state: CommentsReduxState,
    action: ReduxAction<any>,
  ) => ({
    ...state,
    unpublishedCommentThreads: action.payload,
  }),
  [ReduxActionTypes.REMOVE_UNPUBLISHED_COMMENT_THREAD_REQUEST]: (
    state: CommentsReduxState,
  ) => ({
    ...state,
    unpublishedCommentThreads: {},
  }),
  [ReduxActionTypes.CREATE_COMMENT_THREAD_SUCCESS]: (
    state: CommentsReduxState,
    action: ReduxAction<any>,
  ) => {
    const { refId, id } = action.payload;
    return {
      ...state,
      refCommentThreads: {
        ...state.refCommentThreads,
        [refId]: [...(state.refCommentThreads[refId] || []), id],
      },
      commentThreadsMap: {
        ...state.commentThreadsMap,
        [id]: action.payload,
      },
      creatingNewThread: false,
    };
  },
  [ReduxActionTypes.ADD_COMMENT_TO_THREAD_SUCCESS]: (
    state: CommentsReduxState,
    action: ReduxAction<any>,
  ) => {
    const { commentThreadId, comment } = action.payload;
    const commentInStore = state.commentThreadsMap[commentThreadId];

    return {
      ...state,
      refCommentThreads: {
        ...state.refCommentThreads,
        [commentInStore.refId]: [
          ...(state.refCommentThreads[commentInStore.refId] || []),
        ],
      },
      commentThreadsMap: {
        ...state.commentThreadsMap,
        [commentThreadId]: {
          ...commentInStore,
          comments: [...commentInStore.comments, comment],
        },
      },
      creatingNewThreadComment: false,
    };
  },
  [ReduxActionTypes.SET_COMMENT_MODE]: (
    state: CommentsReduxState,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    isCommentMode: action.payload,
  }),
  [ReduxActionTypes.SET_IS_COMMENT_THREAD_VISIBLE]: (
    state: CommentsReduxState,
    action: ReduxAction<{ isVisible: boolean; commentThreadId: string }>,
  ) => ({
    ...state,
    commentThreadsMap: {
      ...state.commentThreadsMap,
      [action.payload.commentThreadId]: {
        ...state.commentThreadsMap[action.payload.commentThreadId],
        isVisible: action.payload.isVisible,
      },
    },
  }),
  [ReduxActionTypes.CREATE_COMMENT_THREAD_REQUEST]: (
    state: CommentsReduxState,
  ) => ({
    ...state,
    creatingNewThread: true,
  }),
  [ReduxActionTypes.ADD_COMMENT_TO_THREAD_REQUEST]: (
    state: CommentsReduxState,
  ) => ({
    ...state,
    creatingNewThreadComment: true,
  }),
});

export interface CommentsReduxState {
  commentThreadsMap: Record<string, CommentThread>;
  refCommentThreads: Record<string, Array<string>>;
  unpublishedCommentThreads: Record<string, CommentThread>;
  isCommentMode: boolean;
  creatingNewThread: boolean;
  creatingNewThreadComment: boolean;
}

export default commentsReducer;
