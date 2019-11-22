import { all, call, put, takeLatest } from "redux-saga/effects";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "../constants/ReduxActionConstants";

import ConfigsApi, { PropertyPaneConfigsResponse } from "../api/ConfigsApi";

import { validateResponse } from "./ErrorSagas";

export function* fetchPropertyPaneConfigsSaga() {
  try {
    const response: PropertyPaneConfigsResponse = yield call(
      ConfigsApi.fetchPropertyPane,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_PROPERTY_PANE_CONFIGS_SUCCESS,
        payload: {
          config: response.data.config,
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_PROPERTY_PANE_CONFIGS_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* configsSaga() {
  try {
    const sagasToCall = [];
    sagasToCall.push(call(fetchPropertyPaneConfigsSaga));
    // sagasToCall.push(call(fetchWidgetCardsConfigsSaga, widgetCardsPaneId));
    // sagasToCall.push(call(fetchWidgetConfigsSaga, widgetConfigsId));
    yield all(sagasToCall);
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_CONFIGS_ERROR,
      payload: {
        error,
      },
    });
  }
}

export default function* configsSagas() {
  yield takeLatest(ReduxActionTypes.FETCH_CONFIGS_INIT, configsSaga);
}
