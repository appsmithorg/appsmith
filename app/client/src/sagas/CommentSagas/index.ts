import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  put,
  takeLatest,
  take,
  race,
  all,
  call,
  actionChannel,
  fork,
} from "redux-saga/effects";
import { updateLayout, getTestComments } from "components/ads/Comments/init";
import {
  COMMENT_EVENTS_CHANNEL,
  COMMENT_EVENTS,
} from "constants/CommentConstants";
import handleCommentEvents from "./handleCommentEvents";
import {
  commentEvent,
  createUnpublishedCommentThreadSuccess,
  removeUnpublishedCommentThreads,
  createCommentThreadSuccess,
  addCommentToThreadSuccess,
} from "actions/commentActions";
import {
  transformPublishedCommentActionPayload,
  transformUnpublishCommentThreadToCreateNew,
} from "components/ads/Comments/utils";

import { getAppsmithConfigs } from "configs";

const { commentsTestModeEnabled } = getAppsmithConfigs();

export function* initCommentThreads() {
  if (!commentsTestModeEnabled) return;
  try {
    yield race([
      take(ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS),
      take(ReduxActionTypes.INITIALIZE_PAGE_VIEWER_SUCCESS),
    ]);
    yield put(updateLayout());
    yield put(
      commentEvent({
        type: COMMENT_EVENTS.SET_COMMENTS,
        payload: getTestComments(),
      }),
    );
  } catch (err) {
    console.log(err, "err");
  }
}

function* watchCommentEvents() {
  const requestChan = yield actionChannel(COMMENT_EVENTS_CHANNEL);
  while (true) {
    const { payload } = yield take(requestChan);
    yield fork(handleCommentEvents, payload);
  }
}

function* createUnpublishedCommentThread(action: ReduxAction<any>) {
  const transformedPayload = transformPublishedCommentActionPayload(
    action.payload,
  );
  yield put(createUnpublishedCommentThreadSuccess(transformedPayload));
}

function* createCommentThread(action: ReduxAction<any>) {
  yield put(removeUnpublishedCommentThreads());
  const newCommentThreadPayload = transformUnpublishCommentThreadToCreateNew(
    action.payload,
  );
  yield put(createCommentThreadSuccess(newCommentThreadPayload));
}

function* addCommentToThread(action: ReduxAction<any>) {
  const { payload } = action;
  const { commentBody, commentThread } = payload;
  yield put(
    addCommentToThreadSuccess({
      commentThreadId: commentThread.id,
      comment: { body: commentBody },
    }),
  );
}

export default function* commentSagas() {
  yield all([
    takeLatest(ReduxActionTypes.INIT_COMMENT_THREADS, initCommentThreads),
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
    call(watchCommentEvents),
  ]);
}
