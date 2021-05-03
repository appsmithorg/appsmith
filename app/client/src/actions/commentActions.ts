import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { COMMENT_EVENTS_CHANNEL } from "constants/CommentConstants";
import {
  CommentThread,
  CommentEventPayload,
  CreateCommentThreadPayload,
  CreateCommentThreadRequest,
  AddCommentToCommentThreadSuccessPayload,
  AddCommentToCommentThreadRequestPayload,
  NewCommentEventPayload,
  NewCommentThreadPayload,
} from "entities/Comments/CommentsInterfaces";

export const setCommentThreadsRequest = () => ({
  type: ReduxActionTypes.SET_COMMENT_THREADS_REQUEST,
});

// todo remove (for dev)
export const setCommentThreadsSuccess = (payload: any) => ({
  type: ReduxActionTypes.SET_COMMENT_THREADS_SUCCESS,
  payload,
});

// todo remove (for dev)
export const initCommentThreads = () => ({
  type: ReduxActionTypes.INIT_COMMENT_THREADS,
});

export const commentEvent = (payload: CommentEventPayload) => ({
  type: COMMENT_EVENTS_CHANNEL,
  payload,
});

export const createUnpublishedCommentThreadRequest = (
  payload: Partial<CreateCommentThreadRequest>,
) => ({
  type: ReduxActionTypes.CREATE_UNPUBLISHED_COMMENT_THREAD_REQUEST,
  payload,
});

export const createUnpublishedCommentThreadSuccess = (
  payload: Record<string, Partial<CreateCommentThreadRequest>>,
) => ({
  type: ReduxActionTypes.CREATE_UNPUBLISHED_COMMENT_THREAD_SUCCESS,
  payload,
});

export const removeUnpublishedCommentThreads = () => ({
  type: ReduxActionTypes.REMOVE_UNPUBLISHED_COMMENT_THREAD_REQUEST,
  payload: null,
});

export const createCommentThreadRequest = (
  payload: CreateCommentThreadPayload,
) => ({
  type: ReduxActionTypes.CREATE_COMMENT_THREAD_REQUEST,
  payload,
});

export const createCommentThreadSuccess = (payload: CommentThread) => ({
  type: ReduxActionTypes.CREATE_COMMENT_THREAD_SUCCESS,
  payload,
});

export const addCommentToThreadRequest = (
  payload: AddCommentToCommentThreadRequestPayload,
) => ({
  type: ReduxActionTypes.ADD_COMMENT_TO_THREAD_REQUEST,
  payload,
});

export const addCommentToThreadSuccess = (
  payload: AddCommentToCommentThreadSuccessPayload,
) => ({
  type: ReduxActionTypes.ADD_COMMENT_TO_THREAD_SUCCESS,
  payload,
});

export const setCommentMode = (payload: boolean) => ({
  type: ReduxActionTypes.SET_COMMENT_MODE,
  payload,
});

export const setIsCommentThreadVisible = (payload: {
  commentThreadId: string;
  isVisible: boolean;
}) => ({
  type: ReduxActionTypes.SET_IS_COMMENT_THREAD_VISIBLE,
  payload,
});

export const fetchApplicationCommentsRequest = () => ({
  type: ReduxActionTypes.FETCH_APPLICATION_COMMENTS_REQUEST,
});

export const fetchApplicationCommentsSuccess = (
  payload: Array<CommentThread>,
) => ({
  type: ReduxActionTypes.FETCH_APPLICATION_COMMENTS_SUCCESS,
  payload,
});

export const newCommentEvent = (payload: NewCommentEventPayload) => ({
  type: ReduxActionTypes.NEW_COMMENT_EVENT,
  payload,
});

export const newCommentThreadEvent = (payload: NewCommentThreadPayload) => ({
  type: ReduxActionTypes.NEW_COMMENT_THREAD_EVENT,
  payload,
});

export const setCommentResolutionRequest = (payload: {
  threadId: string;
  resolved: boolean;
}) => ({
  type: ReduxActionTypes.SET_COMMENT_THREAD_RESOLUTION_REQUEST,
  payload,
});

export const updateCommentThreadSuccess = (
  payload: Partial<CommentThread>,
) => ({
  type: ReduxActionTypes.UPDATE_COMMENT_THREAD_SUCCESS,
  payload,
});

export const updateCommentThreadEvent = (payload: Partial<CommentThread>) => ({
  type: ReduxActionTypes.UPDATE_COMMENT_THREAD_EVENT,
  payload,
});

export const pinCommentThreadRequest = (payload: { threadId: string }) => ({
  type: ReduxActionTypes.PIN_COMMENT_THREAD_REQUEST,
  payload,
});

export const pinCommentThreadSuccess = (payload: {
  threadId: string;
  applicationId: string;
}) => ({
  type: ReduxActionTypes.PIN_COMMENT_THREAD_SUCCESS,
  payload,
});

export const deleteCommentRequest = (payload: {
  commentId: string;
  threadId: string;
}) => ({
  type: ReduxActionTypes.DELETE_COMMENT_REQUEST,
  payload,
});

export const deleteCommentSuccess = (payload: {
  threadId: string;
  commentId: string;
}) => ({
  type: ReduxActionTypes.DELETE_COMMENT_SUCCESS,
  payload,
});
