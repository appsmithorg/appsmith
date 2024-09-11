import type {
  ConfigTree,
  DataTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeTypes";
import type { LintErrorsStore } from "reducers/lintingReducers/lintErrorsReducers";
import type {
  createEvaluationContext,
  EvaluationScriptType,
} from "workers/Evaluation/evaluate";
import type { DependencyMap } from "utils/DynamicBindingUtils";
import type { TJSPropertiesState } from "workers/Evaluation/JSObject/jsPropertiesState";
import type { JSLibrary } from "workers/common/JSLibrary";

export enum LINT_WORKER_ACTIONS {
  LINT_TREE = "LINT_TREE",
  UPDATE_LINT_GLOBALS = "UPDATE_LINT_GLOBALS",
  SETUP = "SETUP",
}
export interface LintTreeResponse {
  errors: LintErrorsStore;
  lintedJSPaths: string[];
  jsPropertiesState: TJSPropertiesState;
}

export interface LintTreeRequestPayload {
  unevalTree: DataTree;
  configTree: ConfigTree;
  cloudHosting: boolean;
  forceLinting?: boolean;
}

export interface LintRequest {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  method: LINT_WORKER_ACTIONS;
}

export interface LintTreeSagaRequestData {
  unevalTree: DataTree;
  configTree: ConfigTree;
  forceLinting?: boolean;
}
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

export interface getLintErrorsFromTreeProps {
  pathsToLint: string[];
  unEvalTree: DataTree;
  jsPropertiesState: TJSPropertiesState;
  cloudHosting: boolean;
  asyncJSFunctionsInDataFields: DependencyMap;
  configTree: ConfigTree;
}

export interface getLintErrorsFromTreeResponse {
  errors: LintErrorsStore;
  lintedJSPaths: string[];
}

export interface updateJSLibraryProps {
  add?: boolean;
  libs: JSLibrary[];
}
