import { call, takeLatest, put, all } from "redux-saga/effects";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import { validateResponse } from "sagas/ErrorSagas";
import OrgApi, {
  FetchOrgRolesResponse,
  FetchOrgsResponse,
  SaveOrgRequest,
  FetchOrgRequest,
  FetchOrgResponse,
} from "api/OrgApi";
import { ApiResponse } from "api/ApiResponses";

export function* fetchRolesSaga() {
  try {
    const response: FetchOrgRolesResponse = yield call(OrgApi.fetchRoles);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ORG_ROLES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    console.log(error);
    yield put({
      type: ReduxActionErrorTypes.FETCH_ORG_ROLES_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* fetchOrgsSaga() {
  try {
    const response: FetchOrgsResponse = yield call(OrgApi.fetchOrgs);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ORGS_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    console.log(error);
    yield put({
      type: ReduxActionErrorTypes.FETCH_ORGS_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* fetchOrgSaga(action: ReduxAction<FetchOrgRequest>) {
  try {
    const request: FetchOrgRequest = action.payload;
    const response: FetchOrgResponse = yield call(OrgApi.fetchOrg, request);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ORG_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    console.log(error);
    yield put({
      type: ReduxActionErrorTypes.FETCH_ORG_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* saveOrgSaga(action: ReduxAction<SaveOrgRequest>) {
  try {
    const request: SaveOrgRequest = action.payload;
    const response: ApiResponse = yield call(OrgApi.saveOrg, request);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.SAVE_ORG_SUCCESS,
      });
    }
  } catch (error) {
    console.log(error);
    yield put({
      type: ReduxActionErrorTypes.SAVE_ORG_ERROR,
      payload: {
        error,
      },
    });
  }
}

export default function* orgSagas() {
  yield all([
    takeLatest(ReduxActionTypes.FETCH_ORG_ROLES_INIT, fetchRolesSaga),
    takeLatest(ReduxActionTypes.FETCH_ORG_INIT, fetchOrgSaga),
    takeLatest(ReduxActionTypes.FETCH_ORGS_INIT, fetchOrgsSaga),
    takeLatest(ReduxActionTypes.SAVE_ORG_INIT, saveOrgSaga),
  ]);
}
