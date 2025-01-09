import { call, put, select } from "redux-saga/effects";
import type {
  ReduxAction,
  ReduxActionWithPromise,
} from "../../actions/ReduxActionTypes";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import {
  validateResponse,
  callAPI,
  getResponseErrorMessage,
} from "sagas/ErrorSagas";
import type {
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
  FetchWorkspacesResponse,
} from "ee/api/WorkspaceApi";
import WorkspaceApi from "ee/api/WorkspaceApi";
import type { ApiResponse } from "api/ApiResponses";
import { getFetchedWorkspaces } from "ee/selectors/workspaceSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import type { Workspace } from "ee/constants/workspaceConstants";
import history from "utils/history";
import { APPLICATIONS_URL } from "constants/routes";
import log from "loglevel";
import type { User } from "constants/userConstants";
import {
  createMessage,
  DELETE_WORKSPACE_SUCCESSFUL,
} from "ee/constants/messages";
import { toast } from "@appsmith/ads";
import { failFastApiCalls } from "sagas/InitSagas";
import { getWorkspaceEntitiesActions } from "ee/utils/workspaceHelpers";
import type { SearchApiResponse } from "ee/types/ApiResponseTypes";
import SearchApi from "api/SearchApi";

export function* fetchAllWorkspacesSaga(
  action?: ReduxAction<{ workspaceId?: string; fetchEntities: boolean }>,
) {
  try {
    const response: FetchWorkspacesResponse = yield call(
      WorkspaceApi.fetchAllWorkspaces,
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      const workspaces: Workspace[] = response.data;

      yield put({
        type: ReduxActionTypes.FETCH_ALL_WORKSPACES_SUCCESS,
        payload: workspaces,
      });

      if (action?.payload?.workspaceId || action?.payload?.fetchEntities) {
        yield call(fetchEntitiesOfWorkspaceSaga, action);
      }
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_USER_APPLICATIONS_WORKSPACES_ERROR,
      payload: {
        error,
      },
    });
  }
}

export function* fetchEntitiesOfWorkspaceSaga(
  action?: ReduxAction<{ workspaceId?: string }>,
) {
  try {
    const allWorkspaces: Workspace[] = yield select(getFetchedWorkspaces);
    const workspaceId = action?.payload?.workspaceId || allWorkspaces[0]?.id;
    const activeWorkspace = allWorkspaces.find(
      (workspace) => workspace.id === workspaceId,
    );
    const { errorActions, initActions, successActions } =
      getWorkspaceEntitiesActions(workspaceId);

    yield put({
      type: ReduxActionTypes.SET_CURRENT_WORKSPACE,
      payload: { ...activeWorkspace },
    });

    if (workspaceId) {
      yield call(failFastApiCalls, initActions, successActions, errorActions);
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_WORKSPACE_ENTITIES_ERROR,
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

    if (isValidResponse && response) {
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
      yield put({
        type: ReduxActionTypes.GET_ALL_USERS_OF_WORKSPACE_SUCCESS,
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

      //@ts-expect-error: response is of type unknown
      toast.show(`${response.data.username} has been removed successfully`, {
        kind: "success",
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
        error,
      },
    });
  }
}

export function* deleteWorkspaceSaga(action: ReduxAction<string>) {
  try {
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
      toast.show(createMessage(DELETE_WORKSPACE_SUCCESSFUL), {
        kind: "success",
      });
      history.push("/applications");
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
      const errorMessage: string | undefined =
        yield getResponseErrorMessage(response);

      yield call(reject, { _error: errorMessage });
    } else {
      yield put({
        type: ReduxActionTypes.CREATE_WORKSPACE_SUCCESS,
        payload: response.data,
      });
      yield call(resolve);
    }

    // get created workspace in focus
    // @ts-expect-error: response is of type unknown
    const workspaceId = response.data.id;

    history.push(`${window.location.pathname}?workspaceId=${workspaceId}`);
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
      const allWorkspaces: Workspace[] = yield select(getFetchedWorkspaces);
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
        toast.show("Logo uploaded successfully", {
          kind: "success",
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
      const allWorkspaces: Workspace[] = yield select(getFetchedWorkspaces);
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
        toast.show("Logo removed successfully", {
          kind: "success",
        });
      }
    }
  } catch (error) {
    log.error("Error occured while removing the logo", error);
  }
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function* searchWorkspaceEntitiesSaga(action: ReduxAction<any>) {
  try {
    const response: SearchApiResponse = yield call(
      SearchApi.searchAllEntities,
      { keyword: action.payload },
    );
    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.SEARCH_WORKSPACE_ENTITIES_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SEARCH_WORKSPACE_ENTITIES_ERROR,
      payload: {
        error,
      },
    });
  }
}
