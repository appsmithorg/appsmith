import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { WidgetProps } from "widgets/BaseWidget";
import { ActionResponse } from "api/ActionAPI";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { MetaState } from "reducers/entityReducers/metaReducer";
import { Page } from "@appsmith/constants/ReduxActionConstants";
import { ActionConfig, PluginType } from "entities/Action";
import { AppDataState } from "reducers/entityReducers/appReducer";
import { DependencyMap, DynamicPath } from "utils/DynamicBindingUtils";
import { generateDataTreeAction } from "entities/DataTree/dataTreeAction";
import { generateDataTreeJSAction } from "entities/DataTree/dataTreeJSAction";
import { generateDataTreeWidget } from "entities/DataTree/dataTreeWidget";
import { JSCollectionDataState } from "reducers/entityReducers/jsActionsReducer";
import { ValidationConfig } from "constants/PropertyControlConstants";
import { Variable } from "entities/JSCollection";
import {
  ActionDescription,
  ClearPluginActionDescription,
  RunPluginActionDescription,
} from "entities/DataTree/actionTriggers";
import { AppTheme } from "entities/AppTheming";
import { PluginId } from "api/PluginApi";
import log from "loglevel";
import { WidgetConfig } from "reducers/entityReducers/widgetConfigReducer";

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
  [propName: string]: unknown;
  body: string;
}

export type DataTreeJSAction = JSActionEntityConfig | JSActionEvalTree;

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

// export interface DataTreeWidget extends WidgetProps {
//   bindingPaths: Record<string, EvaluationSubstitutionType>;
//   reactivePaths: Record<string, EvaluationSubstitutionType>;
//   triggerPaths: Record<string, boolean>;
//   validationPaths: Record<string, ValidationConfig>;
//   ENTITY_TYPE: ENTITY_TYPE.WIDGET;
//   logBlackList: Record<string, true>;
//   propertyOverrideDependency: PropertyOverrideDependency;
//   overridingPropertyPaths: OverridingPropertyPaths;
//   privateWidgets: PrivateWidgets;
//   meta: Record<string, unknown>;
// }

export interface WidgetEntityConfig extends Partial<WidgetConfig> {
  bindingPaths: Record<string, EvaluationSubstitutionType>;
  reactivePaths: Record<string, EvaluationSubstitutionType>;
  triggerPaths: Record<string, boolean>;
  validationPaths: Record<string, ValidationConfig>;
  ENTITY_TYPE: ENTITY_TYPE.WIDGET;
  logBlackList: Record<string, true>;
  privateWidgets: PrivateWidgets;
  propertyOverrideDependency: PropertyOverrideDependency;
  overridingPropertyPaths: OverridingPropertyPaths;

  defaultMetaProps: Array<string>;
  type: string;
}

export type DataTreeWidget = WidgetEvalTree | WidgetEntityConfig;

export interface WidgetEvalTree extends Partial<WidgetProps> {
  ENTITY_TYPE: ENTITY_TYPE.WIDGET;
}

export interface DataTreeAppsmith extends Omit<AppDataState, "store"> {
  ENTITY_TYPE: ENTITY_TYPE.APPSMITH;
  store: Record<string, unknown>;
  theme: AppTheme["properties"];
}
export type DataTreeObjectEntity =
  | DataTreeAction
  | DataTreeJSAction
  | DataTreeWidget
  | DataTreeAppsmith;

export type DataTreeEntity = DataTreeObjectEntity | Page[] | ActionDispatcher;

export type DataTree = {
  [entityName: string]: DataTreeEntity;
};

type DataTreeSeed = {
  actions: ActionDataState;
  editorConfigs: Record<string, any[]>;
  pluginDependencyConfig: Record<string, DependencyMap>;
  widgets: CanvasWidgetsReduxState;
  widgetsMeta: MetaState;
  pageList: Page[];
  appData: AppDataState;
  jsActions: JSCollectionDataState;
  theme: AppTheme["properties"];
};

export type DataTreeEntityConfig =
  | WidgetEntityConfig
  | ActionEntityConfig
  | JSActionEntityConfig
  | DataTreeAppsmith;

export type EntityConfigCollection = {
  [entityName: string]: DataTreeEntityConfig;
};

export type EvalTreeEntity =
  | JSActionEvalTree
  | ActionEntityEvalTree
  | WidgetEvalTree
  | DataTreeAppsmith;

export type EvalTree = {
  [entityName: string]: EvalTreeEntity;
};

export class DataTreeFactory {
  static create({
    actions,
    appData,
    editorConfigs,
    jsActions,
    pluginDependencyConfig,
    theme,
    widgets,
    widgetsMeta,
  }: DataTreeSeed): {
    unEvalTree: EvalTree;
    entityConfigCollection: EntityConfigCollection;
  } {
    const unEvalTree: EvalTree = {};
    const entityConfigCollection: EntityConfigCollection = {};
    const start = performance.now();
    const startActions = performance.now();

    actions.forEach((action) => {
      const editorConfig = editorConfigs[action.config.pluginId];
      const dependencyConfig = pluginDependencyConfig[action.config.pluginId];
      const {
        entityConfig: actionEntityConfig,
        unEvalTree: actionDataTree,
      } = generateDataTreeAction(action, editorConfig, dependencyConfig);
      unEvalTree[action.config.name] = actionDataTree;
      entityConfigCollection[action.config.name] = actionEntityConfig;
    });
    const endActions = performance.now();

    const startJsActions = performance.now();

    jsActions.forEach((js) => {
      const {
        entityConfig: jsActionEntityConfig,
        unEvalTree: jsActionDataTree,
      } = generateDataTreeJSAction(js);
      unEvalTree[js.config.name] = jsActionDataTree;
      entityConfigCollection[js.config.name] = jsActionEntityConfig;
    });
    const endJsActions = performance.now();

    const startWidgets = performance.now();

    Object.values(widgets).forEach((widget) => {
      const {
        entityConfig,
        unEvalTree: widgetUnEvalTree,
      } = generateDataTreeWidget(widget, widgetsMeta[widget.widgetId]);

      unEvalTree[widget.widgetName] = widgetUnEvalTree;
      entityConfigCollection[widget.widgetName] = entityConfig;
    });
    const endWidgets = performance.now();

    // remove pageList
    // dataTree.pageList = pageList;

    unEvalTree.appsmith = {
      ...appData,
      // combine both persistent and transient state with the transient state
      // taking precedence in case the key is the same
      store: { ...appData.store.persistent, ...appData.store.transient },
      theme,
    } as DataTreeAppsmith;

    (entityConfigCollection.appsmith as DataTreeAppsmith).ENTITY_TYPE =
      ENTITY_TYPE.APPSMITH;

    const end = performance.now();

    const out = {
      total: end - start,
      widgets: endWidgets - startWidgets,
      actions: endActions - startActions,
      jsActions: endJsActions - startJsActions,
    };

    log.debug("### Create unevalTree timing", out);

    return { unEvalTree, entityConfigCollection };
  }
}
