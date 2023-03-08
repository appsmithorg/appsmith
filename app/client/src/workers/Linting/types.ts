import { DataTree, DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import { LintErrorsStore } from "reducers/lintingReducers/lintErrorsReducers";
import { WorkerRequest } from "@appsmith/workers/common/types";
import { TJSPropertiesState } from "workers/common/DataTreeEvaluator";
import {
  createEvaluationContext,
  EvaluationScriptType,
} from "workers/Evaluation/evaluate";

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
  JSPropertiesState: TJSPropertiesState;
  cloudHosting: boolean;
}

export type LintWorkerRequest = WorkerRequest<
  LintTreeRequest,
  LINT_WORKER_ACTIONS
>;

export type LintTreeSagaRequestData = {
  pathsToLint: string[];
  unevalTree: DataTree;
  JSPropertiesState: TJSPropertiesState;
};

export interface lintTriggerPathProps {
  userScript: string;
  entity: DataTreeEntity;
  globalData: ReturnType<typeof createEvaluationContext>;
}

export interface lintBindingPathProps {
  dynamicBinding: string;
  entity: DataTreeEntity;
  fullPropertyPath: string;
  globalData: ReturnType<typeof createEvaluationContext>;
}

export interface getLintingErrorsProps {
  script: string;
  data: Record<string, unknown>;
  // {{user's code}}
  originalBinding: string;
  scriptType: EvaluationScriptType;
}
