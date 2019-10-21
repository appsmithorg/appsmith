import { all, call, put, takeLatest } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "../constants/ReduxActionConstants";

import PropertyPaneConfigsApi, {
  PropertyPaneConfigsResponse,
  PropertyPaneConfigsRequest,
} from "../api/PropertPaneConfigsApi";

import { EditorConfigIdsType } from "../actions/configsActions";

import { validateResponse } from "./ErrorSagas";

export function* fetchPropertyPaneConfigsSaga(propertyPaneConfigsId: string) {
  const request: PropertyPaneConfigsRequest = { propertyPaneConfigsId };
  try {
    const response: PropertyPaneConfigsResponse = yield call(
      PropertyPaneConfigsApi.fetch,
      request,
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

export function* configsSaga(configsIds: ReduxAction<EditorConfigIdsType>) {
  const {
    propertyPaneConfigsId,
    widgetCardsPaneId,
    widgetConfigsId,
  } = configsIds.payload;
  try {
    const sagasToCall = [];
    if (propertyPaneConfigsId) {
      sagasToCall.push(
        call(fetchPropertyPaneConfigsSaga, propertyPaneConfigsId),
      );
    }
    if (widgetCardsPaneId) {
      // sagasToCall.push(call(fetchWidgetCardsConfigsSaga, widgetCardsPaneId));
    }
    if (widgetConfigsId) {
      // sagasToCall.push(call(fetchWidgetConfigsSaga, widgetConfigsId));
    }
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
