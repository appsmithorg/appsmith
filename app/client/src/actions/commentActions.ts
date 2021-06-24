import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { COMMENT_EVENTS_CHANNEL } from "constants/CommentConstants";
import { options as filterOptions } from "comments/AppComments/AppCommentsFilterPopover";

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

import { RawDraftContentState } from "draft-js";

export const setCommentThreadsRequest = () => ({
  type: ReduxActionTypes.SET_COMMENT_THREADS_REQUEST,
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

export const pinCommentThreadRequest = (payload: {
  threadId: string;
  pin: boolean;
}) => ({
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

export const setShouldShowResolvedComments = (payload: boolean) => ({
  type: ReduxActionTypes.SET_SHOULD_SHOW_RESOLVED_COMMENTS,
  payload,
});

export const setAppCommentsFilter = (
  payload: typeof filterOptions[number]["value"],
) => ({
  type: ReduxActionTypes.SET_APP_COMMENTS_FILTER,
  payload,
});

export const resetVisibleThread = (threadId?: string) => ({
  type: ReduxActionTypes.RESET_VISIBLE_THREAD,
  payload: threadId,
});

export const setVisibleThread = (threadId: string) => ({
  type: ReduxActionTypes.SET_VISIBLE_THREAD,
  payload: threadId,
});

export const markThreadAsReadRequest = (threadId: string) => ({
  type: ReduxActionTypes.MARK_THREAD_AS_READ_REQUEST,
  payload: { threadId },
});

export const editCommentRequest = ({
  body,
  commentId,
  commentThreadId,
}: {
  commentThreadId: string;
  commentId: string;
  body: RawDraftContentState;
}) => ({
  type: ReduxActionTypes.EDIT_COMMENT_REQUEST,
  payload: {
    body,
    commentId,
    commentThreadId,
  },
});

export const updateCommentSuccess = (payload: {
  comment: Comment;
  commentThreadId: string;
}) => ({
  type: ReduxActionTypes.EDIT_COMMENT_SUCCESS,
  payload,
});

export const deleteCommentThreadRequest = (commentThreadId: string) => ({
  type: ReduxActionTypes.DELETE_THREAD_REQUEST,
  payload: commentThreadId,
});

export const deleteCommentThreadSuccess = (payload: {
  commentThreadId: string;
  appId: string;
}) => ({
  type: ReduxActionTypes.DELETE_THREAD_SUCCESS,
  payload,
});

export const addCommentReaction = (payload: {
  emoji: string;
  commentId: string;
}) => ({
  type: ReduxActionTypes.ADD_COMMENT_REACTION,
  payload,
});

export const removeCommentReaction = (payload: {
  emoji: string;
  commentId: string;
}) => ({
  type: ReduxActionTypes.REMOVE_COMMENT_REACTION,
  payload,
});

export const updateCommentEvent = (payload: Comment) => ({
  type: ReduxActionTypes.UPDATE_COMMENT_EVENT,
  payload,
});

export const showCommentsIntroCarousel = () => ({
  type: ReduxActionTypes.SHOW_COMMENTS_INTRO_CAROUSEL,
  payload: undefined,
});

export const hideCommentsIntroCarousel = () => ({
  type: ReduxActionTypes.HIDE_COMMENTS_INTRO_CAROUSEL,
  payload: undefined,
});

export const setAreCommentsEnabled = (flag: boolean) => ({
  type: ReduxActionTypes.SET_ARE_COMMENTS_ENABLED,
  payload: flag,
});

export const fetchUnreadCommentThreadsCountRequest = () => ({
  type: ReduxActionTypes.FETCH_UNREAD_COMMENT_THREADS_COUNT_REQUEST,
});

export const fetchUnreadCommentThreadsCountSuccess = (flag: boolean) => ({
  type: ReduxActionTypes.FETCH_UNREAD_COMMENT_THREADS_COUNT_SUCCESS,
  payload: flag,
});
