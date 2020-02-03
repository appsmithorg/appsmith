import { call, takeLatest, put, all } from "redux-saga/effects";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionWithPromise,
} from "constants/ReduxActionConstants";
import {
  validateResponse,
  callAPI,
  getResponseErrorMessage,
} from "sagas/ErrorSagas";
import OrgApi, {
  FetchOrgRolesResponse,
  FetchOrgsResponse,
  SaveOrgRequest,
  FetchOrgRequest,
  FetchOrgResponse,
  CreateOrgRequest,
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
    yield put({
      type: ReduxActionErrorTypes.SAVE_ORG_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* createOrgSaga(
  action: ReduxActionWithPromise<CreateOrgRequest>,
) {
  const { resolve, reject, name } = action.payload;
  try {
    const request: CreateOrgRequest = { name };
    const response: ApiResponse = yield callAPI(OrgApi.createOrg, request);
    const isValidResponse = yield validateResponse(response);
    if (!isValidResponse) {
      const errorMessage = yield getResponseErrorMessage(response);
      yield call(reject, { _error: errorMessage });
    } else {
      yield put({
        type: ReduxActionTypes.CREATE_ORGANIZATION_SUCCESS,
        payload: response.data,
      });

      yield put({
        type: ReduxActionTypes.SWITCH_ORGANIZATION_INIT,
        payload: {
          orgId: response.data.id,
        },
      });
      yield call(resolve);
    }
  } catch (error) {
    yield call(reject, { _error: error.message });
    yield put({
      type: ReduxActionErrorTypes.CREATE_ORGANIZATION_ERROR,
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
    takeLatest(ReduxActionTypes.CREATE_ORGANIZATION_INIT, createOrgSaga),
  ]);
}
