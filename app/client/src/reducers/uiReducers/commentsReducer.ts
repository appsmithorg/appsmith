import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { createReducer } from "utils/AppsmithUtils";
import { CommentThread } from "components/ads/Comments/CommentsInterfaces";
import { get, keyBy, uniqBy } from "lodash";

const initialState: CommentsReduxState = {
  commentThreadsMap: {},
  applicationCommentThreadsByRef: {},
  unpublishedCommentThreads: {},
  isCommentMode: true,
  creatingNewThread: false,
  creatingNewThreadComment: false,
};

// TODO make this readable
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
    const { refId, id, applicationId } = action.payload;
    const applicationCommentThreadsByRef = get(
      state,
      `applicationCommentThreadsByRef.${applicationId}`,
      [],
    );
    const commentThreadsForRefId = get(
      applicationCommentThreadsByRef,
      refId,
      [],
    );

    return {
      ...state,
      applicationCommentThreadsByRef: {
        ...state.applicationCommentThreadsByRef,
        [applicationId]: {
          ...applicationCommentThreadsByRef,
          [refId]: Array.from(new Set([...commentThreadsForRefId, id])),
        },
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
    const { commentThreadId, comment, applicationId } = action.payload;
    const commentInStore = state.commentThreadsMap[commentThreadId];
    const applicationCommentThreadsByRef = get(
      state,
      `applicationCommentThreadsByRef.${applicationId}`,
      [],
    );
    const commentThreadsForRefId = get(
      applicationCommentThreadsByRef,
      `${applicationId}.${comment.refId}`,
      [],
    );

    return {
      ...state,
      applicationCommentThreadsByRef: {
        ...state.applicationCommentThreadsByRef,
        [applicationId]: {
          ...applicationCommentThreadsByRef,
          [comment.refId]: Array.from(
            new Set([...commentThreadsForRefId, comment.id]),
          ),
        },
      },
      commentThreadsMap: {
        ...state.commentThreadsMap,
        [commentThreadId]: {
          ...commentInStore,
          comments: Array.from(new Set([...commentInStore.comments, comment])),
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
  [ReduxActionTypes.FETCH_APPLICATION_COMMENTS_SUCCESS]: (
    state: CommentsReduxState,
    action: ReduxAction<any>,
  ) => {
    const applicationCommentsMap = keyBy(action.payload, "id");
    const applicationCommentIdsByRefId = action.payload.reduce(
      (res: any, curr: any) => {
        const applicationCommentIds = res[curr.applicationId] || {};
        const applicationCommentIdsForRefId = get(
          applicationCommentIds,
          curr.refId,
          [],
        );

        return {
          ...res,
          [curr.applicationId]: {
            ...applicationCommentIds,
            [curr.refId]: Array.from(
              new Set([...applicationCommentIdsForRefId, curr.id]),
            ),
          },
        };
      },
      {},
    );

    return {
      ...state,
      applicationCommentThreadsByRef: {
        ...state.applicationCommentThreadsByRef,
        ...applicationCommentIdsByRefId,
      },
      commentThreadsMap: {
        ...state.commentThreadsMap,
        ...applicationCommentsMap,
      },
    };
  },
  [ReduxActionTypes.NEW_COMMENT_THREAD_EVENT]: (
    state: CommentsReduxState,
    action: ReduxAction<any>,
  ) => {
    const { comment: thread } = action.payload;
    const applicationCommentIdsByRefId = get(
      state.applicationCommentThreadsByRef,
      thread.applicationId,
      {},
    ) as Record<string, Array<string>>;
    const threadsForRefId = get(applicationCommentIdsByRefId, thread.refId, []);
    const isVisible = get(
      state.commentThreadsMap,
      `${thread._id}.isVisible`,
      false,
    );
    return {
      ...state,
      applicationCommentThreadsByRef: {
        ...state.applicationCommentThreadsByRef,
        [thread.applicationId]: {
          ...applicationCommentIdsByRefId,
          [thread.refId]: Array.from(new Set([...threadsForRefId, thread._id])),
        },
      },
      commentThreadsMap: {
        ...state.commentThreadsMap,
        [thread._id]: { id: thread._id, ...thread, isVisible },
      },
    };
  },
  [ReduxActionTypes.NEW_COMMENT_EVENT]: (
    state: CommentsReduxState,
    action: ReduxAction<any>,
  ) => {
    const { comment } = action.payload;
    const threadInState = state.commentThreadsMap[comment.threadId];
    if (!threadInState) return state;

    const existingComments = get(threadInState, "comments", []);

    // const applicationCommentIdsByRefId = get(
    //   state.applicationCommentThreadsByRef,
    //   threadInState.applicationId,
    //   {},
    // ) as Record<string, Array<string>>;
    // const threadsForRefId = applicationCommentIdsByRefId[threadInState.refId];
    return {
      ...state,
      // applicationCommentThreadsByRef: {
      //   ...state.applicationCommentThreadsByRef,
      //   [comment.applicationId]: {
      //     ...applicationCommentIdsByRefId,
      //     [comment.refId]: [...threadsForRefId],
      //   },
      // },
      commentThreadsMap: {
        ...state.commentThreadsMap,
        [comment.threadId]: {
          ...threadInState,
          comments: uniqBy(
            [...existingComments, { ...comment, id: comment._id }],
            "id",
          ),
        },
      },
    };
  },
});

export interface CommentsReduxState {
  commentThreadsMap: Record<string, CommentThread>;
  applicationCommentThreadsByRef: Record<string, Record<string, Array<string>>>;
  unpublishedCommentThreads: Record<string, CommentThread>;
  isCommentMode: boolean;
  creatingNewThread: boolean;
  creatingNewThreadComment: boolean;
}

export default commentsReducer;
