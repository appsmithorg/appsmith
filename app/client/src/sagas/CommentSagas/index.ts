import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
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
  } else {
    // todo handle error here
    console.log(response, "invalid response");
  }
}

function* addCommentToThread(
  action: ReduxAction<AddCommentToCommentThreadRequestPayload>,
) {
  const { payload } = action;
  const { callback, commentBody, commentThread } = payload;

  const response = yield CommentsApi.createNewThreadComment(
    { body: commentBody },
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
  } else {
    // todo handle error here
    console.log(response, "invalid response");
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
    } else {
      // todo invalid response
    }
  } catch (e) {
    // todo handle error here
    console.log(e, "error");
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
    } else {
      console.log(isValidResponse, "handle error");
    }
  } catch (e) {
    console.log(e, "handle error");
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
  } catch (e) {
    console.log(e, "handle error");
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
  } catch (e) {
    console.log(e, "handle error");
  }
}

function* markThreadAsRead(action: ReduxAction<{ threadId: string }>) {
  try {
    const { threadId } = action.payload;
    const response = yield CommentsApi.updateCommentThread({}, threadId);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put(updateCommentThreadSuccess(response.data));
    }
  } catch (e) {
    console.log(e, "handle error");
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
  } catch (e) {
    console.log(e, "handle error");
  }
}

function* deleteCommentThread(action: ReduxAction<string>) {
  try {
    yield CommentsApi.deleteCommentThread(action.payload);
    // const isValidResponse = yield validateResponse(response);
    // if (isValidResponse) {
    const applicationId = yield select(getCurrentApplicationId);
    yield put(
      deleteCommentThreadSuccess({
        commentThreadId: action.payload,
        appId: applicationId,
      }),
    );
    // }
  } catch (e) {
    console.log(e, "handle error");
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
  } catch (e) {
    console.log(e);
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
  } catch (e) {
    console.log(e);
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
  ]);
}
