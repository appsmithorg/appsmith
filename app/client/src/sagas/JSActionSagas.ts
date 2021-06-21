import {
  ReduxAction,
  EvaluationReduxAction,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { all, put, takeEvery } from "redux-saga/effects";
import JSActionAPI, { JSActionCreateUpdateResponse } from "api/JSActionAPI";
import { GenericApiResponse } from "api/ApiResponses";
import { FetchActionsPayload } from "actions/actionActions";
import { JSAction } from "entities/JSAction";
import _ from "lodash";
import { jsData, newFunction } from "../pages/Editor/JSEditor/dummyData";
import { createJSActionSuccess } from "actions/jsActionActions";

export function* fetchJSActionsSaga(
  action: EvaluationReduxAction<FetchActionsPayload>,
) {
  const { applicationId } = action.payload;
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
    const payload = actionPayload.payload;
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

export function* watchJSActionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_JS_ACTIONS_INIT, fetchJSActionsSaga),
    takeEvery(ReduxActionTypes.CREATE_JS_ACTION_INIT, createJSActionSaga),
  ]);
}
