import {
  ReduxAction,
  EvaluationReduxAction,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { all, put, takeEvery, takeLatest, select } from "redux-saga/effects";
import { FetchActionsPayload } from "actions/actionActions";
import { JSAction } from "entities/JSAction";
import { jsData, newFunction } from "../pages/Editor/JSEditor/dummyData";
import { createJSActionSuccess } from "actions/jsActionActions";
import { getJSAction } from "selectors/entitiesSelector";
import history from "utils/history";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { JS_FUNCTION_ID_URL } from "constants/routes";

export function* fetchJSActionsSaga(
  action: EvaluationReduxAction<FetchActionsPayload>,
) {
  // const { applicationId } = action.payload;
  const resultData = jsData;
  try {
    // const response: GenericApiResponse<JSAction[]> = yield JSActionAPI.fetchJSActions(
    //     applicationId,
    // );
    yield put({
      type: ReduxActionTypes.FETCH_JS_ACTIONS_SUCCESS,
      payload: resultData,
    });
  } catch (error) {
    //error code goes here
  }
}

export function* createJSActionSaga(
  actionPayload: ReduxAction<
    Partial<JSAction> & { eventData: any; pluginId: string }
  >,
) {
  try {
    // const payload = actionPayload.payload;
    let count = 100;
    const id = count++;
    yield put(createJSActionSuccess(newFunction));
    //DO NOT REMOVE this will be used
    // const response: JSActionCreateUpdateResponse = yield JSActionAPI.createJSAction(
    //   payload,
    // );
    // const isValidResponse = yield validateResponse(response);
    // if (isValidResponse) {
    //   const actionName = actionPayload.payload.name
    //     ? actionPayload.payload.name
    //     : "";
    //   Toaster.show({
    //     text: createMessage(ACTION_CREATED_SUCCESS, actionName),
    //     variant: Variant.success,
    //   });

    //   const pageName = yield select(
    //     getCurrentPageNameByActionId,
    //     response.data.id,
    //   );

    //   const newAction = response.data;
    //   yield put(createActionSuccess(newAction));
    // }
  } catch (error) {
    // yield put({
    //   type: ReduxActionErrorTypes.CREATE_JS_ACTION_ERROR,
    //   payload: actionPayload.payload,
    // });
  }
}
function* copyJSActionSaga(
  action: ReduxAction<{ id: string; destinationPageId: string; name: string }>,
) {
  //this is copy js saga
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
  //move js action
}

export function* deleteJSActionSaga(
  actionPayload: ReduxAction<{ id: string; name: string }>,
) {
  //delete js action
}

export function* watchJSActionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_JS_ACTIONS_INIT, fetchJSActionsSaga),
    takeEvery(ReduxActionTypes.CREATE_JS_ACTION_INIT, createJSActionSaga),
    takeLatest(ReduxActionTypes.COPY_JS_ACTION_INIT, copyJSActionSaga),
    takeEvery(ReduxActionTypes.COPY_JS_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeLatest(ReduxActionTypes.MOVE_JS_ACTION_INIT, moveJSActionSaga),
    takeEvery(ReduxActionTypes.MOVE_JS_ACTION_SUCCESS, handleMoveOrCopySaga),
    takeLatest(ReduxActionTypes.DELETE_ACTION_INIT, deleteJSActionSaga),
  ]);
}
