import { DataTree } from "entities/DataTree/dataTreeFactory";
import { LintErrors } from "reducers/lintingReducers/lintErrorsReducers";
import { JSUpdate } from "utils/JSPaneUtils";
import { WorkerRequest } from "workers/common/types";

export enum LINT_WORKER_ACTIONS {
  LINT_TREE = "LINT_TREE",
}

export interface LintTreeResponse {
  errors: LintErrors;
}

export interface LintTreeRequest {
  pathsToLint: string[];
  unevalTree: DataTree;
  jsUpdates: Record<string, JSUpdate>;
}

export type LintWorkerRequest = WorkerRequest<
  LintTreeRequest,
  LINT_WORKER_ACTIONS
>;

export type LintTreeSagaRequestData = {
  pathsToLint: string[];
  jsUpdates: Record<string, JSUpdate>;
  unevalTree: DataTree;
};
