import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { createReducer } from "utils/AppsmithUtils";
import { get, uniqBy } from "lodash";
import handleCreateNewCommentThreadSuccess from "./handleCreateNewCommentThreadSuccess";
import handleAddCommentToThreadSuccess from "./handleAddCommentToThreadSuccess";
import handleFetchApplicationCommentsSuccess from "./handleFetchApplicationCommentsSuccess";
import handleNewCommentThreadEvent from "./handleNewCommentThreadEvent";
import handleUpdateCommentThreadSuccess from "./handleUpdateCommentThreadSuccess";
import handleUpdateCommentThreadEvent from "./handleUpdateCommentThreadEvent";
import handleUpdateCommentEvent from "./handleUpdateCommentEvent";
import handleDeleteCommentEvent from "./handleDeleteCommentEvent";
import handleDeleteCommentThreadEvent from "./handleDeleteCommentThreadEvent";

import { CommentsReduxState } from "./interfaces";
import {
  AddCommentToCommentThreadSuccessPayload,
  CommentThread,
  CreateCommentThreadRequest,
  NewCommentEventPayload,
  NewCommentThreadPayload,
  Comment,
  DraggedCommentThread,
} from "entities/Comments/CommentsInterfaces";

import { options as filterOptions } from "comments/AppComments/AppCommentsFilterPopover";
import handleDragCommentThread from "./handleDragCommentThread";
import { deleteCommentFromState, deleteCommentThreadFromState } from "./common";
import { EditorState } from "draft-js";

const initialState: CommentsReduxState = {
  commentThreadsMap: {},
  applicationCommentThreadsByRef: {},
  unpublishedCommentThreads: {},
  isCommentMode: false,
  creatingNewThread: false,
  creatingNewThreadComment: false,
  appCommentsFilter: filterOptions[0].value,
  shouldShowResolvedAppCommentThreads: false,
  visibleCommentThreadId: "",
  isIntroCarouselVisible: false,
  unsubscribed: false,
  draggingCommentThreadId: null,
  dragPointerOffset: null,
  draftComments: {},
  unpublishedThreadDraftComment: null,
  commentThreadsFetched: false,
  lastUpdatedCommentThreadByAppId: {},
};

/**
 * Action constants with suffix as `EVENT` are a result of socket updates
 * They are handled separately
 * TODO: look into merging `_EVENT` handlers (for socket events) and local actions
 */
