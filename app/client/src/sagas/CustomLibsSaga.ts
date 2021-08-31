import { FetchApplicationPayload } from "actions/applicationActions";
import {
  installationFailed,
  installationSuccessful,
} from "actions/cutomLibsActions";
import { ApiResponse } from "api/ApiResponses";
import ApplicationApi from "api/ApplicationApi";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { all, call, put, takeEvery, takeLatest } from "redux-saga/effects";
import ExtraLibraryClass from "utils/ExtraLibrary";
import ScriptService from "utils/importScriptUtil";
import { validateResponse } from "./ErrorSagas";
import { updateLibrariesSaga } from "./EvaluationsSaga";

export function* fetchAppLibrariesSaga(
  action: ReduxAction<FetchApplicationPayload>,
) {
  //   const { applicationId } = action.payload;
  try {
    const response: ApiResponse = yield call(ApplicationApi.fetchAppLibraries);
    const isValid: boolean = yield call(validateResponse, response);
    if (isValid) {
      const scriptImportService = ScriptService.getInstance();
      const imports = yield call(
        scriptImportService.load.bind(scriptImportService),
        response.data,
      );
    }
    yield put({ type: ReduxActionTypes.START_EVALUATION });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_LIBRARY_ERROR,
      payload: {
        error,
      },
    });
  }
}

function* installLibrarySaga(action: ReduxAction<any>) {
  const lib = action.payload;
  //Save library and trigger definition generator;
  const scriptService = ScriptService.getInstance();
  try {
    const status = yield call(scriptService.load.bind(scriptService), [lib]);
    if (status[0].loaded) {
      const extraLibs = ExtraLibraryClass.getInstance();
      extraLibs.addLibrary({
        ...lib,
        lib: window[lib.name],
      });
      const shareLibsWithWorker = yield call(
        updateLibrariesSaga,
        extraLibs.getLibraries(),
      );
      yield put(installationSuccessful(lib));
    } else {
      yield put(installationFailed(lib));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_LIBRARY_ERROR,
      payload: {
        error,
      },
    });
  }
}

export default function* customLibsSaga() {
  yield all([
    takeLatest(ReduxActionTypes.FETCH_APPLICATION_INIT, fetchAppLibrariesSaga),
    takeEvery(ReduxActionTypes.LIB_INSTALL_INIT, installLibrarySaga),
  ]);
}
