import type { ApiResponse } from "api/ApiResponses";
import LibraryApi from "api/LibraryAPI";
import {
  createMessage,
  customJSLibraryMessages,
} from "@appsmith/constants/messages";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { Toaster, Variant } from "design-system-old";
import type { ActionPattern } from "redux-saga/effects";
import {
  actionChannel,
  all,
  call,
  put,
  select,
  take,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import CodemirrorTernService from "utils/autocomplete/CodemirrorTernService";
import { EVAL_WORKER_ACTIONS } from "@appsmith/workers/Evaluation/evalWorkerActions";
import { validateResponse } from "./ErrorSagas";
import { evaluateTreeSaga, EvalWorker } from "./EvaluationsSaga";
import log from "loglevel";
import { APP_MODE } from "entities/App";
import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { TJSLibrary } from "workers/common/JSLibrary";
import { getUsedActionNames } from "selectors/actionSelectors";
import AppsmithConsole from "utils/AppsmithConsole";
import { selectInstalledLibraries } from "selectors/entitiesSelector";

export function parseErrorMessage(text: string) {
  return text.split(": ").slice(1).join("");
}

function* handleInstallationFailure(
  url: string,
  message: string,
  accessor?: string[],
) {
  if (accessor) {
    yield call(
      EvalWorker.request,
      EVAL_WORKER_ACTIONS.UNINSTALL_LIBRARY,
      accessor,
    );
  }

  AppsmithConsole.error({
    text: `Failed to install library script at ${url}`,
  });

  Toaster.show({
    text: message || `Failed to install library script at ${url}`,
    variant: Variant.danger,
  });
  const applicationid: ReturnType<typeof getCurrentApplicationId> =
    yield select(getCurrentApplicationId);
  yield put({
    type: ReduxActionErrorTypes.INSTALL_LIBRARY_FAILED,
    payload: { url, show: false },
  });
  AnalyticsUtil.logEvent("INSTALL_LIBRARY", {
    url,
    success: false,
    applicationid,
  });
  log.error(message);
}

export function* installLibrarySaga(lib: Partial<TJSLibrary>) {
  const { url } = lib;

  const takenNamesMap: Record<string, true> = yield select(
    getUsedActionNames,
    "",
  );

  const installedLibraries: TJSLibrary[] = yield select(
    selectInstalledLibraries,
  );

  const takenAccessors = ([] as string[]).concat(
    ...installedLibraries.map((lib) => lib.accessor),
  );

  const { accessor, defs, error, success } = yield call(
    EvalWorker.request,
    EVAL_WORKER_ACTIONS.INSTALL_LIBRARY,
    {
      url,
      takenNamesMap,
      takenAccessors,
    },
  );

  if (!success) {
    log.debug("Failed to install locally");
    yield call(handleInstallationFailure, url as string, error?.message);
    return;
  }

  const name: string = lib.name || accessor[accessor.length - 1];
  const applicationId: string = yield select(getCurrentApplicationId);

  const versionMatch = (url as string).match(/(?:@)(\d+\.)(\d+\.)(\d+)/);
  let [version = ""] = versionMatch ? versionMatch : [];
  version = version.startsWith("@") ? version.slice(1) : version;
  version = version || lib?.version || "";

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
      yield call(handleInstallationFailure, url as string, "", accessor);
      return;
    }
  } catch (e) {
    yield call(
      handleInstallationFailure,
      url as string,
      (e as Error).message,
      accessor,
    );
    return;
  }

  try {
    CodemirrorTernService.updateDef(defs["!name"], defs);
    AnalyticsUtil.logEvent("DEFINITIONS_GENERATION", { url, success: true });
  } catch (e) {
    Toaster.show({
      text: createMessage(customJSLibraryMessages.AUTOCOMPLETE_FAILED, name),
      variant: Variant.warning,
    });
    AppsmithConsole.warning({
      text: `Failed to generate code definitions for ${name}`,
    });
    AnalyticsUtil.logEvent("DEFINITIONS_GENERATION", { url, success: false });
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

  //TODO: Check if we could avoid this.
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
  AnalyticsUtil.logEvent("INSTALL_LIBRARY", {
    url,
    namespace: accessor.join("."),
    success: true,
    applicationId,
  });

  AppsmithConsole.info({
    text: `${name} installed successfully`,
  });
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
      AnalyticsUtil.logEvent("UNINSTALL_LIBRARY", {
        url: action.payload.url,
        success: false,
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
      CodemirrorTernService.removeDef(`LIB/${accessor[accessor.length - 1]}`);
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
    AnalyticsUtil.logEvent("UNINSTALL_LIBRARY", {
      url: action.payload.url,
      success: true,
    });
  } catch (e) {
    Toaster.show({
      text: createMessage(customJSLibraryMessages.UNINSTALL_FAILED, name),
      variant: Variant.danger,
    });
    AnalyticsUtil.logEvent("UNINSTALL_LIBRARY", {
      url: action.payload.url,
      success: false,
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
      mode,
    );
    const isValidResponse: boolean = yield validateResponse(response);
    if (!isValidResponse) return;

    const libraries = response.data as Array<TJSLibrary & { defs: string }>;

    const { message, success }: { success: boolean; message: string } =
      yield call(
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
      if (mode === APP_MODE.EDIT) {
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
        const errorMessage = parseErrorMessage(message);
        Toaster.show({
          text: errorMessage,
          variant: Variant.warning,
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
          CodemirrorTernService.updateDef(defs["!name"], defs);
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

export default function* () {
  yield all([
    takeEvery(ReduxActionTypes.UNINSTALL_LIBRARY_INIT, uninstallLibrarySaga),
    takeLatest(ReduxActionTypes.FETCH_JS_LIBRARIES_INIT, fetchJSLibraries),
    call(startInstallationRequestChannel),
  ]);
}
