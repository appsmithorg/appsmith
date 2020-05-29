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
  FetchAllUsersResponse,
  FetchAllUsersRequest,
  FetchAllRolesRequest,
  FetchAllRolesResponse,
  DeleteOrgUserRequest,
  ChangeUserRoleRequest,
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

export function* fetchAllUsersSaga(action: ReduxAction<FetchAllUsersRequest>) {
  try {
    const request: FetchAllUsersRequest = action.payload;
    const response: FetchAllUsersResponse = yield call(
      OrgApi.fetchAllUsers,
      request,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ALL_USERS_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ALL_USERS_ERROR,
    });
  }
}

export function* changeOrgUserRoleSaga(
  action: ReduxAction<ChangeUserRoleRequest>,
) {
  try {
    const request: ChangeUserRoleRequest = action.payload;
    const response: ApiResponse = yield call(OrgApi.changeOrgUserRole, request);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CHANGE_ORG_USER_ROLE_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CHANGE_ORG_USER_ROLE_ERROR,
    });
  }
}

export function* deleteOrgUserSaga(action: ReduxAction<DeleteOrgUserRequest>) {
  try {
    const request: DeleteOrgUserRequest = action.payload;
    const response: ApiResponse = yield call(OrgApi.deleteOrgUser, request);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_ORG_USER_SUCCESS,
        payload: {
          username: action.payload.username,
        },
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_ORG_USER_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* fetchAllRolesSaga(action: ReduxAction<DeleteOrgUserRequest>) {
  try {
    const response: FetchAllRolesResponse = yield call(OrgApi.fetchAllRoles);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ALL_ROLES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ALL_ROLES_ERROR,
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
    takeLatest(ReduxActionTypes.SAVE_ORG_INIT, saveOrgSaga),
    takeLatest(ReduxActionTypes.CREATE_ORGANIZATION_INIT, createOrgSaga),
    takeLatest(ReduxActionTypes.FETCH_ALL_USERS_INIT, fetchAllUsersSaga),
    takeLatest(ReduxActionTypes.FETCH_ALL_ROLES_INIT, fetchAllRolesSaga),
    takeLatest(ReduxActionTypes.DELETE_ORG_USER_INIT, deleteOrgUserSaga),
    takeLatest(
      ReduxActionTypes.CHANGE_ORG_USER_ROLE_INIT,
      changeOrgUserRoleSaga,
    ),
  ]);
}
