import {
  ReduxAction,
  EvaluationReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { all, put, takeEvery, takeLatest, select } from "redux-saga/effects";
import { FetchActionsPayload } from "actions/actionActions";
import { JSAction } from "entities/JSAction";
import {
  createJSActionSuccess,
  deleteJSActionSuccess,
  copyJSActionSuccess,
  copyJSActionError,
  moveJSActionSuccess,
  moveJSActionError,
} from "actions/jsActionActions";
import {
  getJSAction,
  getJSActions,
  getPageNameByPageId,
} from "selectors/entitiesSelector";
import history from "utils/history";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { JS_FUNCTION_ID_URL } from "constants/routes";
import JSActionAPI, { JSActionCreateUpdateResponse } from "api/JSActionAPI";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import {
  createMessage,
  JS_ACTION_COPY_SUCCESS,
  ERROR_JS_ACTION_COPY_FAIL,
  JS_ACTION_DELETE_SUCCESS,
  JS_ACTION_CREATED_SUCCESS,
  JS_ACTION_MOVE_SUCCESS,
  ERROR_JS_ACTION_MOVE_FAIL,
} from "constants/messages";
import { validateResponse } from "./ErrorSagas";

export function* fetchJSActionsSaga(
  action: EvaluationReduxAction<FetchActionsPayload>,
) {
  const { applicationId } = action.payload;
  try {
    const response = yield JSActionAPI.fetchJSActions(applicationId);
    yield put({
      type: ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_JS_ACTIONS_ERROR,
      payload: { error },
    });
  }
}

export function* createJSActionSaga(
  actionPayload: ReduxAction<
    Partial<JSAction> & { eventData: any; pluginId: string }
  >,
) {
  try {
    const payload = actionPayload.payload;
    const response: JSActionCreateUpdateResponse = yield JSActionAPI.createJSAction(
      payload,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      const actionName = actionPayload.payload.name
        ? actionPayload.payload.name
        : "";
      Toaster.show({
        text: createMessage(JS_ACTION_CREATED_SUCCESS, actionName),
        variant: Variant.success,
      });

      // const pageName = yield select(
      //   getCurrentPageNameByJSActionId,
      //   response.data.id,
      // );

      const newAction = response.data;
      yield put(createJSActionSuccess(newAction));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_JS_ACTION_ERROR,
      payload: actionPayload.payload,
    });
  }
}
function* copyJSActionSaga(
  action: ReduxAction<{ id: string; destinationPageId: string; name: string }>,
) {
  const actionObject: JSAction = yield select(getJSAction, action.payload.id);
  try {
    if (!actionObject) throw new Error("Could not find js collection to copy");
    const copyJSAction = Object.assign({}, actionObject, {
      name: action.payload.name,
      pageId: action.payload.destinationPageId,
    }) as Partial<JSAction>;
    delete copyJSAction.id;
    const response = yield JSActionAPI.createJSAction(copyJSAction);

    const isValidResponse = yield validateResponse(response);
    const pageName = yield select(getPageNameByPageId, response.data.pageId);
    if (isValidResponse) {
      Toaster.show({
        text: createMessage(
          JS_ACTION_COPY_SUCCESS,
          actionObject.name,
          pageName,
        ),
        variant: Variant.success,
      });
      const payload = response.data;

      yield put(copyJSActionSuccess(payload));
    }
  } catch (e) {
    const actionName = actionObject ? actionObject.name : "";
    Toaster.show({
      text: createMessage(ERROR_JS_ACTION_COPY_FAIL, actionName),
      variant: Variant.danger,
    });
    yield put(copyJSActionError(action.payload));
  }
}

function* handleMoveOrCopySaga(actionPayload: ReduxAction<{ id: string }>) {
  const { id } = actionPayload.payload;
  const jsAction: JSAction = yield select(getJSAction, id);
  const applicationId = yield select(getCurrentApplicationId);
  history.push(JS_FUNCTION_ID_URL(applicationId, jsAction.pageId, jsAction.id));
}

function* moveJSActionSaga(
  action: ReduxAction<{
    id: string;
    destinationPageId: string;
    originalPageId: string;
    name: string;
  }>,
) {
  const actionObject: JSAction = yield select(getJSAction, action.payload.id);
  try {
    const response = yield JSActionAPI.moveJSAction({
      action: {
        ...actionObject,
        pageId: action.payload.originalPageId,
        name: action.payload.name,
      },
      destinationPageId: action.payload.destinationPageId,
    });

    const isValidResponse = yield validateResponse(response);
    const pageName = yield select(getPageNameByPageId, response.data.pageId);
    if (isValidResponse) {
      Toaster.show({
        text: createMessage(
          JS_ACTION_MOVE_SUCCESS,
          response.data.name,
          pageName,
        ),
        variant: Variant.success,
      });
    }
    yield put(moveJSActionSuccess(response.data));
  } catch (e) {
    Toaster.show({
      text: createMessage(ERROR_JS_ACTION_MOVE_FAIL, actionObject.name),
      variant: Variant.danger,
    });
    yield put(
      moveJSActionError({
        id: action.payload.id,
        originalPageId: action.payload.originalPageId,
      }),
    );
  }
}

export function* deleteJSActionSaga(
  actionPayload: ReduxAction<{ id: string; name: string }>,
) {
  try {
    const id = actionPayload.payload.id;
    const jsActions = yield select(getJSActions);

    const response = yield JSActionAPI.deleteJSAction(id);
    const isValidResponse = yield validateResponse(response);
    const applicationId = yield select(getCurrentApplicationId);
    const pageId = yield select(getCurrentPageId);
    if (isValidResponse) {
      Toaster.show({
        text: createMessage(JS_ACTION_DELETE_SUCCESS, response.data.name),
        variant: Variant.success,
      });
      if (jsActions.length > 0) {
        const jsAction = jsActions[jsActions.length - 1];
        const id = jsAction.config.id;
        history.push(JS_FUNCTION_ID_URL(applicationId, pageId, id));
      }
      yield put(deleteJSActionSuccess({ id }));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_ACTION_ERROR,
      payload: { error, id: actionPayload.payload.id },
    });
  }
}

export function* watchJSActionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_JS_ACTIONS_INIT, fetchJSActionsSaga),
    takeEvery(ReduxActionTypes.CREATE_JS_ACTION_INIT, createJSActionSaga),
    takeLatest(ReduxActionTypes.COPY_JS_ACTION_INIT, copyJSActionSaga),
    takeEvery(ReduxActionTypes.COPY_JS_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeEvery(ReduxActionErrorTypes.COPY_JS_ACTION_ERROR, handleMoveOrCopySaga),
    takeLatest(ReduxActionTypes.MOVE_JS_ACTION_INIT, moveJSActionSaga),
    takeEvery(ReduxActionErrorTypes.MOVE_JS_ACTION_ERROR, handleMoveOrCopySaga),
    takeEvery(ReduxActionTypes.MOVE_JS_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeEvery(ReduxActionTypes.MOVE_JS_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeLatest(ReduxActionTypes.DELETE_JS_ACTION_INIT, deleteJSActionSaga),
  ]);
}
