import { DependencyMap, DynamicPath } from "utils/DynamicBindingUtils";
import {
  ActionDispatcher,
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "entities/DataTree/dataTreeFactory";
import { ActionResponse } from "api/ActionAPI";
import { ActionConfig, PluginType } from "entities/Action";
import {
  ClearPluginActionDescription,
  RunPluginActionDescription,
} from "entities/DataTree/actionTriggers";
import { PluginId } from "api/PluginApi";

export interface ActionEntityEvalTree {
  isLoading: boolean;
  data: ActionResponse["body"];
  run: ActionDispatcher | RunPluginActionDescription | Record<string, unknown>;
  clear:
    | ActionDispatcher
    | ClearPluginActionDescription
    | Record<string, unknown>;
  ENTITY_TYPE: ENTITY_TYPE.ACTION;
  responseMeta: {
    statusCode: string | undefined;
    isExecutionSuccess: boolean;
    headers: unknown;
  };
}

export interface ActionEntityConfig {
  dynamicBindingPathList: DynamicPath[];
  bindingPaths: Record<string, EvaluationSubstitutionType>;
  reactivePaths: Record<string, EvaluationSubstitutionType>;
  ENTITY_TYPE: ENTITY_TYPE.ACTION;
  dependencyMap: DependencyMap;
  logBlackList: Record<string, true>;
  config: Partial<ActionConfig>;
  pluginType: PluginType;
  pluginId: PluginId;
  actionId: string;
  name: string;
  datasourceUrl: string;
}

export interface DataTreeAction
  extends ActionEntityEvalTree,
    ActionEntityConfig {}
