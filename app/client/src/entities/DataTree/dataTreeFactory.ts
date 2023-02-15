import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { WidgetProps } from "widgets/BaseWidget";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { MetaState } from "reducers/entityReducers/metaReducer";
import { Page } from "@appsmith/constants/ReduxActionConstants";
import { AppDataState } from "reducers/entityReducers/appReducer";
import { DependencyMap } from "utils/DynamicBindingUtils";
import { generateDataTreeAction } from "entities/DataTree/dataTreeAction";
import { generateDataTreeJSAction } from "entities/DataTree/dataTreeJSAction";
import { generateDataTreeWidget } from "entities/DataTree/dataTreeWidget";
import { JSCollectionDataState } from "reducers/entityReducers/jsActionsReducer";
import { AppTheme } from "entities/AppTheming";
import log from "loglevel";
import { MetaWidgetsReduxState } from "reducers/entityReducers/metaWidgetsReducer";
import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import {
  ActionDispatcher,
  ActionEntityConfig,
  ActionEntityEvalTree,
  ENTITY_TYPE,
  JSActionEntityConfig,
  JSActionEvalTree,
  WidgetConfig,
  EvaluationSubstitutionType,
} from "./types";

export type UnEvalTreeAction = ActionEntityEvalTree;
export type UnEvalTreeJSAction = JSActionEvalTree;
export type UnEvalTreeWidget = WidgetEvalTree;

export type UnEvalTreeEntityObject =
  | UnEvalTreeAction
  | UnEvalTreeJSAction
  | UnEvalTreeWidget;

export type UnEvalTreeEntity =
  | UnEvalTreeEntityObject
  | DataTreeAppsmith
  | Page[];

export type UnEvalTree = {
  [entityName: string]: UnEvalTreeEntity;
};

export type DataTreeAction = ActionEntityEvalTree;
export type DataTreeJSAction = JSActionEvalTree;
export type DataTreeWidget = WidgetEvalTree;

export interface WidgetEvalTree extends WidgetProps {
  meta: Record<string, unknown>;
  ENTITY_TYPE: ENTITY_TYPE.WIDGET;
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

export interface WidgetEntityConfig
  extends Partial<WidgetProps>,
    Omit<WidgetConfigProps, "widgetName" | "rows" | "columns">,
    WidgetConfig {
  defaultMetaProps: Array<string>;
  type: string;
}

export interface DataTreeAppsmith extends Omit<AppDataState, "store"> {
  ENTITY_TYPE: ENTITY_TYPE.APPSMITH;
  store: Record<string, unknown>;
  theme: AppTheme["properties"];
}

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
  metaWidgets: MetaWidgetsReduxState;
};

export type DataTreeEntityConfig =
  | WidgetEntityConfig
  | ActionEntityConfig
  | JSActionEntityConfig;

export type ConfigTree = {
  [entityName: string]: DataTreeEntityConfig;
};

export type unEvalAndConfigTree = {
  unEvalTree: UnEvalTree;
  configTree: ConfigTree;
};

export class DataTreeFactory {
  static create({
    actions,
    appData,
    editorConfigs,
    jsActions,
    metaWidgets,
    pageList,
    pluginDependencyConfig,
    theme,
    widgets,
    widgetsMeta,
  }: DataTreeSeed): unEvalAndConfigTree {
    const dataTree: any = {};
    const configTree: ConfigTree = {};
    const start = performance.now();
    const startActions = performance.now();

    actions.forEach((action) => {
      const editorConfig = editorConfigs[action.config.pluginId];
      const dependencyConfig = pluginDependencyConfig[action.config.pluginId];
      const { configEntity, unEvalEntity } = generateDataTreeAction(
        action,
        editorConfig,
        dependencyConfig,
      );
      dataTree[action.config.name] = unEvalEntity;
      configTree[action.config.name] = configEntity;
    });
    const endActions = performance.now();

    const startJsActions = performance.now();

    jsActions.forEach((js) => {
      const { configEntity, unEvalEntity } = generateDataTreeJSAction(js);
      dataTree[js.config.name] = unEvalEntity;
      configTree[js.config.name] = configEntity;
    });
    const endJsActions = performance.now();

    const startWidgets = performance.now();

    Object.values(widgets).forEach((widget) => {
      const { configEntity, unEvalEntity } = generateDataTreeWidget(
        widget,
        widgetsMeta[widget.metaWidgetId || widget.widgetId],
      );

      dataTree[widget.widgetName] = unEvalEntity;
      configTree[widget.widgetName] = configEntity;
    });
    const endWidgets = performance.now();

    dataTree.pageList = pageList;

    dataTree.appsmith = {
      ...appData,
      // combine both persistent and transient state with the transient state
      // taking precedence in case the key is the same
      store: appData.store,
      theme,
    } as DataTreeAppsmith;
    (dataTree.appsmith as DataTreeAppsmith).ENTITY_TYPE = ENTITY_TYPE.APPSMITH;

    const startMetaWidgets = performance.now();

    Object.values(metaWidgets).forEach((widget) => {
      dataTree[widget.widgetName] = generateDataTreeWidget(
        widget,
        widgetsMeta[widget.metaWidgetId || widget.widgetId],
      );
    });
    const endMetaWidgets = performance.now();

    const end = performance.now();

    const out = {
      total: end - start,
      widgets: endWidgets - startWidgets,
      actions: endActions - startActions,
      jsActions: endJsActions - startJsActions,
      metaWidgets: endMetaWidgets - startMetaWidgets,
    };

    log.debug("### Create unevalTree timing", out);
    return { unEvalTree: dataTree, configTree };
  }
}

export { ENTITY_TYPE, EvaluationSubstitutionType };
