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
  select,
} from "redux-saga/effects";
// import { updateLayout, getTestComments } from "comments/init";
import {
  COMMENT_EVENTS_CHANNEL,
  // COMMENT_EVENTS,
} from "constants/CommentConstants";
import handleCommentEvents from "./handleCommentEvents";
import {
  // commentEvent,
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
} from "actions/commentActions";
import {
  transformPublishedCommentActionPayload,
  transformUnpublishCommentThreadToCreateNew,
} from "comments/utils";

import CommentsApi from "api/CommentsAPI";

// import { getAppsmithConfigs } from "configs";

import { validateResponse } from "../ErrorSagas";

import {
  getCurrentApplicationId,
  getIsEditorInitialized,
} from "selectors/editorSelectors";
import { getIsInitialized as getIsViewerInitialized } from "selectors/appViewSelectors";
import {
  AddCommentToCommentThreadRequestPayload,
  CreateCommentThreadPayload,
  CreateCommentThreadRequest,
} from "entities/Comments/CommentsInterfaces";
import { RawDraftContentState } from "draft-js";

// const { commentsTestModeEnabled } = getAppsmithConfigs();
// export function* initCommentThreads() {
//   if (!commentsTestModeEnabled) return;
//   try {
//     yield race([
//       take(ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS),
//       take(ReduxActionTypes.INITIALIZE_PAGE_VIEWER_SUCCESS),
//     ]);
//     yield put(updateLayout());
//     yield put(
//       commentEvent({
//         type: COMMENT_EVENTS.SET_COMMENTS,
//         payload: getTestComments(),
//       }),
//     );
//   } catch (err) {
//     console.log(err, "err");
//   }
// }

function* watchCommentEvents() {
  const requestChan = yield actionChannel(COMMENT_EVENTS_CHANNEL);
  while (true) {
    const { payload } = yield take(requestChan);
    yield fork(handleCommentEvents, payload);
  }
}

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
  const response = yield call(CommentsApi.createNewThread, {
    ...newCommentThreadPayload,
    applicationId,
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
  const { commentBody, commentThread, callback } = payload;

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
    const isEditorInitialised = yield select(getIsEditorInitialized);
    const isViewerInitialized = yield select(getIsViewerInitialized);
    if (!isEditorInitialised && !isViewerInitialized) {
      yield race([
        take(ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS),
        take(ReduxActionTypes.INITIALIZE_PAGE_VIEWER_SUCCESS),
      ]);
    }

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
    const { threadId, resolved } = action.payload;
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
    const { commentId, commentThreadId, body } = action.payload;
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

export default function* commentSagas() {
  yield all([
    // takeLatest(ReduxActionTypes.INIT_COMMENT_THREADS, initCommentThreads),
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
    call(watchCommentEvents),
    takeLatest(ReduxActionTypes.PIN_COMMENT_THREAD_REQUEST, pinCommentThread),
    takeLatest(ReduxActionTypes.DELETE_COMMENT_REQUEST, deleteComment),
    takeLatest(ReduxActionTypes.MARK_THREAD_AS_READ_REQUEST, markThreadAsRead),
    takeLatest(ReduxActionTypes.EDIT_COMMENT_REQUEST, editComment),
    takeLatest(ReduxActionTypes.DELETE_THREAD_REQUEST, deleteCommentThread),
  ]);
}
