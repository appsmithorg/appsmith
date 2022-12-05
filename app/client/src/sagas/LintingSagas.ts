import { setLintingErrors } from "actions/lintingActions";
import { APP_MODE } from "entities/App";
import { call, put, select } from "redux-saga/effects";
import { getAppMode } from "selectors/entitiesSelector";
import { GracefulWorkerService } from "utils/WorkerUtil";
import {
  LintTreeRequest,
  LintTreeResponse,
  LintTreeSagaRequestData,
  LINT_WORKER_ACTIONS,
} from "workers/Linting/types";
import { logLatestLintPropertyErrors } from "./PostLintingSagas";

export const lintWorker = new GracefulWorkerService(
  new Worker(new URL("../workers/Linting/lint.worker.ts", import.meta.url), {
    type: "module",
    name: "lintWorker",
  }),
);

export function* lintTreeSaga({
  pathsToLint,
  unevalTree,
}: LintTreeSagaRequestData) {
  // only perform lint operations in edit mode
  const appMode: APP_MODE = yield select(getAppMode);
  if (appMode !== APP_MODE.EDIT) return;

  const lintTreeRequestData: LintTreeRequest = {
    pathsToLint,
    unevalTree,
  };

  const { errors }: LintTreeResponse = yield call(
    lintWorker.request,
    LINT_WORKER_ACTIONS.LINT_TREE,
    lintTreeRequestData,
  );

  yield put(setLintingErrors(errors));
  yield call(logLatestLintPropertyErrors, { errors, dataTree: unevalTree });
}
