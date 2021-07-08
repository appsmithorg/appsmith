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
} from "actions/jsActionActions";
import { getJSAction, getJSActions } from "selectors/entitiesSelector";
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
  ACTION_CREATED_SUCCESS,
  createMessage,
  ACTION_DELETE_SUCCESS,
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
    // yield put(createJSActionSuccess(newFunction));
    const response: JSActionCreateUpdateResponse = yield JSActionAPI.createJSAction(
      payload,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      const actionName = actionPayload.payload.name
        ? actionPayload.payload.name
        : "";
      Toaster.show({
        text: createMessage(ACTION_CREATED_SUCCESS, actionName),
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
  console.log("copy", action);
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
  console.log("move", action);
  //move js action
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
        text: createMessage(ACTION_DELETE_SUCCESS, response.data.name),
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
    takeLatest(ReduxActionTypes.MOVE_JS_ACTION_INIT, moveJSActionSaga),
    takeEvery(ReduxActionTypes.MOVE_JS_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeLatest(ReduxActionTypes.DELETE_JS_ACTION_INIT, deleteJSActionSaga),
  ]);
}
