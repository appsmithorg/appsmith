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

export function* lintTreeSaga(action: ReduxAction<LintTreeSagaRequestData>) {
  const { configTree, pathsToLint, unevalTree } = action.payload;
  // only perform lint operations in edit mode
  const appMode: APP_MODE = yield select(getAppMode);
  if (appMode !== APP_MODE.EDIT) return;

  const lintTreeRequestData: LintTreeRequest = {
    pathsToLint,
    unevalTree,
    configTree,
    cloudHosting: !!APPSMITH_CONFIGS.cloudHosting,
  };

  const { errors }: LintTreeResponse = yield call(
    lintWorker.request,
    LINT_WORKER_ACTIONS.LINT_TREE,
    lintTreeRequestData,
  );

  yield put(setLintingErrors(errors));
  yield call(logLatestLintPropertyErrors, { errors, dataTree: unevalTree });
}

export default function* lintTreeSagaWatcher() {
  yield takeEvery(ReduxActionTypes.UPDATE_LINT_GLOBALS, updateLintGlobals);
  yield takeEvery(ReduxActionTypes.LINT_TREE, lintTreeSaga);
}
