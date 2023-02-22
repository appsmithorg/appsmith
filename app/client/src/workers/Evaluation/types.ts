import { ActionValidationConfigMap } from "constants/PropertyControlConstants";
import { AppTheme } from "entities/AppTheming";
import { DataTree, UnEvalTree } from "entities/DataTree/dataTreeFactory";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { MetaWidgetsReduxState } from "reducers/entityReducers/metaWidgetsReducer";

import { DependencyMap, EvalError } from "utils/DynamicBindingUtils";
import {
  EVAL_WORKER_ASYNC_ACTION,
  EVAL_WORKER_SYNC_ACTION,
} from "@appsmith/workers/Evaluation/evalWorkerActions";
import { JSUpdate } from "utils/JSPaneUtils";
import { WidgetTypeConfigMap } from "utils/WidgetFactory";
import { EvalMetaUpdates } from "@appsmith/workers/common/DataTreeEvaluator/types";
import { WorkerRequest } from "@appsmith/workers/common/types";
import { DataTreeDiff } from "@appsmith/workers/Evaluation/evaluationUtils";

export type EvalWorkerSyncRequest = WorkerRequest<any, EVAL_WORKER_SYNC_ACTION>;
export type EvalWorkerASyncRequest = WorkerRequest<
  any,
  EVAL_WORKER_ASYNC_ACTION
>;
export type EvalWorkerResponse = EvalTreeResponseData | boolean | unknown;

export interface EvalTreeRequestData {
  unevalTree: UnEvalTree;
  widgetTypeConfigMap: WidgetTypeConfigMap;
  widgets: CanvasWidgetsReduxState;
  theme: AppTheme;
  shouldReplay: boolean;
  allActionValidationConfig: {
    [actionId: string]: ActionValidationConfigMap;
  };
  requiresLinting: boolean;
  forceEvaluation: boolean;
  metaWidgets: MetaWidgetsReduxState;
}

export interface EvalTreeResponseData {
  dataTree: DataTree;
  dependencies: DependencyMap;
  errors: EvalError[];
  evalMetaUpdates: EvalMetaUpdates;
  evaluationOrder: string[];
  jsUpdates: Record<string, JSUpdate>;
  logs: unknown[];
  unEvalUpdates: DataTreeDiff[];
  isCreateFirstTree: boolean;
  staleMetaIds: string[];
  pathsToClearErrorsFor: any[];
}
