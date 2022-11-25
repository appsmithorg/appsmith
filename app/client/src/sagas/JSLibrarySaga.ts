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
import { evaluateTreeSaga, EvalWorker } from "./EvaluationsSaga";
import log from "loglevel";
import { APP_MODE } from "entities/App";
import { getAppMode } from "selectors/applicationSelectors";
import AnalyticsUtil, { LIBRARY_EVENTS } from "utils/AnalyticsUtil";
import { isDebugMode } from "entities/Engine";

function* handleInstallationFailure(url: string, accessor?: string[]) {
  if (accessor) {
    yield call(
      EvalWorker.request,
      EVAL_WORKER_ACTIONS.UNINSTALL_LIBRARY,
      accessor,
    );
  }
  Toaster.show({
    text: createMessage(customJSLibraryMessages.INSTALLATION_FAILED),
    variant: Variant.danger,
  });
  yield put({
    type: ReduxActionErrorTypes.INSTALL_LIBRARY_FAILED,
    payload: url,
  });
  AnalyticsUtil.logEvent(LIBRARY_EVENTS.INSTALL_FAILED, { url });
}

export function* installLibrarySaga(lib: Partial<TJSLibrary>) {
  const { url } = lib;
  const { accessor, defs, success } = yield call(
    EvalWorker.request,
    EVAL_WORKER_ACTIONS.INSTALL_LIBRARY,
    url,
  );

  if (!success) {
    log.debug("Failed to install locally");
    yield call(handleInstallationFailure, url as string);
    return;
  }

  const name: string = lib.name || accessor[accessor.length - 1];
  const applicationId: string = yield select(getCurrentApplicationId);

  const versionMatch = (url as string).match(/(?:@)(\d+\.)(\d+\.)(\d+)/);
  const [version] = versionMatch ? versionMatch : [];

  let stringifiedDefs = "";

  try {
    stringifiedDefs = JSON.stringify(defs);
  } catch (e) {
    stringifiedDefs = JSON.stringify({
      "!name": `LIB/${accessor[accessor.length - 1]}`,
    });
  }

  const response: ApiResponse<boolean> = yield call(
    LibraryApi.addLibrary,
    applicationId,
    {
      name,
      version,
      accessor,
      defs: stringifiedDefs,
      url,
    },
  );

  try {
    const isValidResponse: boolean = yield validateResponse(response, false);
    if (!isValidResponse || !response.data) {
      log.debug("Install API failed");
      yield call(handleInstallationFailure, url as string, accessor);
      return;
    }
  } catch (e) {
    yield call(handleInstallationFailure, url as string, accessor);
    return;
  }

  try {
    TernServer.updateDef(defs["!name"], defs);
  } catch (e) {
    Toaster.show({
      text: createMessage(customJSLibraryMessages.AUTOCOMPLETE_FAILED, name),
      variant: Variant.info,
    });
    AnalyticsUtil.logEvent(LIBRARY_EVENTS.DEFINITIONS_FAILED, { url });
    log.debug("Failed to update Tern defs", e);
  }

  yield put({
    type: ReduxActionTypes.UPDATE_LINT_GLOBALS,
    payload: {
      libs: [
        {
          name,
          version,
          url,
          accessor,
        },
      ],
      add: true,
    },
  });

  // Check if we could avoid this.
  yield call(evaluateTreeSaga, [], false, true, true);

  yield put({
    type: ReduxActionTypes.INSTALL_LIBRARY_SUCCESS,
    payload: {
      url,
      accessor,
      version,
      name,
    },
  });

  Toaster.show({
    text: createMessage(
      customJSLibraryMessages.INSTALLATION_SUCCESSFUL,
      accessor[accessor.length - 1],
    ),
    variant: Variant.success,
  });
  AnalyticsUtil.logEvent(LIBRARY_EVENTS.INSTALL_SUCCESS, { url });
}

function* uninstallLibrarySaga(action: ReduxAction<TJSLibrary>) {
  const { accessor, name } = action.payload;
  const applicationId: string = yield select(getCurrentApplicationId);

  try {
    const response: ApiResponse = yield call(
      LibraryApi.removeLibrary,
      applicationId,
      action.payload,
    );

    const isValidResponse: boolean = yield validateResponse(response);

    if (!isValidResponse) {
      yield put({
        type: ReduxActionErrorTypes.UNINSTALL_LIBRARY_FAILED,
        payload: accessor,
      });
      AnalyticsUtil.logEvent(LIBRARY_EVENTS.UNINSTALL_FAILED, {
        url: action.payload.url,
      });
      return;
    }

    yield put({
      type: ReduxActionTypes.UPDATE_LINT_GLOBALS,
      payload: {
        libs: [action.payload],
        add: false,
      },
    });

    const { success }: { success: boolean } = yield call(
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

    try {
      TernServer.removeDef(`LIB/${name}`);
    } catch (e) {
      log.debug(`Failed to remove definitions for ${name}`, e);
    }

    yield call(evaluateTreeSaga, [], false, true, true);

    yield put({
      type: ReduxActionTypes.UNINSTALL_LIBRARY_SUCCESS,
      payload: action.payload,
    });

    Toaster.show({
      text: createMessage(customJSLibraryMessages.UNINSTALL_SUCCESS, name),
      variant: Variant.success,
    });
    AnalyticsUtil.logEvent(LIBRARY_EVENTS.UNINSTALL_SUCCESS, {
      url: action.payload.url,
    });
  } catch (e) {
    Toaster.show({
      text: createMessage(customJSLibraryMessages.UNINSTALL_FAILED, name),
      variant: Variant.danger,
    });
    AnalyticsUtil.logEvent(LIBRARY_EVENTS.UNINSTALL_FAILED, {
      url: action.payload.url,
    });
  }
}

function* fetchJSLibraries(action: ReduxAction<string>) {
  const applicationId: string = action.payload;
  const mode: APP_MODE = yield select(getAppMode);
  try {
    const response: ApiResponse = yield call(
      LibraryApi.getLibraries,
      applicationId,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (!isValidResponse) return;

    const libraries = response.data as Array<TJSLibrary & { defs: string }>;

    const { success }: { success: boolean } = yield call(
      EvalWorker.request,
      EVAL_WORKER_ACTIONS.LOAD_LIBRARIES,
      libraries.map((lib) => ({
        name: lib.name,
        version: lib.version,
        url: lib.url,
        accessor: lib.accessor,
      })),
    );

    if (!success) {
      if (isDebugMode()) {
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
      } else {
        yield put({
          type: ReduxActionErrorTypes.FETCH_JS_LIBRARIES_FAILED,
        });
      }
      return;
    }

    if (mode === APP_MODE.EDIT) {
      for (const lib of libraries) {
        try {
          const defs = JSON.parse(lib.defs);
          TernServer.updateDef(defs["!name"], defs);
        } catch (e) {
          Toaster.show({
            text: createMessage(
              customJSLibraryMessages.AUTOCOMPLETE_FAILED,
              lib.name,
            ),
            variant: Variant.info,
          });
        }
      }
      yield put({
        type: ReduxActionTypes.UPDATE_LINT_GLOBALS,
        payload: {
          libs: libraries,
          add: true,
        },
      });
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
    yield call(installLibrarySaga, action.payload);
  }
}

export default function*() {
  yield all([
    takeEvery(ReduxActionTypes.UNINSTALL_LIBRARY_INIT, uninstallLibrarySaga),
    takeLatest(ReduxActionTypes.FETCH_JS_LIBRARIES_INIT, fetchJSLibraries),
    call(startInstallationRequestChannel),
  ]);
}
