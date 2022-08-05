import { call, takeLatest, put, all, select } from "redux-saga/effects";
import {
  ReduxActionTypes,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionWithPromise,
} from "@appsmith/constants/ReduxActionConstants";
import {
  validateResponse,
  callAPI,
  getResponseErrorMessage,
} from "sagas/ErrorSagas";
import WorkspaceApi, {
  FetchWorkspaceRolesResponse,
  SaveWorkspaceRequest,
  FetchWorkspaceRequest,
  FetchWorkspaceResponse,
  CreateWorkspaceRequest,
  FetchAllUsersResponse,
  FetchAllUsersRequest,
  FetchAllRolesResponse,
  DeleteWorkspaceUserRequest,
  ChangeUserRoleRequest,
  FetchAllRolesRequest,
  SaveWorkspaceLogo,
} from "api/WorkspaceApi";
import { ApiResponse } from "api/ApiResponses";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { getCurrentWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import { Workspace } from "constants/workspaceConstants";
import history from "utils/history";
import { APPLICATIONS_URL } from "constants/routes";
import { getAllApplications } from "actions/applicationActions";
import log from "loglevel";
import { User } from "constants/userConstants";
import {
  createMessage,
  DELETE_WORKSPACE_SUCCESSFUL,
} from "@appsmith/constants/messages";

export function* fetchRolesSaga() {
  try {
    const response: FetchWorkspaceRolesResponse = yield call(
      WorkspaceApi.fetchRoles,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_WORKSPACE_ROLES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    log.error(error);
    yield put({
      type: ReduxActionErrorTypes.FETCH_WORKSPACE_ROLES_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* fetchWorkspaceSaga(
  action: ReduxAction<FetchWorkspaceRequest>,
) {
  try {
    const request: FetchWorkspaceRequest = action.payload;
    const response: FetchWorkspaceResponse = yield call(
      WorkspaceApi.fetchWorkspace,
      request,
    );
    const isValidResponse: boolean = yield request.skipValidation ||
      validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_WORKSPACE_SUCCESS,
        payload: response.data || {},
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_WORKSPACE_ERROR,
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
      WorkspaceApi.fetchAllUsers,
      request,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      const users = response.data.map((user) => ({
        ...user,
        isDeleting: false,
        isChangingRole: false,
      }));
      yield put({
        type: ReduxActionTypes.FETCH_ALL_USERS_SUCCESS,
        payload: users,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ALL_USERS_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* changeWorkspaceUserRoleSaga(
  action: ReduxAction<ChangeUserRoleRequest>,
) {
  try {
    const request: ChangeUserRoleRequest = action.payload;
    const response: ApiResponse = yield call(
      WorkspaceApi.changeWorkspaceUserRole,
      request,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.CHANGE_WORKSPACE_USER_ROLE_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CHANGE_WORKSPACE_USER_ROLE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* deleteWorkspaceUserSaga(
  action: ReduxAction<DeleteWorkspaceUserRequest>,
) {
  try {
    const request: DeleteWorkspaceUserRequest = action.payload;
    const response: ApiResponse = yield call(
      WorkspaceApi.deleteWorkspaceUser,
      request,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      const currentUser: User | undefined = yield select(getCurrentUser);
      if (currentUser?.username == action.payload.username) {
        history.replace(APPLICATIONS_URL);
      } else {
        yield put({
          type: ReduxActionTypes.DELETE_WORKSPACE_USER_SUCCESS,
          payload: {
            username: action.payload.username,
          },
        });
      }
      Toaster.show({
        //@ts-expect-error: response is of type unknown
        text: `${response.data.username} has been removed successfully`,
        variant: Variant.success,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_WORKSPACE_USER_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* fetchAllRolesSaga(action: ReduxAction<FetchAllRolesRequest>) {
  try {
    const request: FetchAllRolesRequest = action.payload;
    const response: FetchAllRolesResponse = yield call(
      WorkspaceApi.fetchAllRoles,
      request,
    );
    const isValidResponse: boolean = yield validateResponse(response);
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

export function* saveWorkspaceSaga(action: ReduxAction<SaveWorkspaceRequest>) {
  try {
    const request: SaveWorkspaceRequest = action.payload;
    const response: ApiResponse = yield call(
      WorkspaceApi.saveWorkspace,
      request,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.SAVE_WORKSPACE_SUCCESS,
        payload: request,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_WORKSPACE_ERROR,
      payload: {
        error: (error as Error).message,
      },
    });
  }
}

export function* deleteWorkspaceSaga(action: ReduxAction<string>) {
  try {
    yield put({
      type: ReduxActionTypes.SAVING_WORKSPACE_INFO,
    });
    const workspaceId: string = action.payload;
    const response: ApiResponse = yield call(
      WorkspaceApi.deleteWorkspace,
      workspaceId,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.DELETE_WORKSPACE_SUCCESS,
        payload: workspaceId,
      });
      Toaster.show({
        text: createMessage(DELETE_WORKSPACE_SUCCESSFUL),
        variant: Variant.success,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_WORKSPACE_ERROR,
      payload: {
        error: (error as Error).message,
      },
    });
  }
}

export function* createWorkspaceSaga(
  action: ReduxActionWithPromise<CreateWorkspaceRequest>,
) {
  const { name, reject, resolve } = action.payload;
  try {
    const request: CreateWorkspaceRequest = { name };
    const response: ApiResponse = yield callAPI(
      WorkspaceApi.createWorkspace,
      request,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (!isValidResponse) {
      const errorMessage: string | undefined = yield getResponseErrorMessage(
        response,
      );
      yield call(reject, { _error: errorMessage });
    } else {
      yield put({
        type: ReduxActionTypes.CREATE_WORKSPACE_SUCCESS,
        payload: response.data,
      });

      yield put(getAllApplications());
      yield call(resolve);
    }

    // get created workspace in focus
    // @ts-expect-error: response is of type unknown
    const workspaceId = response.data.id;
    history.push(`${window.location.pathname}#${workspaceId}`);
  } catch (error) {
    yield call(reject, { _error: (error as Error).message });
    yield put({
      type: ReduxActionErrorTypes.CREATE_WORKSPACE_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* uploadWorkspaceLogoSaga(
  action: ReduxAction<SaveWorkspaceLogo>,
) {
  try {
    const request = action.payload;
    const response: ApiResponse = yield call(
      WorkspaceApi.saveWorkspaceLogo,
      request,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      const allWorkspaces: Workspace[] = yield select(getCurrentWorkspace);
      const currentWorkspace = allWorkspaces.filter(
        (el: Workspace) => el.id === request.id,
      );
      if (currentWorkspace.length > 0) {
        yield put({
          type: ReduxActionTypes.SAVE_WORKSPACE_SUCCESS,
          payload: {
            id: currentWorkspace[0].id,
            // @ts-expect-error: response is of type unknown
            logoUrl: response.data.logoUrl,
          },
        });
        Toaster.show({
          text: "Logo uploaded successfully",
          variant: Variant.success,
        });
      }
    }
  } catch (error) {
    log.error("Error occured while uploading the logo", error);
  }
}

export function* deleteWorkspaceLogoSaga(action: ReduxAction<{ id: string }>) {
  try {
    const request = action.payload;
    const response: ApiResponse = yield call(
      WorkspaceApi.deleteWorkspaceLogo,
      request,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      const allWorkspaces: Workspace[] = yield select(getCurrentWorkspace);
      const currentWorkspace = allWorkspaces.filter(
        (el: Workspace) => el.id === request.id,
      );
      if (currentWorkspace.length > 0) {
        yield put({
          type: ReduxActionTypes.SAVE_WORKSPACE_SUCCESS,
          payload: {
            id: currentWorkspace[0].id,
            // @ts-expect-error: response is of type unknown
            logoUrl: response.data.logoUrl,
          },
        });
        Toaster.show({
          text: "Logo removed successfully",
          variant: Variant.success,
        });
      }
    }
  } catch (error) {
    log.error("Error occured while removing the logo", error);
  }
}

export default function* workspaceSagas() {
  yield all([
    takeLatest(ReduxActionTypes.FETCH_WORKSPACE_ROLES_INIT, fetchRolesSaga),
    takeLatest(ReduxActionTypes.FETCH_CURRENT_WORKSPACE, fetchWorkspaceSaga),
    takeLatest(ReduxActionTypes.SAVE_WORKSPACE_INIT, saveWorkspaceSaga),
    takeLatest(ReduxActionTypes.CREATE_WORKSPACE_INIT, createWorkspaceSaga),
    takeLatest(ReduxActionTypes.FETCH_ALL_USERS_INIT, fetchAllUsersSaga),
    takeLatest(ReduxActionTypes.FETCH_ALL_ROLES_INIT, fetchAllRolesSaga),
    takeLatest(
      ReduxActionTypes.DELETE_WORKSPACE_USER_INIT,
      deleteWorkspaceUserSaga,
    ),
    takeLatest(
      ReduxActionTypes.CHANGE_WORKSPACE_USER_ROLE_INIT,
      changeWorkspaceUserRoleSaga,
    ),
    takeLatest(ReduxActionTypes.DELETE_WORKSPACE_INIT, deleteWorkspaceSaga),
    takeLatest(ReduxActionTypes.UPLOAD_WORKSPACE_LOGO, uploadWorkspaceLogoSaga),
    takeLatest(ReduxActionTypes.REMOVE_WORKSPACE_LOGO, deleteWorkspaceLogoSaga),
  ]);
}
