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

export interface UnEvalTreeAction extends ActionEntityEvalTree {
  __config__: ActionEntityConfig;
}
export interface DataTreeAction
  extends ActionEntityEvalTree,
    ActionEntityConfig {}

export interface UnEvalTreeJSAction extends JSActionEvalTree {
  __config__: JSActionEntityConfig;
}

export type DataTreeJSAction = JSActionEvalTree & JSActionEntityConfig;

export interface WidgetEntityConfig
  extends Partial<WidgetProps>,
    Omit<WidgetConfigProps, "widgetName" | "rows" | "columns">,
    WidgetConfig {
  defaultMetaProps: Array<string>;
  type: string;
}

export interface WidgetEvalTree extends WidgetProps {
  meta: Record<string, unknown>;
  ENTITY_TYPE: ENTITY_TYPE.WIDGET;
}

export interface UnEvalTreeWidget extends WidgetEvalTree {
  __config__: WidgetEntityConfig;
}

export interface DataTreeWidget extends WidgetEvalTree, WidgetConfig {}

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

export class DataTreeFactory {
  static create({
    actions,
    appData,
    editorConfigs,
    jsActions,
    pageList,
    pluginDependencyConfig,
    theme,
    widgets,
    widgetsMeta,
  }: DataTreeSeed): UnEvalTree {
    const dataTree: UnEvalTree = {};
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
      dataTree[widget.widgetName] = generateDataTreeWidget(
        widget,
        widgetsMeta[widget.widgetId],
      );
    });
    const endWidgets = performance.now();

    dataTree.pageList = pageList;

    dataTree.appsmith = {
      ...appData,
      // combine both persistent and transient state with the transient state
      // taking precedence in case the key is the same
      store: { ...appData.store.persistent, ...appData.store.transient },
      theme,
    } as DataTreeAppsmith;
    (dataTree.appsmith as DataTreeAppsmith).ENTITY_TYPE = ENTITY_TYPE.APPSMITH;
    const end = performance.now();

    const out = {
      total: end - start,
      widgets: endWidgets - startWidgets,
      actions: endActions - startActions,
      jsActions: endJsActions - startJsActions,
    };

    log.debug("### Create unevalTree timing", out);

    return dataTree;
  }
}

export { ENTITY_TYPE, EvaluationSubstitutionType };
