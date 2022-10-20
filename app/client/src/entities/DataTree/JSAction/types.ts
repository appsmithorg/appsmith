import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { DependencyMap, DynamicPath } from "utils/DynamicBindingUtils";
import { PluginType } from "entities/Action";
import { Variable } from "entities/JSCollection";

export interface MetaArgs {
  arguments: Variable[];
  isAsync: boolean;
  confirmBeforeExecute: boolean;
}

export interface JSActionEntityConfig {
  meta: Record<string, MetaArgs>;
  dynamicBindingPathList: DynamicPath[];
  bindingPaths: Record<string, EvaluationSubstitutionType>;
  reactivePaths: Record<string, EvaluationSubstitutionType>;
  variables: Array<string>;
  dependencyMap: DependencyMap;
  pluginType: PluginType.JS;
  name: string;
  ENTITY_TYPE: ENTITY_TYPE.JSACTION;
  body: string;
  actionId: string;
}

export interface JSActionEvalTree {
  [propName: string]: unknown;
}

export type DataTreeJSAction = JSActionEntityConfig;
