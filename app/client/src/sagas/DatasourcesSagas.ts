import { all, put, takeEvery } from "redux-saga/effects";
import { change } from "redux-form";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "../constants/ReduxActionConstants";
import { GenericApiResponse } from "../api/ApiResponses";
import DatasourcesApi, {
  CreateDatasourceConfig,
  Datasource,
} from "../api/DatasourcesApi";
import { API_EDITOR_FORM_NAME } from "../constants/forms";

function* fetchDatasourcesSaga() {
  const response: GenericApiResponse<
    Datasource[]
  > = yield DatasourcesApi.fetchDatasources();
  if (response.responseMeta.success) {
    yield put({
      type: ReduxActionTypes.FETCH_DATASOURCES_SUCCESS,
      payload: response.data,
    });
  } else {
    yield put({
      type: ReduxActionErrorTypes.FETCH_DATASOURCES_ERROR,
      payload: response.responseMeta.status,
    });
  }
}

function* createDatasourceSaga(
  actionPayload: ReduxAction<CreateDatasourceConfig>,
) {
  const response: GenericApiResponse<
    Datasource
  > = yield DatasourcesApi.createDatasource(actionPayload.payload);
  if (response.responseMeta.success) {
    yield put({
      type: ReduxActionTypes.CREATE_DATASOURCE_SUCCESS,
      payload: response.data,
    });
    yield put(change(API_EDITOR_FORM_NAME, "datasourceId", response.data.id));
  } else {
    yield put({
      type: ReduxActionTypes.CREATE_DATASOURCES_ERROR,
      payload: response.responseMeta.error,
    });
  }
}

export function* watchDatasourcesSagas() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_DATASOURCES_INIT, fetchDatasourcesSaga),
    takeEvery(ReduxActionTypes.CREATE_DATASOURCE_INIT, createDatasourceSaga),
  ]);
}
