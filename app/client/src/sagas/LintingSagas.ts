import { setLintingErrors } from "actions/lintingActions";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { call, put } from "redux-saga/effects";
import { JSUpdate } from "utils/JSPaneUtils";
import { GracefulWorkerService } from "utils/WorkerUtil";
import { getUpdatedLocalUnEvalTreeAfterJSUpdates } from "workers/Evaluation/JSObject";
import {
  LintTreeRequest,
  LintTreeResponse,
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
  jsUpdates,
  pathsToLint,
  unevalTree,
}: {
  pathsToLint: string[];
  jsUpdates: Record<string, JSUpdate>;
  unevalTree: DataTree;
}) {
  const updatedUnevalTree = getUpdatedLocalUnEvalTreeAfterJSUpdates(
    jsUpdates,
    unevalTree,
  );
  const lintTreeRequestData: LintTreeRequest = {
    jsUpdates,
    pathsToLint,
    unevalTree: updatedUnevalTree,
  };

  const { errors }: LintTreeResponse = yield call(
    lintWorker.request,
    LINT_WORKER_ACTIONS.LINT_TREE,
    lintTreeRequestData,
  );

  yield put(setLintingErrors(errors));
  logLatestLintPropertyErrors(errors, unevalTree);
}
