import type {
  ConfigTree,
  DataTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeFactory";
import type { LintErrorsStore } from "reducers/lintingReducers/lintErrorsReducers";
import type { WorkerRequest } from "@appsmith/workers/common/types";
import type {
  createEvaluationContext,
  EvaluationScriptType,
} from "workers/Evaluation/evaluate";
import type { DependencyMap } from "utils/DynamicBindingUtils";
import type { TJSPropertiesState } from "workers/Evaluation/JSObject/jsPropertiesState";

export enum LINT_WORKER_ACTIONS {
  LINT_TREE = "LINT_TREE",
  UPDATE_LINT_GLOBALS = "UPDATE_LINT_GLOBALS",
}

export interface LintTreeResponse {
  errors: LintErrorsStore;
  updatedJSEntities: string[];
}

export interface LintTreeRequest {
  pathsToLint: string[];
  unevalTree: DataTree;
  jsPropertiesState: TJSPropertiesState;
  configTree: ConfigTree;
  cloudHosting: boolean;
  asyncJSFunctionsInDataFields: DependencyMap;
}

export type LintWorkerRequest = WorkerRequest<
  LintTreeRequest,
  LINT_WORKER_ACTIONS
>;

export type LintTreeSagaRequestData = {
  pathsToLint: string[];
  unevalTree: DataTree;
  jsPropertiesState: TJSPropertiesState;
  asyncJSFunctionsInDataFields: DependencyMap;
  configTree: ConfigTree;
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
  options?: {
    isJsObject: boolean;
  };
}

export interface getlintErrorsFromTreeProps {
  pathsToLint: string[];
  unEvalTree: DataTree;
  jsPropertiesState: TJSPropertiesState;
  cloudHosting: boolean;
  asyncJSFunctionsInDataFields: DependencyMap;
  configTree: ConfigTree;
}

export interface getlintErrorsFromTreeResponse {
  errors: LintErrorsStore;
  updatedJSEntities: string[];
}
