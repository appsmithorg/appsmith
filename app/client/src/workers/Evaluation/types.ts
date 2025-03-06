import type { unEvalAndConfigTree } from "entities/DataTree/dataTreeTypes";
import type { ActionValidationConfigMap } from "constants/PropertyControlConstants";
import type { AppTheme } from "entities/AppTheming";

import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import type { MetaWidgetsReduxState } from "reducers/entityReducers/metaWidgetsReducer";
import type { DependencyMap, EvalError } from "utils/DynamicBindingUtils";
import type {
  EVAL_WORKER_ASYNC_ACTION,
  EVAL_WORKER_SYNC_ACTION,
} from "ee/workers/Evaluation/evalWorkerActions";
import type { JSUpdate } from "utils/JSPaneUtils";
import type { WidgetTypeConfigMap } from "WidgetProvider/factory";
import type { EvalMetaUpdates } from "ee/workers/common/DataTreeEvaluator/types";
import type { WorkerRequest } from "ee/workers/common/types";
import type { DataTreeDiff } from "ee/workers/Evaluation/evaluationUtils";
import type { APP_MODE } from "entities/App";
import type { WebworkerSpanData, Attributes } from "instrumentation/types";
import type { ICacheProps } from "../common/AppComputationCache/types";
import type { AffectedJSObjects } from "actions/EvaluationReduxActionTypes";
import type { UpdateActionProps } from "./handlers/types";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EvalWorkerSyncRequest<T = any> = WorkerRequest<
  T,
  EVAL_WORKER_SYNC_ACTION
>;
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EvalWorkerASyncRequest<T = any> = WorkerRequest<
  T,
  EVAL_WORKER_ASYNC_ACTION
>;
export type EvalWorkerResponse = EvalTreeResponseData | boolean | unknown;

export interface EvalTreeRequestData {
  cacheProps: ICacheProps;
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
  appMode?: APP_MODE;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  widgetsMeta: Record<string, any>;
  shouldRespondWithLogs?: boolean;
  affectedJSObjects: AffectedJSObjects;
  actionDataPayloadConsolidated?: UpdateActionProps[];
}

export interface EvalTreeResponseData {
  dependencies: DependencyMap;
  errors: EvalError[];
  evalMetaUpdates: EvalMetaUpdates;
  evaluationOrder: string[];
  jsUpdates: Record<string, JSUpdate>;
  logs: unknown[];
  unEvalUpdates: DataTreeDiff[];
  isCreateFirstTree: boolean;
  staleMetaIds: string[];
  removedPaths: Array<{ entityId: string; fullpath: string }>;
  isNewWidgetAdded: boolean;
  undefinedEvalValuesMap: Record<string, boolean>;
  jsVarsCreatedEvent?: { path: string; type: string }[];
  webworkerTelemetry?: Record<string, WebworkerSpanData | Attributes>;
  updates: string;
}

export interface UpdateTreeResponse {
  unEvalUpdates: DataTreeDiff[];
  evalOrder: string[];
  jsUpdates: Record<string, JSUpdate>;
}
