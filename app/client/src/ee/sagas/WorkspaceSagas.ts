export * from "ce/sagas/WorkspaceSagas";
import {
  fetchRolesSaga,
  fetchWorkspaceSaga,
  saveWorkspaceSaga,
  createWorkspaceSaga,
  fetchAllUsersSaga,
  fetchAllRolesSaga,
  deleteWorkspaceUserSaga,
  changeWorkspaceUserRoleSaga,
  deleteWorkspaceSaga,
  uploadWorkspaceLogoSaga,
  deleteWorkspaceLogoSaga,
} from "ce/sagas/WorkspaceSagas";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { all, takeLatest } from "redux-saga/effects";

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
