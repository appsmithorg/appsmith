export * from "ce/sagas/ApplicationSagas";
import {
  publishApplicationSaga,
  updateApplicationLayoutSaga,
  updateApplicationSaga,
  changeAppViewAccessSaga,
  getAllApplicationSaga,
  fetchAppAndPagesSaga,
  forkApplicationSaga,
  createApplicationSaga,
  setDefaultApplicationPageSaga,
  deleteApplicationSaga,
  importApplicationSaga,
  fetchReleases,
  initDatasourceConnectionDuringImport,
  showReconnectDatasourcesModalSaga,
  fetchUnconfiguredDatasourceList,
  uploadNavigationLogoSaga,
  deleteNavigationLogoSaga,
} from "ce/sagas/ApplicationSagas";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { ReduxActionWithPromise } from "@appsmith/constants/ReduxActionConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type {
  ChangeAppUserRoleRequest,
  DeleteApplicationUserRequest,
  FetchAllAppRolesRequest,
  FetchAllAppRolesResponse,
  FetchAllAppUsersRequest,
  FetchAllAppUsersResponse,
  InviteUserToAppRequest,
} from "@appsmith/api/ApplicationApi";
import ApplicationApi from "@appsmith/api/ApplicationApi";
import {
  callAPI,
  getResponseErrorMessage,
  validateResponse,
} from "sagas/ErrorSagas";
import type { ApiResponse } from "api/ApiResponses";
import { INVITE_USERS_TO_WORKSPACE_FORM } from "@appsmith/constants/forms";
import { reset } from "redux-form";
import type { User } from "constants/userConstants";
import { getCurrentUser } from "selectors/usersSelectors";
import history from "utils/history";
import { APPLICATIONS_URL } from "constants/routes";
import { toast } from "design-system";

