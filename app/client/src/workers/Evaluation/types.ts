import type {
  ConfigTree,
  DataTree,
  unEvalAndConfigTree,
} from "entities/DataTree/dataTreeFactory";
import type { ActionValidationConfigMap } from "constants/PropertyControlConstants";
import type { AppTheme } from "entities/AppTheming";

import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { MetaWidgetsReduxState } from "reducers/entityReducers/metaWidgetsReducer";
import type { DependencyMap, EvalError } from "utils/DynamicBindingUtils";
import type {
  EVAL_WORKER_ASYNC_ACTION,
  EVAL_WORKER_SYNC_ACTION,
} from "@appsmith/workers/Evaluation/evalWorkerActions";
import type { JSUpdate } from "utils/JSPaneUtils";
import type { WidgetTypeConfigMap } from "utils/WidgetFactory";
import type { EvalMetaUpdates } from "@appsmith/workers/common/DataTreeEvaluator/types";
import type { WorkerRequest } from "@appsmith/workers/common/types";
import type { DataTreeDiff } from "@appsmith/workers/Evaluation/evaluationUtils";

export type EvalWorkerSyncRequest = WorkerRequest<any, EVAL_WORKER_SYNC_ACTION>;
export type EvalWorkerASyncRequest = WorkerRequest<
  any,
  EVAL_WORKER_ASYNC_ACTION
>;
export type EvalWorkerResponse = EvalTreeResponseData | boolean | unknown;

export interface EvalTreeRequestData {
  unevalTree: unEvalAndConfigTree;
  widgetTypeConfigMap: WidgetTypeConfigMap;
  widgets: CanvasWidgetsReduxState;
  theme: AppTheme;
  shouldReplay: boolean;
  allActionValidationConfig: {
    [actionId: string]: ActionValidationConfigMap;
  };
  forceEvaluation: boolean;
  metaWidgets: MetaWidgetsReduxState;
}

export interface EvalTreeResponseData {
  dataTree: DataTree;
  dependencies: DependencyMap;
  errors: EvalError[];
  evalMetaUpdates: EvalMetaUpdates;
  evaluationOrder: string[];
  reValidatedPaths: string[];
  jsUpdates: Record<string, JSUpdate>;
  logs: unknown[];
  unEvalUpdates: DataTreeDiff[];
  isCreateFirstTree: boolean;
  configTree: ConfigTree;
  staleMetaIds: string[];
  pathsToClearErrorsFor: any[];
  isNewWidgetAdded: boolean;
  undefinedEvalValuesMap: Record<string, boolean>;
  jsVarsCreatedEvent?: { path: string; type: string }[];
}

export type JSVarMutatedEvents = Record<string, { path: string; type: string }>;
