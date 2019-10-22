import { all, put, takeEvery } from "redux-saga/effects";
import { change } from "redux-form";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "../constants/ReduxActionConstants";
import { GenericApiResponse } from "../api/ApiResponses";
import ResourcesApi, {
  CreateResourceConfig,
  Resource,
} from "../api/ResourcesApi";

function* fetchResourcesSaga() {
  const response: GenericApiResponse<
    Resource[]
  > = yield ResourcesApi.fetchResources();
  if (response.responseMeta.success) {
    yield put({
      type: ReduxActionTypes.FETCH_RESOURCES_SUCCESS,
      payload: response.data,
    });
  } else {
    yield put({
      type: ReduxActionErrorTypes.FETCH_RESOURCES_ERROR,
      payload: response.responseMeta.status,
    });
  }
}

function* createResourceSaga(actionPayload: ReduxAction<CreateResourceConfig>) {
  const response: GenericApiResponse<
    Resource
  > = yield ResourcesApi.createResource(actionPayload.payload);
  if (response.responseMeta.success) {
    yield put({
      type: ReduxActionTypes.CREATE_RESOURCE_SUCCESS,
      payload: response.data,
    });
    yield put(change("ApiEditorForm", "resourceId", response.data.id));
  } else {
    yield put({
      type: ReduxActionTypes.CREATE_RESOURCE_ERROR,
      payload: response.responseMeta.error,
    });
  }
}

export function* watchResourcesSagas() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_RESOURCES_INIT, fetchResourcesSaga),
    takeEvery(ReduxActionTypes.CREATE_RESOURCE_INIT, createResourceSaga),
  ]);
}
