import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { put, takeLatest, all, call, fork, select } from "redux-saga/effects";
import {
  createUnpublishedCommentThreadSuccess,
  removeUnpublishedCommentThreads,
  createCommentThreadSuccess,
  addCommentToThreadSuccess,
  fetchApplicationCommentsSuccess,
  updateCommentThreadSuccess,
  deleteCommentSuccess,
  setVisibleThread,
  updateCommentSuccess,
  deleteCommentThreadSuccess,
  setAreCommentsEnabled,
  setCommentMode,
  fetchUnreadCommentThreadsCountSuccess,
  fetchUnreadCommentThreadsCountRequest,
} from "actions/commentActions";
import {
  transformPublishedCommentActionPayload,
  transformUnpublishCommentThreadToCreateNew,
} from "comments/utils";

import { waitForInit } from "sagas/InitSagas";
import { waitForFetchUserSuccess } from "sagas/userSagas";

import CommentsApi from "api/CommentsAPI";

import { validateResponse } from "../ErrorSagas";

import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  AddCommentToCommentThreadRequestPayload,
  CreateCommentThreadPayload,
  CreateCommentThreadRequest,
} from "entities/Comments/CommentsInterfaces";
import { RawDraftContentState } from "draft-js";
import { getCurrentUser } from "selectors/usersSelectors";
import { get } from "lodash";

import { commentModeSelector } from "selectors/commentsSelectors";
import { AppState } from "reducers";

function* createUnpublishedCommentThread(
  action: ReduxAction<Partial<CreateCommentThreadRequest>>,
) {
  const transformedPayload = transformPublishedCommentActionPayload(
    action.payload,
  );
  yield put(createUnpublishedCommentThreadSuccess(transformedPayload));
}

