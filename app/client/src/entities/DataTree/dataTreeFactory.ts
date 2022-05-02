import { PageListPayload } from "@appsmith/constants/ReduxActionConstants";
import { ActionResponse } from "api/ActionAPI";
import { PluginId } from "api/PluginApi";
import { ValidationConfig } from "constants/PropertyControlConstants";
import { diff } from "deep-diff";
import { ActionConfig, PluginType } from "entities/Action";
import {
  ActionDescription,
  ClearPluginActionDescription,
  RunPluginActionDescription,
} from "entities/DataTree/actionTriggers";
import { generateDataTreeAction } from "entities/DataTree/dataTreeAction";
import { generateDataTreeJSAction } from "entities/DataTree/dataTreeJSAction";
import {
  generateDataTreeWidget,
  generateDataTreeWidget_,
} from "entities/DataTree/dataTreeWidget";
import { Variable } from "entities/JSCollection";
import log from "loglevel";
import {
  ActionDataState,
  ActionDataWithMeta,
} from "reducers/entityReducers/actionsReducer";
import { AppDataState } from "reducers/entityReducers/appReducer";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { JSCollectionDataState } from "reducers/entityReducers/jsActionsReducer";
import { MetaState } from "reducers/entityReducers/metaReducer";
import { DependencyMap, DynamicPath } from "utils/DynamicBindingUtils";
import { WidgetProps } from "widgets/BaseWidget";

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

// Private widgets do not get evaluated
// For example, for widget Button1 in a List widget List1, List1.template.Button1.text gets evaluated,
// so there is no need to evaluate Button1.text
export type PrivateWidgets = Record<string, true>;

export interface DataTreeAction
  extends Omit<ActionDataWithMeta, "data" | "config"> {
  data: ActionResponse["body"];
  actionId: string;
  config: Partial<ActionConfig>;
  pluginType: PluginType;
  pluginId: PluginId;
  name: string;
  run: ActionDispatcher | RunPluginActionDescription | Record<string, unknown>;
  clear:
    | ActionDispatcher
    | ClearPluginActionDescription
    | Record<string, unknown>;
  dynamicBindingPathList: DynamicPath[];
  bindingPaths: Record<string, EvaluationSubstitutionType>;
  reactivePaths: Record<string, EvaluationSubstitutionType>;
  ENTITY_TYPE: ENTITY_TYPE.ACTION;
  dependencyMap: DependencyMap;
  logBlackList: Record<string, true>;
  datasourceUrl: string;
}

export interface DataTreeJSAction {
  pluginType: PluginType.JS;
  name: string;
  ENTITY_TYPE: ENTITY_TYPE.JSACTION;
  body: string;
  [propName: string]: any;
  meta: Record<string, MetaArgs>;
  dynamicBindingPathList: DynamicPath[];
  bindingPaths: Record<string, EvaluationSubstitutionType>;
  reactivePaths: Record<string, EvaluationSubstitutionType>;
  variables: Array<string>;
  dependencyMap: DependencyMap;
}

export interface MetaArgs {
  arguments: Variable[];
  isAsync: boolean;
  confirmBeforeExecute: boolean;
}
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

export interface DataTreeWidget extends WidgetProps {
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

export interface DataTreeAppsmith extends Omit<AppDataState, "store"> {
  ENTITY_TYPE: ENTITY_TYPE.APPSMITH;
  store: Record<string, unknown>;
}
export type DataTreeObjectEntity =
  | DataTreeAction
  | DataTreeJSAction
  | DataTreeWidget
  | DataTreeAppsmith;

export type DataTreeEntity =
  | DataTreeObjectEntity
  | PageListPayload
  | ActionDispatcher;

export type DataTree = {
  [entityName: string]: DataTreeEntity;
};

type DataTreeSeed = {
  actions: ActionDataState;
  editorConfigs: Record<string, any[]>;
  pluginDependencyConfig: Record<string, DependencyMap>;
  widgets: CanvasWidgetsReduxState;
  widgetsMeta: MetaState;
  pageList: PageListPayload;
  appData: AppDataState;
  jsActions: JSCollectionDataState;
};

export class DataTreeFactory {
  static create({
    actions,
    appData,
    editorConfigs,
    jsActions,
    pageList,
    pluginDependencyConfig,
    widgets,
    widgetsMeta,
  }: DataTreeSeed): DataTree {
    const dataTree: DataTree = {};
    const start = performance.now();
    const startActions = performance.now();

    actions.forEach((action) => {
      const editorConfig = editorConfigs[action.config.pluginId];
      const dependencyConfig = pluginDependencyConfig[action.config.pluginId];
      dataTree[action.config.name] = generateDataTreeAction(
        action,
        editorConfig,
        dependencyConfig,
      );
    });
    const endActions = performance.now();

    const startJsActions = performance.now();

    jsActions.forEach((js) => {
      dataTree[js.config.name] = generateDataTreeJSAction(js);
    });
    const endJsActions = performance.now();

    const startWidgets = performance.now();

    Object.values(widgets).forEach((widget) => {
      const old = generateDataTreeWidget_(widget, widgetsMeta[widget.widgetId]);
      const optimized = generateDataTreeWidget(
        widget,
        widgetsMeta[widget.widgetId],
      );
      console.log("### Diffs are", diff(old, optimized));
      dataTree[widget.widgetName] = optimized;
    });
    const endWidgets = performance.now();

    dataTree.pageList = pageList;
    dataTree.appsmith = {
      ...appData,
      // combine both persistent and transient state with the transient state
      // taking precedence in case the key is the same
      store: { ...appData.store.persistent, ...appData.store.transient },
    } as DataTreeAppsmith;
    (dataTree.appsmith as DataTreeAppsmith).ENTITY_TYPE = ENTITY_TYPE.APPSMITH;
    const end = performance.now();

    const out = {
      total: end - start,
      widgets: endWidgets - startWidgets,
      actions: endActions - startActions,
      jsActions: endJsActions - startJsActions,
    };

    log.debug("### Create Uneval Tree", out);

    return dataTree;
  }
}
