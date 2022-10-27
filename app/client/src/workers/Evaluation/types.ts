import { AnyReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ActionValidationConfigMap } from "constants/PropertyControlConstants";
import { UserLogObject } from "entities/AppsmithConsole";
import { AppTheme } from "entities/AppTheming";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { EvalTreePayload } from "sagas/EvaluationsSaga";
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
export type EvalWorkerResponse = EvalTreePayload | boolean | unknown;

export interface UpdateDependencyRequestData {
  allActionValidationConfig: {
    [actionId: string]: ActionValidationConfigMap;
  };
  theme: AppTheme;
  widgets: CanvasWidgetsReduxState;
  unevalTree: DataTree;
  widgetTypeConfigMap: WidgetTypeConfigMap;
  shouldReplay: boolean;
}

export interface UpdateDependencyResponseData {
  evalOrder: string[];
  lintOrder: string[];
  jsUpdates: Record<string, JSUpdate>;
  unEvalUpdates: DataTreeDiff[];
  uncaughtError: unknown;
  nonDynamicFieldValidationOrder: string[];
  isCreateFirstTree: boolean;
}

export interface EvalTreeRequestData {
  evalOrder: string[];
  shouldReplay: boolean;
  unEvalUpdates: DataTreeDiff[];
  uncaughtError: unknown;
  nonDynamicFieldValidationOrder: string[];
  isCreateFirstTree: boolean;
}

export interface EvalTreeResponseData {
  dataTree: DataTree;
  dependencies: DependencyMap;
  errors: EvalError[];
  logs: any;
  userLogs: UserLogObject[];
  evalMetaUpdates: EvalMetaUpdates;
  hasUncaughtError: boolean;
}

export interface EvalTreeSagaRequestData {
  postEvalActions?: Array<AnyReduxAction>;
  shouldReplay?: boolean;
  evalOrder: string[];
  jsUpdates: Record<string, JSUpdate>;
  unEvalUpdates: DataTreeDiff[];
  unevalTree: DataTree;
  theme: AppTheme;
  widgets: CanvasWidgetsReduxState;
  uncaughtError: unknown;
  nonDynamicFieldValidationOrder: string[];
  isCreateFirstTree: boolean;
}
