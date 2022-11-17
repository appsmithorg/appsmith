import { ApiResponse } from "api/ApiResponses";
import LibraryApi from "api/LibraryAPI";
import { createMessage, customJSLibraryMessages } from "ce/constants/messages";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import { Toaster, Variant } from "design-system";
import {
  actionChannel,
  ActionPattern,
  all,
  call,
  put,
  select,
  take,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import TernServer from "utils/autocomplete/TernServer";
import { EVAL_WORKER_ACTIONS, TJSLibrary } from "utils/DynamicBindingUtils";
import { validateResponse } from "./ErrorSagas";
import { EvalWorker } from "./EvaluationsSaga";

export function* installLibrary(lib: Partial<TJSLibrary>) {
  const { name, url } = lib;
  const { defs, libraryAccessor, status } = yield call(
    EvalWorker.request,
    EVAL_WORKER_ACTIONS.INSTALL_LIBRARY,
    url,
  );
  const applicationId: string = yield select(getCurrentApplicationId);

  if (!status) {
    yield put({
      type: ReduxActionErrorTypes.INSTALL_LIBRARY_FAILED,
      payload: url,
    });
    Toaster.show({
      text: createMessage(customJSLibraryMessages.INSTALLATION_FAILED),
      variant: Variant.danger,
    });
    return;
  }

  const versionMatch = (url as string).match(/(?<=@)(\d+\.)(\d+\.)(\d+)/);
  const [version] = versionMatch ? versionMatch : [];

  const response: ApiResponse = yield call(
    LibraryApi.addLibrary,
    applicationId,
    {
      name: name || libraryAccessor,
      version,
      accessor: libraryAccessor,
      defs,
      url,
    },
  );

  try {
    const isValidResponse: boolean = yield validateResponse(response, false);
    if (!isValidResponse) {
      yield put({
        type: ReduxActionErrorTypes.INSTALL_LIBRARY_FAILED,
        payload: url,
      });
      Toaster.show({
        text: createMessage(customJSLibraryMessages.INSTALLATION_FAILED),
        variant: Variant.danger,
      });
      return;
    }
  } catch (e) {
    yield put({
      type: ReduxActionErrorTypes.INSTALL_LIBRARY_FAILED,
      payload: url,
    });
    Toaster.show({
      text: createMessage(customJSLibraryMessages.INSTALLATION_FAILED),
      variant: Variant.danger,
    });
    return;
  }

  TernServer.updateDef(defs["!name"], defs);

  yield put({
    type: ReduxActionTypes.UPDATE_LINT_GLOBALS,
    payload: {
      name: libraryAccessor,
      version,
      url,
      accessor: libraryAccessor,
    },
  });

  yield put({
    type: ReduxActionTypes.INSTALL_LIBRARY_SUCCESS,
    payload: { url, libraryAccessor, version },
  });
  Toaster.show({
    text: createMessage(
      customJSLibraryMessages.INSTALLATION_SUCCESSFUL,
      libraryAccessor,
    ),
    variant: Variant.success,
  });
}

function* uninstallLibrary(
  action: ReduxAction<{ accessor: string; name: string; url: string }>,
) {
  const { accessor, name } = action.payload;
  const success: boolean = yield call(
    EvalWorker.request,
    EVAL_WORKER_ACTIONS.UNINSTALL_LIBRARY,
    accessor,
  );
  if (!success) {
    Toaster.show({
      text: createMessage(customJSLibraryMessages.UNINSTALL_FAILED, name),
      variant: Variant.danger,
    });
  }
}

function* fetchJSLibraries(action: ReduxAction<string>) {
  const applicationId: string = action.payload;

  try {
    const response: ApiResponse = yield call(
      LibraryApi.getLibraries,
      applicationId,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (!isValidResponse) return;

    const libraries = response.data as Array<
      TJSLibrary & { defs: Record<string, any> }
    >;

    const success: boolean = yield call(
      EvalWorker.request,
      EVAL_WORKER_ACTIONS.SETUP_LIBRARIES,
      libraries.map((lib) => lib.url),
    );

    if (!success) {
      yield put({
        type: ReduxActionErrorTypes.FETCH_JS_LIBRARIES_FAILED,
      });
      return;
    }

    yield put({
      type: ReduxActionTypes.FETCH_JS_LIBRARIES_SUCCESS,
      payload: libraries.map((lib) => ({
        name: lib.name,
        accessor: lib.accessor,
        version: lib.version,
        url: lib.url,
        docsURL: lib.docsURL,
      })),
    });

    for (const lib of libraries) {
      TernServer.updateDef(lib.defs["!name"], lib.defs);
    }
  } catch (e) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_JS_LIBRARIES_FAILED,
    });
  }
}

function* startInstallationRequestChannel() {
  const queueInstallChannel: ActionPattern<any> = yield actionChannel([
    ReduxActionTypes.INSTALL_LIBRARY_INIT,
  ]);
  while (true) {
    const action: ReduxAction<Partial<TJSLibrary>> = yield take(
      queueInstallChannel,
    );
    yield put({
      type: ReduxActionTypes.INSTALL_LIBRARY_START,
      payload: action.payload.url,
    });
    yield call(installLibrary, action.payload);
  }
}

export default function*() {
  yield all([
    takeEvery(ReduxActionTypes.UNINSTALL_LIBRARY_INIT, uninstallLibrary),
    takeLatest(ReduxActionTypes.FETCH_JS_LIBRARIES_INIT, fetchJSLibraries),
    call(startInstallationRequestChannel),
  ]);
}
