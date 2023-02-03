import { DataTree } from "entities/DataTree/dataTreeFactory";
import { LintErrorsStore } from "reducers/lintingReducers/lintErrorsReducers";
import { WorkerRequest } from "@appsmith/workers/common/types";
import { TJSObjectState, TJSStateDiff } from "workers/common/DataTreeEvaluator";

export enum LINT_WORKER_ACTIONS {
  LINT_TREE = "LINT_TREE",
  UPDATE_LINT_GLOBALS = "UPDATE_LINT_GLOBALS",
}

export interface LintTreeResponse {
  errors: LintErrorsStore;
}

export interface LintTreeRequest {
  pathsToLint: string[];
  unevalTree: DataTree;
  jsStateDiff: TJSStateDiff;
  jsState: TJSObjectState;
}

export type LintWorkerRequest = WorkerRequest<
  LintTreeRequest,
  LINT_WORKER_ACTIONS
>;

export type LintTreeSagaRequestData = {
  pathsToLint: string[];
  unevalTree: DataTree;
  jsStateDiff: TJSStateDiff;
  jsState: TJSObjectState;
};
