import { ActionResponse } from "api/ActionAPI";
import { PluginId } from "api/PluginApi";
import { ValidationConfig } from "constants/PropertyControlConstants";
import { ActionConfig, PluginType } from "entities/Action";
import {
  ActionDescription,
  ClearPluginActionDescription,
  RunPluginActionDescription,
} from "entities/DataTree/actionTriggers";
import { Variable } from "entities/JSCollection";
import { DependencyMap, DynamicPath } from "utils/DynamicBindingUtils";

export type ActionDispatcher = (
  ...args: any[]
) => Promise<unknown> | ActionDescription;

export enum ENTITY_TYPE {
  ACTION = "ACTION",
  WIDGET = "WIDGET",
  APPSMITH = "APPSMITH",
  JSACTION = "JSACTION",
}

export enum EvaluationSubstitutionType {
  TEMPLATE = "TEMPLATE",
  PARAMETER = "PARAMETER",
  SMART_SUBSTITUTE = "SMART_SUBSTITUTE",
}

// Action entity types
export interface ActionEntityEvalTree {
  actionId: string;
  isLoading: boolean;
  data: ActionResponse["body"];
  run: ActionDispatcher | RunPluginActionDescription | Record<string, unknown>;
  clear:
    | ActionDispatcher
    | ClearPluginActionDescription
    | Record<string, unknown>;
  responseMeta: {
    statusCode?: string;
    isExecutionSuccess: boolean;
    headers?: unknown;
  };
  ENTITY_TYPE: ENTITY_TYPE.ACTION;
  config: Partial<ActionConfig>;
  datasourceUrl: string;
}

export interface ActionEntityConfig {
  dynamicBindingPathList: DynamicPath[];
  bindingPaths: Record<string, EvaluationSubstitutionType>;
  reactivePaths: Record<string, EvaluationSubstitutionType>;
  ENTITY_TYPE: ENTITY_TYPE.ACTION;
  dependencyMap: DependencyMap;
  logBlackList: Record<string, true>;
  pluginType: PluginType;
  pluginId: PluginId;
  actionId: string;
  name: string;
}

// JSAction (JSObject) entity Types

export interface MetaArgs {
  arguments: Variable[];
  isAsync: boolean;
  confirmBeforeExecute: boolean;
  body: string;
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
  actionId: string;
}

export interface JSActionEvalTree {
  [propName: string]: any;
  body: string;
}

// Widget entity Types

// Private widgets do not get evaluated
// For example, for widget Button1 in a List widget List1, List1.template.Button1.text gets evaluated,
// so there is no need to evaluate Button1.text
export type PrivateWidgets = Record<string, true>;

/**
 *  Map of overriding property as key and overridden property as values
 */
export type OverridingPropertyPaths = Record<string, string[]>;

export enum OverridingPropertyType {
  META = "META",
  DEFAULT = "DEFAULT",
}
/**
 *  Map of property name as key and value as object with defaultPropertyName and metaPropertyName which it depends on.
 */
export type PropertyOverrideDependency = Record<
  string,
  {
    DEFAULT: string | undefined;
    META: string | undefined;
  }
>;

export type WidgetConfig = {
  bindingPaths: Record<string, EvaluationSubstitutionType>;
  reactivePaths: Record<string, EvaluationSubstitutionType>;
  triggerPaths: Record<string, boolean>;
  validationPaths: Record<string, ValidationConfig>;
  ENTITY_TYPE: ENTITY_TYPE.WIDGET;
  logBlackList: Record<string, true>;
  propertyOverrideDependency: PropertyOverrideDependency;
  overridingPropertyPaths: OverridingPropertyPaths;
  privateWidgets: PrivateWidgets;
};