const commentsReducer = createReducer(initialState, {
  // Only one unpublished comment threads exists at a time
  [ReduxActionTypes.CREATE_UNPUBLISHED_COMMENT_THREAD_SUCCESS]: (
    state: CommentsReduxState,
    action: ReduxAction<Record<string, Partial<CreateCommentThreadRequest>>>,
  ) => ({
    ...state,
    unpublishedCommentThreads: action.payload,
  }),
  [ReduxActionTypes.REMOVE_UNPUBLISHED_COMMENT_THREAD_REQUEST]: (
    state: CommentsReduxState,
    action: ReduxAction<{ shouldPersistComment: boolean }>,
  ) => ({
    ...state,
    unpublishedCommentThreads: {},
    unpublishedThreadDraftComment: action.payload.shouldPersistComment
      ? state.unpublishedThreadDraftComment
      : null,
  }),
  [ReduxActionTypes.CREATE_COMMENT_THREAD_SUCCESS]: (
    state: CommentsReduxState,
    action: ReduxAction<CommentThread>,
  ) => {
    return handleCreateNewCommentThreadSuccess(state, action);
  },
  [ReduxActionTypes.ADD_COMMENT_TO_THREAD_SUCCESS]: (
    state: CommentsReduxState,
    action: ReduxAction<AddCommentToCommentThreadSuccessPayload>,
  ) => {
    return handleAddCommentToThreadSuccess(state, action);
  },
  [ReduxActionTypes.SET_COMMENT_MODE]: (
    state: CommentsReduxState,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    isCommentMode: action.payload,
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
    action: ReduxAction<{
      commentThreads: CommentThread[];
      applicationId: string;
    }>,
  ) => {
    return handleFetchApplicationCommentsSuccess(state, action);
  },
  [ReduxActionTypes.NEW_COMMENT_THREAD_EVENT]: (
    state: CommentsReduxState,
    action: ReduxAction<NewCommentThreadPayload>,
  ) => {
    return handleNewCommentThreadEvent(state, action);
  },
  [ReduxActionTypes.UNSUBSCRIBE_COMMENT_THREAD_SUCCESS]: (
    state: CommentsReduxState,
  ) => ({
    ...state,
    unsubscribed: true,
  }),
  [ReduxActionTypes.NEW_COMMENT_EVENT]: (
    state: CommentsReduxState,
    action: ReduxAction<NewCommentEventPayload>,
  ) => {
    const { comment } = action.payload;
    const threadInState = state.commentThreadsMap[comment.threadId];
    if (!threadInState) return { ...state };
    const existingComments = get(threadInState, "comments", []);
    state.commentThreadsMap[comment.threadId] = {
      ...threadInState,
      comments: uniqBy(
        [...existingComments, { ...comment, id: comment._id }],
        "id",
      ),
    };

    return { ...state };
  },
  [ReduxActionTypes.UPDATE_COMMENT_THREAD_SUCCESS]: (
    state: CommentsReduxState,
    action: ReduxAction<CommentThread>,
  ) => {
    return handleUpdateCommentThreadSuccess(state, action);
  },
  [ReduxActionTypes.UPDATE_COMMENT_THREAD_EVENT]: (
    state: CommentsReduxState,
    action: ReduxAction<CommentThread>,
  ) => {
    return handleUpdateCommentThreadEvent(state, action);
  },
  [ReduxActionTypes.DRAG_COMMENT_THREAD]: (
    state: CommentsReduxState,
    action: ReduxAction<DraggedCommentThread>,
  ) => {
    return handleDragCommentThread(state, action);
  },
  [ReduxActionTypes.DELETE_COMMENT_SUCCESS]: (
    state: CommentsReduxState,
    action: ReduxAction<{
      commentId: string;
      threadId: string;
    }>,
  ) => {
    const { commentId, threadId } = action.payload;

    const updatedState = deleteCommentFromState(state, commentId, threadId);

    return { ...updatedState };
  },
  [ReduxActionTypes.SET_SHOULD_SHOW_RESOLVED_COMMENTS]: (
    state: CommentsReduxState,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    shouldShowResolvedAppCommentThreads: action.payload,
  }),
  [ReduxActionTypes.RESET_VISIBLE_THREAD]: (
    state: CommentsReduxState,
    action: ReduxAction<{ threadId: string; shouldPersistThread: string }>,
  ) => {
    const draftCommentsClone = { ...state.draftComments };
    const { shouldPersistThread, threadId } = action.payload;
    if (!shouldPersistThread) {
      delete draftCommentsClone[threadId];
    }

    return {
      ...state,
      /**
       * To solve race cond, explicitly hide a visible thread using it's id
       * so that we don't accidently hide another thread
       */
      visibleCommentThreadId:
        threadId === state.visibleCommentThreadId
          ? ""
          : state.visibleCommentThreadId,
      draftComments: draftCommentsClone,
    };
  },
  [ReduxActionTypes.SET_VISIBLE_THREAD]: (
    state: CommentsReduxState,
    action: ReduxAction<string>,
  ) => ({
    ...state,
    visibleCommentThreadId: action.payload,
  }),
  [ReduxActionTypes.SET_APP_COMMENTS_FILTER]: (
    state: CommentsReduxState,
    action: ReduxAction<typeof filterOptions[number]["value"]>,
  ) => ({
    ...state,
    appCommentsFilter: action.payload,
  }),
  [ReduxActionTypes.EDIT_COMMENT_SUCCESS]: (
    state: CommentsReduxState,
    action: ReduxAction<{ comment: Comment; commentThreadId: string }>,
  ) => {
    const { comment, commentThreadId } = action.payload;
    const { id: commentId } = comment;
    const commentThread = state.commentThreadsMap[commentThreadId];

    if (!commentThread) return state;

    const commentIdx = commentThread.comments.findIndex(
      (comment: Comment) => comment.id === commentId,
    );

    commentThread.comments.splice(commentIdx, 1, comment);

    // propagate changes
    state.commentThreadsMap[commentThreadId] = {
      ...state.commentThreadsMap[commentThreadId],
    };

    return { ...state };
  },
  [ReduxActionTypes.DELETE_THREAD_SUCCESS]: (
    state: CommentsReduxState,
    action: ReduxAction<{ commentThreadId: string; appId: string }>,
  ) => {
    const { appId, commentThreadId } = action.payload;

    const updatedState = deleteCommentThreadFromState(
      state,
      commentThreadId,
      appId,
    );

    return { ...updatedState };
  },
  [ReduxActionTypes.SHOW_COMMENTS_INTRO_CAROUSEL]: (
    state: CommentsReduxState,
  ) => ({
    ...state,
    isIntroCarouselVisible: true,
  }),
  [ReduxActionTypes.HIDE_COMMENTS_INTRO_CAROUSEL]: (
    state: CommentsReduxState,
  ) => ({
    ...state,
    isIntroCarouselVisible: false,
  }),
  [ReduxActionTypes.UPDATE_COMMENT_EVENT]: (
    state: CommentsReduxState,
    action: ReduxAction<Comment>,
  ) => {
    return handleUpdateCommentEvent(state, action);
  },
  [ReduxActionTypes.DELETE_COMMENT_EVENT]: (
    state: CommentsReduxState,
    action: ReduxAction<Comment>,
  ) => handleDeleteCommentEvent(state, action),
  [ReduxActionTypes.DELETE_COMMENT_THREAD_EVENT]: (
    state: CommentsReduxState,
    action: ReduxAction<CommentThread>,
  ) => handleDeleteCommentThreadEvent(state, action),
  [ReduxActionTypes.SET_DRAGGING_COMMENT_THREAD]: (
    state: CommentsReduxState,
    action: ReduxAction<{
      threadId: string;
      offset: {
        x: number;
        y: number;
      };
    }>,
  ) => ({
    ...state,
    draggingCommentThreadId: action.payload.threadId,
    dragPointerOffset: action.payload.offset,
  }),
  [ReduxActionTypes.SET_HAS_DROPPED_COMMENT_THREAD]: (
    state: CommentsReduxState,
  ) => ({
    ...state,
    draggingCommentThreadId: null,
    dragPointerOffset: null,
  }),
  [ReduxActionTypes.UPDATE_UNPUBLISHED_THREAD_DRAFT_COMMENT]: (
    state: CommentsReduxState,
    action: ReduxAction<EditorState>,
  ) => ({
    ...state,
    unpublishedThreadDraftComment: action.payload,
  }),
  [ReduxActionTypes.UPDATE_THREAD_DRAFT_COMMENT]: (
    state: CommentsReduxState,
    action: ReduxAction<{ threadId: string; editorState: EditorState }>,
  ) => ({
    ...state,
    draftComments: {
      ...state.draftComments,
      [action.payload.threadId]: action.payload.editorState,
    },
  }),
  [ReduxActionTypes.FETCH_COMMENT_THREADS_INIT]: (
    state: CommentsReduxState,
  ) => ({
    ...state,
    commentThreadsFetched: false,
  }),
});

export default commentsReducer;
