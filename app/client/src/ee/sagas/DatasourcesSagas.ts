export { createOrUpdateDataSourceWithAction } from "ce/sagas/DatasourcesSagas";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxFormActionTypes,
} from "ee/constants/ReduxActionConstants";
import { all, takeEvery, takeLatest } from "redux-saga/effects";
import {
  addAndFetchDatasourceStructureSaga,
  addMockDbToDatasources,
  changeDatasourceSaga,
  createDatasourceFromFormSaga,
  datasourceDiscardActionSaga,
  deleteDatasourceSaga,
  executeDatasourceQuerySaga,
  fetchDatasourcesSaga,
  fetchDatasourceStructureSaga,
  fetchGsheetColumns,
  fetchGsheetSheets,
  fetchGsheetSpreadhsheets,
  fetchMockDatasourcesSaga,
  filePickerActionCallbackSaga,
  formValueChangeSaga,
  getOAuthAccessTokenSaga,
  handleDatasourceNameChangeFailureSaga,
  handleFetchDatasourceStructureOnLoad,
  initializeFormWithDefaults,
  loadFilePickerSaga,
  redirectAuthorizationCodeSaga,
  refreshDatasourceStructure,
  setDatasourceViewModeSaga,
  storeAsDatasourceSaga,
  switchDatasourceSaga,
  testDatasourceSaga,
  updateDatasourceAuthStateSaga,
  updateDatasourceNameSaga,
  updateDatasourceSaga,
  updateDatasourceSuccessSaga,
  createTempDatasourceFromFormSaga as CE_createTempDatasourceFromFormSaga,
} from "ce/sagas/DatasourcesSagas";

export function* watchDatasourcesSagas() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_DATASOURCES_INIT, fetchDatasourcesSaga),
    takeEvery(
      ReduxActionTypes.FETCH_MOCK_DATASOURCES_INIT,
      fetchMockDatasourcesSaga,
    ),
    takeEvery(
      ReduxActionTypes.ADD_MOCK_DATASOURCES_INIT,
      addMockDbToDatasources,
    ),
    takeEvery(
      ReduxActionTypes.CREATE_DATASOURCE_FROM_FORM_INIT,
      createDatasourceFromFormSaga,
    ),
    takeEvery(
      ReduxActionTypes.CREATE_TEMP_DATASOURCE_FROM_FORM_SUCCESS,
      CE_createTempDatasourceFromFormSaga,
    ),
    takeEvery(ReduxActionTypes.UPDATE_DATASOURCE_INIT, updateDatasourceSaga),
    takeEvery(
      ReduxActionTypes.UPDATE_DATASOURCE_NAME,
      updateDatasourceNameSaga,
    ),
    takeEvery(
      ReduxActionErrorTypes.UPDATE_DATASOURCE_NAME_ERROR,
      handleDatasourceNameChangeFailureSaga,
    ),
    takeEvery(ReduxActionTypes.TEST_DATASOURCE_INIT, testDatasourceSaga),
    takeEvery(ReduxActionTypes.DELETE_DATASOURCE_INIT, deleteDatasourceSaga),
    takeEvery(ReduxActionTypes.CHANGE_DATASOURCE, changeDatasourceSaga),
    takeLatest(ReduxActionTypes.SWITCH_DATASOURCE, switchDatasourceSaga),
    takeEvery(ReduxActionTypes.STORE_AS_DATASOURCE_INIT, storeAsDatasourceSaga),
    takeEvery(
      ReduxActionTypes.UPDATE_DATASOURCE_SUCCESS,
      updateDatasourceSuccessSaga,
    ),
    takeEvery(
      ReduxActionTypes.REDIRECT_AUTHORIZATION_CODE,
      redirectAuthorizationCodeSaga,
    ),
    takeEvery(ReduxActionTypes.GET_OAUTH_ACCESS_TOKEN, getOAuthAccessTokenSaga),
    takeEvery(
      ReduxActionTypes.FETCH_DATASOURCE_STRUCTURE_INIT,
      fetchDatasourceStructureSaga,
    ),
    takeEvery(
      ReduxActionTypes.REFRESH_DATASOURCE_STRUCTURE_INIT,
      refreshDatasourceStructure,
    ),
    takeEvery(
      ReduxActionTypes.EXECUTE_DATASOURCE_QUERY_INIT,
      executeDatasourceQuerySaga,
    ),
    takeEvery(
      ReduxActionTypes.INITIALIZE_DATASOURCE_FORM_WITH_DEFAULTS,
      initializeFormWithDefaults,
    ),
    // Intercepting the redux-form change actionType to update drafts and track change history
    takeEvery(ReduxFormActionTypes.VALUE_CHANGE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_PUSH, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_REMOVE, formValueChangeSaga),
    takeEvery(
      ReduxActionTypes.FILE_PICKER_CALLBACK_ACTION,
      filePickerActionCallbackSaga,
    ),
    takeLatest(
      ReduxActionTypes.FETCH_GSHEET_SPREADSHEETS,
      fetchGsheetSpreadhsheets,
    ),
    takeLatest(ReduxActionTypes.FETCH_GSHEET_SHEETS, fetchGsheetSheets),
    takeLatest(ReduxActionTypes.FETCH_GSHEET_COLUMNS, fetchGsheetColumns),
    takeEvery(ReduxActionTypes.LOAD_FILE_PICKER_ACTION, loadFilePickerSaga),
    takeEvery(
      ReduxActionTypes.UPDATE_DATASOURCE_AUTH_STATE,
      updateDatasourceAuthStateSaga,
    ),
    takeEvery(
      ReduxActionTypes.DATASOURCE_DISCARD_ACTION,
      datasourceDiscardActionSaga,
    ),
    takeEvery(
      ReduxActionTypes.ADD_AND_FETCH_MOCK_DATASOURCE_STRUCTURE_INIT,
      addAndFetchDatasourceStructureSaga,
    ),
    takeEvery(
      ReduxActionTypes.FETCH_DATASOURCES_SUCCESS,
      handleFetchDatasourceStructureOnLoad,
    ),
    takeEvery(
      ReduxActionTypes.SOFT_REFRESH_DATASOURCE_STRUCTURE,
      handleFetchDatasourceStructureOnLoad,
    ),
    takeEvery(
      ReduxActionTypes.SET_DATASOURCE_EDITOR_MODE,
      setDatasourceViewModeSaga,
    ),
  ]);
}
