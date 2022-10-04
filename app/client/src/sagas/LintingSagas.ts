import { setLintingErrors } from "actions/lintingActions";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { call, put } from "redux-saga/effects";
import { GracefulWorkerService } from "utils/WorkerUtil";
import {
  LintTreeRequest,
  LintTreeResponse,
  LINT_WORKER_ACTIONS,
} from "workers/Linting/types";

export const lintWorker = new GracefulWorkerService(
  new Worker(new URL("../workers/Linting/lint.worker.ts", import.meta.url)),
);

export function* lintTreeSaga({
  pathsToLint,
  unEvalTree,
}: {
  pathsToLint: string[];
  unEvalTree: DataTree;
}) {
  const lintTreeRequestData: LintTreeRequest = { pathsToLint, unEvalTree };

  const { errors }: LintTreeResponse = yield call(
    lintWorker.request,
    LINT_WORKER_ACTIONS.LINT_TREE,
    lintTreeRequestData,
  );

  yield put(setLintingErrors(errors));
}
