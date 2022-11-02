import { ActionValidationConfigMap } from "constants/PropertyControlConstants";
import { UserLogObject } from "entities/AppsmithConsole";
import { AppTheme } from "entities/AppTheming";
import {
  EntityConfigCollection,
  EvalTree,
} from "entities/DataTree/dataTreeFactory";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

import {
  DependencyMap,
  EvalError,
  EVAL_WORKER_ACTIONS,
} from "utils/DynamicBindingUtils";
import { JSUpdate } from "utils/JSPaneUtils";
import { WidgetTypeConfigMap } from "utils/WidgetFactory";
import { EvalMetaUpdates } from "workers/common/DataTreeEvaluator/types";
import { WorkerRequest } from "workers/common/types";
import { DataTreeDiff } from "./evaluationUtils";

export type EvalWorkerRequest = WorkerRequest<any, EVAL_WORKER_ACTIONS>;
export type EvalWorkerResponse = EvalTreeResponseData | boolean | unknown;

export interface EvalTreeRequestData {
  unevalTree: EvalTree;
  widgetTypeConfigMap: WidgetTypeConfigMap;
  widgets: CanvasWidgetsReduxState;
  theme: AppTheme;
  shouldReplay: boolean;
  allActionValidationConfig: {
    [actionId: string]: ActionValidationConfigMap;
  };
  requiresLinting: boolean;
  entityConfigCollection: EntityConfigCollection;
}
export interface EvalTreeResponseData {
  dataTree: EvalTree;
  dependencies: DependencyMap;
  errors: EvalError[];
  evalMetaUpdates: EvalMetaUpdates;
  evaluationOrder: string[];
  jsUpdates: Record<string, JSUpdate>;
  logs: unknown[];
  userLogs: UserLogObject[];
  unEvalUpdates: DataTreeDiff[];
  isCreateFirstTree: boolean;
}
