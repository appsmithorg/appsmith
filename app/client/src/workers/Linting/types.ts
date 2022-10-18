import { DataTree } from "entities/DataTree/dataTreeFactory";
import { LintErrors } from "reducers/lintingReducers/lintErrorsReducers";
import { WorkerRequest } from "workers/common/types";

export enum LINT_WORKER_ACTIONS {
  SETUP = "SETUP",
  LINT_TREE = "EVAL_TREE",
  CLEAR_CACHE = "CLEAR_CACHE",
}

export interface LintTreeResponse {
  errors: LintErrors;
}

export interface LintTreeRequest {
  pathsToLint: string[];
  unEvalTree: DataTree;
}

export type LintWorkerRequest = WorkerRequest<
  LintTreeRequest,
  LINT_WORKER_ACTIONS
>;