export function* fetchAllAppUsersSaga(
  action: ReduxAction<FetchAllAppUsersRequest>,
) {
  try {
    const request: FetchAllAppUsersRequest = action.payload;
    const response: FetchAllAppUsersResponse = yield call(
      ApplicationApi.fetchApplicationUsers,
      request,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      const users = response.data.map((user: any) => ({
        ...user,
        isDeleting: false,
        isChangingRole: false,
      }));
      yield put({
        type: ReduxActionTypes.FETCH_ALL_APP_USERS_SUCCESS,
        payload: users,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ALL_APP_USERS_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* fetchAllAppRolesSaga(
  action: ReduxAction<FetchAllAppRolesRequest>,
) {
  try {
    const request: FetchAllAppRolesRequest = action.payload;
    const response: FetchAllAppRolesResponse = yield call(
      ApplicationApi.fetchApplicationRoles,
      request,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ALL_APP_ROLES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ALL_APP_ROLES_ERROR,
    });
  }
}

export function* fetchAppDefaultRolesSaga() {
  try {
    const response: FetchAllAppRolesResponse = yield call(
      ApplicationApi.fetchDefaultApplicationRoles,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_APP_DEFAULT_ROLES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_APP_DEFAULT_ROLES_ERROR,
    });
  }
}

export function* inviteUsersToApplicationSaga(
  action: ReduxActionWithPromise<{
    data: InviteUserToAppRequest;
  }>,
) {
  const { data, reject, resolve } = action.payload;
  try {
    const response: ApiResponse = yield callAPI(
      ApplicationApi.inviteUsersToApplication,
      {
        usernames: data.usernames,
        groups: data.groups,
        applicationId: data.applicationId,
        roleType: data.roleType,
      },
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (!isValidResponse) {
      let errorMessage = `${data.usernames}:  `;
      errorMessage += getResponseErrorMessage(response);
      yield call(reject, { _error: errorMessage });
    }
    yield put({
      type: ReduxActionTypes.FETCH_ALL_APP_USERS_INIT,
      payload: {
        applicationId: data.applicationId,
      },
    });
    yield call(resolve);
    yield put(reset(INVITE_USERS_TO_WORKSPACE_FORM));
  } catch (error) {
    yield call(reject, { _error: (error as Error).message });
  }
}

export function* deleteApplicationUserSaga(
  action: ReduxAction<DeleteApplicationUserRequest>,
) {
  try {
    const request: DeleteApplicationUserRequest = action.payload;
    const response: ApiResponse & { data: any } = yield call(
      ApplicationApi.deleteApplicationUser,
      request,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      const currentUser: User | undefined = yield select(getCurrentUser);
      if (currentUser?.username == action.payload.username) {
        history.replace(APPLICATIONS_URL);
      } else {
        yield put({
          type: ReduxActionTypes.DELETE_APPLICATION_USER_SUCCESS,
          payload: {
            username: action.payload.username,
            userGroupId: action.payload.userGroupId,
            applicationId: action.payload.applicationId,
          },
        });
      }
      toast.show(
        `${
          response.data?.username || response.data?.name
        } has been removed successfully`,
        {
          kind: "success",
        },
      );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_APPLICATION_USER_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* changeApplicationUserRoleSaga(
  action: ReduxAction<ChangeAppUserRoleRequest>,
) {
  try {
    const request: ChangeAppUserRoleRequest = action.payload;
    const response: ApiResponse = yield call(
      ApplicationApi.changeApplicationUserRole,
      request,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CHANGE_APPLICATION_USER_ROLE_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CHANGE_APPLICATION_USER_ROLE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export default function* applicationSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.PUBLISH_APPLICATION_INIT,
      publishApplicationSaga,
    ),
    takeLatest(ReduxActionTypes.UPDATE_APP_LAYOUT, updateApplicationLayoutSaga),
    takeLatest(ReduxActionTypes.UPDATE_APPLICATION, updateApplicationSaga),
    takeLatest(
      ReduxActionTypes.CHANGE_APPVIEW_ACCESS_INIT,
      changeAppViewAccessSaga,
    ),
    takeLatest(
      ReduxActionTypes.GET_ALL_APPLICATION_INIT,
      getAllApplicationSaga,
    ),
    takeLatest(ReduxActionTypes.FETCH_APPLICATION_INIT, fetchAppAndPagesSaga),
    takeLatest(ReduxActionTypes.FORK_APPLICATION_INIT, forkApplicationSaga),
    takeLatest(ReduxActionTypes.CREATE_APPLICATION_INIT, createApplicationSaga),
    takeLatest(
      ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_INIT,
      setDefaultApplicationPageSaga,
    ),
    takeLatest(ReduxActionTypes.DELETE_APPLICATION_INIT, deleteApplicationSaga),
    takeLatest(ReduxActionTypes.IMPORT_APPLICATION_INIT, importApplicationSaga),
    takeLatest(
      ReduxActionTypes.UPLOAD_NAVIGATION_LOGO_INIT,
      uploadNavigationLogoSaga,
    ),
    takeLatest(
      ReduxActionTypes.DELETE_NAVIGATION_LOGO_INIT,
      deleteNavigationLogoSaga,
    ),
    takeLatest(ReduxActionTypes.FETCH_RELEASES, fetchReleases),
    takeLatest(
      ReduxActionTypes.INIT_DATASOURCE_CONNECTION_DURING_IMPORT_REQUEST,
      initDatasourceConnectionDuringImport,
    ),
    takeLatest(
      ReduxActionTypes.SHOW_RECONNECT_DATASOURCE_MODAL,
      showReconnectDatasourcesModalSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_UNCONFIGURED_DATASOURCE_LIST,
      fetchUnconfiguredDatasourceList,
    ),
    takeLatest(ReduxActionTypes.FETCH_ALL_APP_USERS_INIT, fetchAllAppUsersSaga),
    takeLatest(ReduxActionTypes.FETCH_ALL_APP_ROLES_INIT, fetchAllAppRolesSaga),
    takeLatest(
      ReduxActionTypes.FETCH_APP_DEFAULT_ROLES_INIT,
      fetchAppDefaultRolesSaga,
    ),
    takeLatest(
      ReduxActionTypes.INVITE_USERS_TO_APPLICATION_INIT,
      inviteUsersToApplicationSaga,
    ),
    takeLatest(
      ReduxActionTypes.DELETE_APPLICATION_USER_INIT,
      deleteApplicationUserSaga,
    ),
    takeLatest(
      ReduxActionTypes.CHANGE_APPLICATION_USER_ROLE_INIT,
      changeApplicationUserRoleSaga,
    ),
  ]);
}
