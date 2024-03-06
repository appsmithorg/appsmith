export * from "ce/sagas/WorkspaceSagas";
import {
  fetchWorkspaceSaga,
  saveWorkspaceSaga,
  createWorkspaceSaga,
  fetchAllUsersSaga,
  fetchAllRolesSaga,
  changeWorkspaceUserRoleSaga,
  deleteWorkspaceSaga,
  uploadWorkspaceLogoSaga,
  deleteWorkspaceLogoSaga,
  fetchAllWorkspacesSaga,
  searchWorkspaceEntitiesSaga,
  fetchEntitiesOfWorkspaceSaga,
} from "ce/sagas/WorkspaceSagas";
import type { DeleteWorkspaceUserRequest } from "@appsmith/api/WorkspaceApi";
import WorkspaceApi from "@appsmith/api/WorkspaceApi";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { ApiResponse } from "api/ApiResponses";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { validateResponse } from "sagas/ErrorSagas";
import type { User } from "constants/userConstants";
import { getCurrentUser } from "selectors/usersSelectors";
import { APPLICATIONS_URL } from "constants/routes";
import { toast } from "design-system";
import history from "utils/history";

export function* fetchInviteGroupsSuggestionsSaga() {
  try {
    const response: ApiResponse = yield call(
      WorkspaceApi.fetchGroupSuggestions,
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_GROUP_SUGGESTIONS_SUCCESS,
        payload: response.data,
      });
    } else {
      yield put({
        type: ReduxActionErrorTypes.FETCH_GROUP_SUGGESTIONS_ERROR,
      });
    }
  } catch (e) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_GROUP_SUGGESTIONS_ERROR,
    });
  }
}

export function* deleteWorkspaceUserSaga(
  action: ReduxAction<DeleteWorkspaceUserRequest>,
) {
  try {
    const request: DeleteWorkspaceUserRequest = action.payload;
    const response: ApiResponse & { data: any } = yield call(
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
            userGroupId: action.payload.userGroupId,
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
      type: ReduxActionErrorTypes.DELETE_WORKSPACE_USER_ERROR,
      payload: {
        error,
      },
    });
  }
}

export default function* workspaceSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.FETCH_ALL_WORKSPACES_INIT,
      fetchAllWorkspacesSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_ENTITIES_OF_WORKSPACE_INIT,
      fetchEntitiesOfWorkspaceSaga,
    ),
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
    takeLatest(
      ReduxActionTypes.SEARCH_WORKSPACE_ENTITIES_INIT,
      searchWorkspaceEntitiesSaga,
    ),
    takeLatest(
      ReduxActionTypes.SEARCH_WORKSPACE_ENTITIES_INIT,
      searchWorkspaceEntitiesSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_GROUP_SUGGESTIONS,
      fetchInviteGroupsSuggestionsSaga,
    ),
  ]);
}
