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
import type { WebworkerSpanData } from "instrumentation/types";
import type { LINTER_TYPE } from "./constants";
import type { Attributes } from "@opentelemetry/api";

export type WebworkerTelemetryAttribute = WebworkerSpanData | Attributes;

export enum LINT_WORKER_ACTIONS {
  LINT_TREE = "LINT_TREE",
  UPDATE_LINT_GLOBALS = "UPDATE_LINT_GLOBALS",
  SETUP = "SETUP",
}
export interface LintTreeResponse {
  errors: LintErrorsStore;
  lintedJSPaths: string[];
  jsPropertiesState: TJSPropertiesState;
  webworkerTelemetry: Record<string, WebworkerTelemetryAttribute>;
}

export interface LintTreeRequestPayload {
  unevalTree: DataTree;
  configTree: ConfigTree;
  cloudHosting: boolean;
  forceLinting?: boolean;
}

export interface LintRequest<T> {
  data: T;
  method: LINT_WORKER_ACTIONS;
  webworkerTelemetry: Record<string, WebworkerTelemetryAttribute>;
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
  webworkerTelemetry: Record<string, WebworkerTelemetryAttribute>;
}
export interface lintBindingPathProps {
  dynamicBinding: string;
  entity: DataTreeEntity;
  fullPropertyPath: string;
  globalData: ReturnType<typeof createEvaluationContext>;
  webworkerTelemetry: Record<string, WebworkerTelemetryAttribute>;
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
  webworkerTelemetry: Record<string, WebworkerTelemetryAttribute>;
  getLinterTypeFn?: () => LINTER_TYPE;
}

export interface getLintErrorsFromTreeProps {
  pathsToLint: string[];
  unEvalTree: DataTree;
  jsPropertiesState: TJSPropertiesState;
  cloudHosting: boolean;
  asyncJSFunctionsInDataFields: DependencyMap;
  configTree: ConfigTree;
  webworkerTelemetry: Record<string, WebworkerTelemetryAttribute>;
}

export interface getLintErrorsFromTreeResponse {
  errors: LintErrorsStore;
  lintedJSPaths: string[];
}

export interface updateJSLibraryProps {
  add?: boolean;
  libs: JSLibrary[];
}
