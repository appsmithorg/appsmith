export * from "ce/sagas/ApplicationSagas";
import {
  publishApplicationSaga,
  updateApplicationLayoutSaga,
  updateApplicationSaga,
  changeAppViewAccessSaga,
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
  fetchAllApplicationsOfWorkspaceSaga,
} from "ce/sagas/ApplicationSagas";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { all, takeLatest } from "redux-saga/effects";

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
      ReduxActionTypes.FETCH_ALL_APPLICATIONS_OF_WORKSPACE_INIT,
      fetchAllApplicationsOfWorkspaceSaga,
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
  ]);
}
