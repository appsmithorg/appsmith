import {
  EvaluationReduxAction,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { all, put, takeEvery } from "redux-saga/effects";
import JSActionAPI from "api/JSActionAPI";
import { GenericApiResponse } from "api/ApiResponses";
import { FetchActionsPayload } from "actions/actionActions";
import { JSAction } from "entities/JSAction";
import _ from "lodash";
import { jsData } from "../pages/Editor/JSEditor/dummyData";

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

export function* watchJSActionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_JS_ACTIONS_INIT, fetchJSActionsSaga),
  ]);
}