function* createCommentThread(action: ReduxAction<CreateCommentThreadPayload>) {
  try {
    yield put(removeUnpublishedCommentThreads());
    const newCommentThreadPayload = transformUnpublishCommentThreadToCreateNew(
      action.payload,
    );
    const applicationId = yield select(getCurrentApplicationId);
    const pageId = yield select(getCurrentPageId);
    const mode = yield select((state: AppState) => state.entities.app.mode);
    const response = yield call(CommentsApi.createNewThread, {
      ...newCommentThreadPayload,
      applicationId,
      pageId,
      mode,
    });
    const isValidResponse = yield validateResponse(response);

    if (isValidResponse) {
      yield put(createCommentThreadSuccess(response.data));
      yield put(setVisibleThread(response.data.id));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_COMMENT_THREAD_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

function* addCommentToThread(
  action: ReduxAction<AddCommentToCommentThreadRequestPayload>,
) {
  try {
    const { payload } = action;
    const { callback, commentBody, commentThread } = payload;

    const mode = yield select((state: AppState) => state.entities.app.mode);
    const response = yield CommentsApi.createNewThreadComment(
      { body: commentBody, mode },
      commentThread.id,
    );

    const isValidResponse = yield validateResponse(response);

    if (isValidResponse) {
      yield put(
        addCommentToThreadSuccess({
          commentThreadId: commentThread.id,
          comment: response.data,
        }),
      );
      callback();
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.ADD_COMMENT_TO_THREAD_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

function* fetchApplicationComments() {
  try {
    yield call(waitForInit);
    const applicationId = yield select(getCurrentApplicationId);
    const response = yield CommentsApi.fetchAppCommentThreads(applicationId);
    const isValidResponse = yield validateResponse(response);

    if (isValidResponse) {
      yield put(fetchApplicationCommentsSuccess(response.data));
      yield put(fetchUnreadCommentThreadsCountRequest());
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_APPLICATION_COMMENTS_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

function* setCommentResolution(
  action: ReduxAction<{ threadId: string; resolved: boolean }>,
) {
  try {
    const { resolved, threadId } = action.payload;
    const response = yield CommentsApi.updateCommentThread(
      { resolvedState: { active: resolved } },
      threadId,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put(updateCommentThreadSuccess(response.data));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SET_COMMENT_RESOLUTION_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

function* pinCommentThread(
  action: ReduxAction<{ threadId: string; pin: boolean }>,
) {
  try {
    const { pin, threadId } = action.payload;
    const response = yield CommentsApi.updateCommentThread(
      { pinnedState: { active: pin } },
      threadId,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put(updateCommentThreadSuccess(response.data));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.PIN_COMMENT_THREAD_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

function* deleteComment(
  action: ReduxAction<{ commentId: string; threadId: string }>,
) {
  try {
    const { commentId, threadId } = action.payload;
    const response = yield CommentsApi.deleteComment(commentId);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put(deleteCommentSuccess({ commentId, threadId }));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_COMMENT_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

function* markThreadAsRead(action: ReduxAction<{ threadId: string }>) {
  try {
    const { threadId } = action.payload;
    const response = yield CommentsApi.updateCommentThread({}, threadId);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put(updateCommentThreadSuccess(response.data));
      yield put(fetchUnreadCommentThreadsCountRequest());
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.MARK_THREAD_AS_READ_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

function* editComment(
  action: ReduxAction<{
    commentId: string;
    commentThreadId: string;
    body: RawDraftContentState;
  }>,
) {
  try {
    const { body, commentId, commentThreadId } = action.payload;
    const response = yield CommentsApi.updateComment({ body }, commentId);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put(
        updateCommentSuccess({ comment: response.data, commentThreadId }),
      );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.EDIT_COMMENT_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

function* deleteCommentThread(action: ReduxAction<string>) {
  try {
    const response = yield CommentsApi.deleteCommentThread(action.payload);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      const applicationId = yield select(getCurrentApplicationId);
      yield put(
        deleteCommentThreadSuccess({
          commentThreadId: action.payload,
          appId: applicationId,
        }),
      );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_COMMENT_THREAD_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

function* setIfCommentsAreEnabled() {
  yield call(waitForFetchUserSuccess);

  const user = yield select(getCurrentUser);
  const email = get(user, "email", "");
  const isAppsmithEmail = email.toLowerCase().indexOf("@appsmith.com") !== -1;

  const isCommentModeEnabled = isAppsmithEmail;
  yield put(setAreCommentsEnabled(isAppsmithEmail));

  const isCommentMode = yield select(commentModeSelector);
  if (isCommentMode && !isCommentModeEnabled) yield put(setCommentMode(false));
}

function* addCommentReaction(
  action: ReduxAction<{ emoji: string; commentId: string }>,
) {
  try {
    const { commentId, emoji } = action.payload;
    yield CommentsApi.addCommentReaction(commentId, { emoji });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.ADD_COMMENT_REACTION_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

function* deleteCommentReaction(
  action: ReduxAction<{ emoji: string; commentId: string }>,
) {
  try {
    const { commentId, emoji } = action.payload;
    yield CommentsApi.removeCommentReaction(commentId, {
      emoji,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_COMMENT_REACTION_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

function* fetchUnreadCommentsCount() {
  try {
    const applicationId = yield select(getCurrentApplicationId);
    const response = yield call(
      CommentsApi.fetchUnreadCommentThreads,
      applicationId,
    );
    // const isValidResponse = yield validateResponse(response);
    // if (isValidResponse) {
    yield put(fetchUnreadCommentThreadsCountSuccess(response.data.count > 0));
    // }
  } catch (e) {
    console.log(e, "handle error");
  }
}

export default function* commentSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.FETCH_APPLICATION_COMMENTS_REQUEST,
      fetchApplicationComments,
    ),
    takeLatest(
      ReduxActionTypes.CREATE_UNPUBLISHED_COMMENT_THREAD_REQUEST,
      createUnpublishedCommentThread,
    ),
    takeLatest(
      ReduxActionTypes.CREATE_COMMENT_THREAD_REQUEST,
      createCommentThread,
    ),
    takeLatest(
      ReduxActionTypes.ADD_COMMENT_TO_THREAD_REQUEST,
      addCommentToThread,
    ),
    takeLatest(
      ReduxActionTypes.SET_COMMENT_THREAD_RESOLUTION_REQUEST,
      setCommentResolution,
    ),
    takeLatest(ReduxActionTypes.PIN_COMMENT_THREAD_REQUEST, pinCommentThread),
    takeLatest(ReduxActionTypes.DELETE_COMMENT_REQUEST, deleteComment),
    takeLatest(ReduxActionTypes.MARK_THREAD_AS_READ_REQUEST, markThreadAsRead),
    takeLatest(ReduxActionTypes.EDIT_COMMENT_REQUEST, editComment),
    takeLatest(ReduxActionTypes.DELETE_THREAD_REQUEST, deleteCommentThread),
    takeLatest(ReduxActionTypes.ADD_COMMENT_REACTION, addCommentReaction),
    takeLatest(ReduxActionTypes.REMOVE_COMMENT_REACTION, deleteCommentReaction),
    fork(setIfCommentsAreEnabled),
    takeLatest(
      ReduxActionTypes.FETCH_UNREAD_COMMENT_THREADS_COUNT_REQUEST,
      fetchUnreadCommentsCount,
    ),
  ]);
}
