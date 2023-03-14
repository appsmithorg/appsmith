import { DataTree } from "entities/DataTree/dataTreeFactory";
import { LintErrors } from "reducers/lintingReducers/lintErrorsReducers";
import { WorkerRequest } from "@appsmith/workers/common/types";

export enum LINT_WORKER_ACTIONS {
  LINT_TREE = "LINT_TREE",
  UPDATE_LINT_GLOBALS = "UPDATE_LINT_GLOBALS",
}

export interface LintTreeResponse {
  errors: LintErrors;
}

export interface LintTreeRequest {
  pathsToLint: string[];
  unevalTree: DataTree;
  cloudHosting: boolean;
}

export type LintWorkerRequest = WorkerRequest<
  LintTreeRequest,
  LINT_WORKER_ACTIONS
>;

export type LintTreeSagaRequestData = {
  pathsToLint: string[];
  unevalTree: DataTree;
};
