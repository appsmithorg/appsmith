import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { put, takeLatest, all, call, select } from "redux-saga/effects";
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
} from "actions/commentActions";
import {
  getNewDragPos,
  transformPublishedCommentActionPayload,
  transformUnpublishCommentThreadToCreateNew,
} from "comments/utils";

import { waitForInit } from "sagas/InitSagas";

import CommentsApi from "api/CommentsAPI";

import { validateResponse } from "../ErrorSagas";

import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  AddCommentToCommentThreadRequestPayload,
  CommentThread,
  CreateCommentThreadPayload,
  CreateCommentThreadRequest,
  DraggedCommentThread,
} from "entities/Comments/CommentsInterfaces";
import { RawDraftContentState } from "draft-js";
import { AppState } from "reducers";
import { TourType } from "entities/Tour";
import { getActiveTourType } from "selectors/tourSelectors";
import { resetActiveTour } from "actions/tourActions";
import store from "store";

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
      yield put(removeUnpublishedCommentThreads());
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_COMMENT_THREAD_ERROR,
      payload: { error, logToSentry: true },
    });
  }
}

function* updateCommentThreadPosition(
  action: ReduxAction<DraggedCommentThread>,
) {
  try {
    const {
      draggingCommentThreadId,
      dragPointerOffset,
    } = store.getState().ui.comments;

    if (!draggingCommentThreadId) return;
    const {
      containerSizePosition,
      dragPosition,
      refId,
      widgetType,
    } = action.payload;
    const position = getNewDragPos(
      {
        x: dragPosition.x + (dragPointerOffset ? dragPointerOffset.x : 0),
        y: dragPosition.y + (dragPointerOffset ? dragPointerOffset.y : 0),
      },
      containerSizePosition,
    );
    const response = yield CommentsApi.updateCommentThread(
      { position, refId, widgetType },
      draggingCommentThreadId,
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
      const commentThreads = response.data as CommentThread[];
      yield put(
        fetchApplicationCommentsSuccess({
          commentThreads,
          applicationId,
        }),
      );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_APPLICATION_COMMENTS_ERROR,
      payload: { error, logToSentry: false },
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

function* unsubscribeCommentThread(action: ReduxAction<string>) {
  try {
    const threadId = action.payload;
    const response = yield CommentsApi.unsubscribeCommentThread(threadId);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.UNSUBSCRIBE_COMMENT_THREAD_SUCCESS,
        payload: null,
      });
    }
  } catch (error) {}
}

function* markThreadAsRead(action: ReduxAction<{ threadId: string }>) {
  try {
    const { threadId } = action.payload;
    const response = yield CommentsApi.updateCommentThread(
      { isViewed: true },
      threadId,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put(updateCommentThreadSuccess(response.data));
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

function* handleSetCommentMode(action: ReduxAction<boolean>) {
  const { payload } = action;
  if (!payload) {
    const activeTourType: TourType | undefined = yield select(
      getActiveTourType,
    );
    if (
      activeTourType &&
      [
        TourType.COMMENTS_TOUR_EDIT_MODE,
        TourType.COMMENTS_TOUR_PUBLISHED_MODE,
      ].indexOf(activeTourType) !== -1
    ) {
      yield put(resetActiveTour());
    }
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
    takeLatest(
      ReduxActionTypes.DRAG_COMMENT_THREAD,
      updateCommentThreadPosition,
    ),
    takeLatest(ReduxActionTypes.PIN_COMMENT_THREAD_REQUEST, pinCommentThread),
    takeLatest(ReduxActionTypes.DELETE_COMMENT_REQUEST, deleteComment),
    takeLatest(ReduxActionTypes.MARK_THREAD_AS_READ_REQUEST, markThreadAsRead),
    takeLatest(
      ReduxActionTypes.UNSUBSCRIBE_COMMENT_THREAD_REQUEST,
      unsubscribeCommentThread,
    ),
    takeLatest(ReduxActionTypes.EDIT_COMMENT_REQUEST, editComment),
    takeLatest(ReduxActionTypes.DELETE_THREAD_REQUEST, deleteCommentThread),
    takeLatest(ReduxActionTypes.ADD_COMMENT_REACTION, addCommentReaction),
    takeLatest(ReduxActionTypes.REMOVE_COMMENT_REACTION, deleteCommentReaction),
    takeLatest(ReduxActionTypes.SET_COMMENT_MODE, handleSetCommentMode),
  ]);
}
