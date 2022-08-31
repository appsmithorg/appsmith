import AclApi, { FetchSingleDataPayload } from "@appsmith/api/AclApi";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { takeLatest, all, call, put } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";

import { ApiResponse } from "api/ApiResponses";
import { User } from "constants/userConstants";

export function* fetchAclUsersSaga() {
  try {
    const response: ApiResponse = yield call(AclApi.fetchAclUsers);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACL_USERS_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionTypes.FETCH_ACL_USERS_ERROR,
      });
    }
  } catch (e) {
    yield put({
      type: ReduxActionTypes.FETCH_ACL_USERS_ERROR,
    });
  }
}

export function* deleteAclUserSaga(action: ReduxAction<any>) {
  try {
    const response: ApiResponse = yield AclApi.deleteAclUser(action.payload);

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_ACL_USER_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionTypes.DELETE_ACL_USER_ERROR,
      });
    }
  } catch (e) {
    yield put({
      type: ReduxActionTypes.DELETE_ACL_USER_ERROR,
    });
  }
}

export function* fetchAclUserSagaById(
  action: ReduxAction<FetchSingleDataPayload>,
) {
  try {
    const response: ApiResponse = yield AclApi.fetchSingleAclUser(
      action.payload,
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACL_USER_BY_ID_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionTypes.FETCH_ACL_USER_BY_ID_ERROR,
      });
    }
  } catch (e) {
    yield put({
      type: ReduxActionTypes.FETCH_ACL_USER_BY_ID_ERROR,
    });
  }
}

export function* fetchAclGroupsSaga() {
  try {
    const response: ApiResponse = yield call(AclApi.fetAclGroups);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACL_GROUP_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionTypes.FETCH_ACL_GROUP_ERROR,
      });
    }
  } catch (e) {
    yield put({
      type: ReduxActionTypes.FETCH_ACL_GROUP_ERROR,
    });
  }
}

export function* fetchAclGroupSagaById(
  action: ReduxAction<FetchSingleDataPayload>,
) {
  try {
    const response: ApiResponse = yield AclApi.fetchSingleAclGroup(
      action.payload,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACL_GROUP_BY_ID_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionTypes.FETCH_ACL_GROUP_BY_ID_ERROR,
      });
    }
  } catch (e) {
    yield put({
      type: ReduxActionTypes.FETCH_ACL_GROUP_BY_ID_ERROR,
    });
  }
}

export function* deleteAclGroupSaga(action: ReduxAction<any>) {
  try {
    const response: ApiResponse = yield AclApi.deleteAclGroup(action.payload);

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_ACL_GROUP_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionTypes.DELETE_ACL_GROUP_ERROR,
      });
    }
  } catch (e) {
    yield put({
      type: ReduxActionTypes.DELETE_ACL_GROUP_ERROR,
    });
  }
}

export function* cloneGroupSaga(action: ReduxAction<any>) {
  try {
    const response: ApiResponse = yield AclApi.cloneAclGroup(action.payload);

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CLONE_ACL_GROUP_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionTypes.CLONE_ACL_GROUP_ERROR,
      });
    }
  } catch (e) {
    yield put({
      type: ReduxActionTypes.CLONE_ACL_GROUP_ERROR,
    });
  }
}

export function* fetchAclRolesSaga() {
  try {
    const response: ApiResponse = yield call(AclApi.fetchAclRoles);
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACL_ROLE_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionTypes.FETCH_ACL_ROLE_ERROR,
      });
    }
  } catch (e) {
    yield put({
      type: ReduxActionTypes.FETCH_ACL_ROLE_ERROR,
    });
  }
}

export function* fetchAclRoleSagaById(
  action: ReduxAction<FetchSingleDataPayload>,
) {
  try {
    const response: ApiResponse = yield AclApi.fetchSingleRole(action.payload);

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACL_ROLE_BY_ID_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionTypes.FETCH_ACL_ROLE_BY_ID_ERROR,
      });
    }
  } catch (e) {
    yield put({
      type: ReduxActionTypes.FETCH_ACL_ROLE_BY_ID_ERROR,
    });
  }
}

export function* deleteAclRoleSaga(action: ReduxAction<any>) {
  try {
    const response: ApiResponse = yield AclApi.deleteAclRole(action.payload);

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_ACL_ROLE_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionTypes.DELETE_ACL_ROLE_ERROR,
      });
    }
  } catch (e) {
    yield put({
      type: ReduxActionTypes.DELETE_ACL_ROLE_ERROR,
    });
  }
}

export function* cloneRoleSaga(action: ReduxAction<any>) {
  try {
    const response: ApiResponse = yield AclApi.cloneAclRole(action.payload);

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CLONE_ACL_ROLE_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionTypes.CLONE_ACL_ROLE_ERROR,
      });
    }
  } catch (e) {
    yield put({
      type: ReduxActionTypes.CLONE_ACL_ROLE_ERROR,
    });
  }
}

export function* InitAclSaga(action: ReduxAction<User>) {
  const user = action.payload;
  if (user.isSuperUser) {
    yield all([
      takeLatest(ReduxActionTypes.FETCH_ACL_USERS, fetchAclUsersSaga),
      takeLatest(ReduxActionTypes.FETCH_ACL_USER_BY_ID, fetchAclUserSagaById),
      takeLatest(ReduxActionTypes.FETCH_ACL_GROUP, fetchAclGroupsSaga),
      takeLatest(ReduxActionTypes.FETCH_ACL_GROUP_BY_ID, fetchAclGroupSagaById),
      takeLatest(ReduxActionTypes.FETCH_ACL_ROLE, fetchAclRolesSaga),
      takeLatest(ReduxActionTypes.FETCH_ACL_ROLE_BY_ID, fetchAclRoleSagaById),
      // takeLatest(ReduxActionTypes.CREATE_ACL_USER, createAclUserSaga),
      // takeLatest(ReduxActionTypes.CREATE_ACL_GROUP, createAclGroupSaga),
      // takeLatest(
      //   ReduxActionTypes.CREATE_ACL_ROLE,
      //   createAclRoleSaga,
      // ),
      // takeLatest(ReduxActionTypes.CREATE_ACL_USER, createAclUserSaga),
      // takeLatest(ReduxActionTypes.CREATE_ACL_GROUP, createAclGroupSaga),
      // takeLatest(
      //   ReduxActionTypes.CREATE_ACL_ROLE,
      //   createAclRoleSaga,
      // ),
      takeLatest(ReduxActionTypes.DELETE_ACL_USER, deleteAclUserSaga),
      takeLatest(ReduxActionTypes.DELETE_ACL_GROUP, deleteAclGroupSaga),
      takeLatest(ReduxActionTypes.DELETE_ACL_ROLE, deleteAclRoleSaga),
      takeLatest(ReduxActionTypes.CLONE_ACL_GROUP, cloneGroupSaga),
      takeLatest(ReduxActionTypes.CLONE_ACL_ROLE, cloneRoleSaga),
    ]);
  }
}

export default function* AclSagas() {
  yield takeLatest(ReduxActionTypes.FETCH_USER_DETAILS_SUCCESS, InitAclSaga);
}
