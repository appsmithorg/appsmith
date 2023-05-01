import { setLintingErrors } from "actions/lintingActions";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { APP_MODE } from "entities/App";
import { call, put, select, takeEvery } from "redux-saga/effects";
import { getAppMode } from "selectors/entitiesSelector";
import { GracefulWorkerService } from "utils/WorkerUtil";
import type { TJSLibrary } from "workers/common/JSLibrary";
import type {
  LintTreeRequest,
  LintTreeResponse,
  LintTreeSagaRequestData,
} from "workers/Linting/types";
import { LINT_WORKER_ACTIONS } from "workers/Linting/types";
import { logLatestLintPropertyErrors } from "./PostLintingSagas";
import { getAppsmithConfigs } from "@appsmith/configs";
import type { AppState } from "@appsmith/reducers";
import type { LintError } from "utils/DynamicBindingUtils";
import { get, set, union } from "lodash";
import type { LintErrorsStore } from "reducers/lintingReducers/lintErrorsReducers";
import type { TJSPropertiesState } from "workers/Evaluation/JSObject/jsPropertiesState";

const APPSMITH_CONFIGS = getAppsmithConfigs();

export const lintWorker = new GracefulWorkerService(
  new Worker(new URL("../workers/Linting/lint.worker.ts", import.meta.url), {
    type: "module",
    name: "lintWorker",
  }),
);

function* updateLintGlobals(action: ReduxAction<TJSLibrary>) {
  const appMode: APP_MODE = yield select(getAppMode);
  const isEditorMode = appMode === APP_MODE.EDIT;
  if (!isEditorMode) return;
  yield call(
    lintWorker.request,
    LINT_WORKER_ACTIONS.UPDATE_LINT_GLOBALS,
    action.payload,
  );
}

function* getValidOldJSCollectionLintErrors(
  jsEntities: string[],
  errors: LintErrorsStore,
  jsObjectsState: TJSPropertiesState,
) {
  const updatedJSCollectionLintErrors: LintErrorsStore = {};
  for (const jsObjectName of jsEntities) {
    const jsObjectBodyPath = `["${jsObjectName}.body"]`;
    const oldJsBodyLintErrors: LintError[] = yield select((state: AppState) =>
      get(state.linting.errors, jsObjectBodyPath, []),
    );
    const newJSBodyLintErrors = get(
      errors,
      jsObjectBodyPath,
      [] as LintError[],
    );

    const newJSBodyLintErrorsOriginalPaths = newJSBodyLintErrors.reduce(
      (paths, currentError) => {
        if (currentError.originalPath)
          return union(paths, [currentError.originalPath]);
        return paths;
      },
      [] as string[],
    );

    const jsObjectState = get(jsObjectsState, jsObjectName, {});
    const jsObjectProperties = Object.keys(jsObjectState);

    const filteredOldJsObjectBodyLintErrors = oldJsBodyLintErrors.filter(
      (lintError) =>
        lintError.originalPath &&
        lintError.originalPath in jsObjectProperties &&
        !(lintError.originalPath in newJSBodyLintErrorsOriginalPaths),
    );
    const updatedLintErrors = [
      ...filteredOldJsObjectBodyLintErrors,
      ...newJSBodyLintErrors,
    ];
    set(updatedJSCollectionLintErrors, jsObjectBodyPath, updatedLintErrors);
  }
  return updatedJSCollectionLintErrors;
}

export function* lintTreeSaga(action: ReduxAction<LintTreeSagaRequestData>) {
  const {
    asyncJSFunctionsInDataFields,
    configTree,
    jsPropertiesState,
    pathsToLint,
    unevalTree,
  } = action.payload;
  // only perform lint operations in edit mode
  const appMode: APP_MODE = yield select(getAppMode);
  if (appMode !== APP_MODE.EDIT) return;

  const lintTreeRequestData: LintTreeRequest = {
    pathsToLint,
    unevalTree,
    jsPropertiesState,
    configTree,
    cloudHosting: !!APPSMITH_CONFIGS.cloudHosting,
    asyncJSFunctionsInDataFields,
  };

  const { errors, updatedJSEntities }: LintTreeResponse = yield call(
    lintWorker.request,
    LINT_WORKER_ACTIONS.LINT_TREE,
    lintTreeRequestData,
  );

  const oldJSCollectionLintErrors: LintErrorsStore =
    yield getValidOldJSCollectionLintErrors(
      updatedJSEntities,
      errors,
      jsPropertiesState,
    );

  const updatedErrors = { ...errors, ...oldJSCollectionLintErrors };

  yield put(setLintingErrors(updatedErrors));
  yield call(logLatestLintPropertyErrors, {
    errors,
    dataTree: unevalTree,
  });
}

export default function* lintTreeSagaWatcher() {
  yield takeEvery(ReduxActionTypes.UPDATE_LINT_GLOBALS, updateLintGlobals);
  yield takeEvery(ReduxActionTypes.LINT_TREE, lintTreeSaga);
}
