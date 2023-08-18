import type { ActionResponse } from "api/ActionAPI";
import type { PluginId } from "api/PluginApi";
import type { ValidationConfig } from "constants/PropertyControlConstants";
import type { ActionConfig, PluginType } from "entities/Action";
import type { ActionDescription } from "@appsmith/workers/Evaluation/fns";
import type { Variable } from "entities/JSCollection";
import type { DependencyMap, DynamicPath } from "utils/DynamicBindingUtils";
import type { Page } from "@appsmith/constants/ReduxActionConstants";

export type ActionDispatcher = (...args: any[]) => ActionDescription;

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
export interface ActionEntity {
  actionId: string;
  isLoading: boolean;
  data: ActionResponse["body"];
  run: ActionDispatcher | Record<string, unknown>;
  clear: ActionDispatcher | Record<string, unknown>;
  responseMeta: {
    statusCode?: string;
    isExecutionSuccess: boolean;
    headers?: unknown;
  };
  ENTITY_TYPE: ENTITY_TYPE.ACTION;
  config: Partial<ActionConfig>;
  datasourceUrl: string;
}

export interface ActionEntityConfig extends EntityConfig {
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
  confirmBeforeExecute: boolean;
}

export interface JSActionEntityConfig extends EntityConfig {
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

export interface JSActionEntity {
  [propName: string]: any;
  body: string;
  ENTITY_TYPE: ENTITY_TYPE.JSACTION;
  actionId: string;
}
export type PagelistEntity = Page[];

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
export interface overrideDependency {
  DEFAULT: string;
  META: string;
}
/**
 *  Map of property name as key and value as object with defaultPropertyName and metaPropertyName which it depends on.
 */
export type PropertyOverrideDependency = Record<
  string,
  Partial<overrideDependency>
>;

export interface WidgetConfig extends EntityConfig {
  bindingPaths: Record<string, EvaluationSubstitutionType>;
  reactivePaths: Record<string, EvaluationSubstitutionType>;
  triggerPaths: Record<string, boolean>;
  validationPaths: Record<string, ValidationConfig>;
  ENTITY_TYPE: ENTITY_TYPE.WIDGET;
  logBlackList: Record<string, true>;
  propertyOverrideDependency: PropertyOverrideDependency;
  overridingPropertyPaths: OverridingPropertyPaths;
  privateWidgets: PrivateWidgets;
}

export interface EntityConfig {
  __setters?: Record<string, unknown>;
  bindingPaths?: Record<string, EvaluationSubstitutionType>;
  reactivePaths?: Record<string, EvaluationSubstitutionType>;
  validationPaths?: Record<string, ValidationConfig>;
  dynamicBindingPathList?: DynamicPath[];
}
