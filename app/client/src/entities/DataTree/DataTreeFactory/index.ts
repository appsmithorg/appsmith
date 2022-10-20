import { ActionDataState } from "reducers/entityReducers/actionsReducer";

import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { MetaState } from "reducers/entityReducers/metaReducer";
import { AppDataState } from "reducers/entityReducers/appReducer";
import { DependencyMap } from "utils/DynamicBindingUtils";
import { generateDataTreeAction } from "entities/DataTree/Action/dataTreeAction";
import { generateDataTreeJSAction } from "entities/DataTree/JSAction";
import { generateDataTreeWidget } from "entities/DataTree/Widget";
import { JSCollectionDataState } from "reducers/entityReducers/jsActionsReducer";
import { ActionDescription } from "entities/DataTree/actionTriggers";
import { AppTheme } from "entities/AppTheming";
import log from "loglevel";
import {
  DataTreeJSAction,
  JSActionEntityConfig,
  JSActionEvalTree,
} from "../JSAction/types";
import {
  DataTreeWidget,
  WidgetEntityConfig,
  WidgetEvalTree,
} from "../Widget/types";
import {
  ActionEntityConfig,
  ActionEntityEvalTree,
  DataTreeAction,
} from "../Action/types";

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

export type DataTreeEntity = DataTreeObjectEntity;

export type DataTree = {
  [entityName: string]: DataTreeEntity;
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

type DataTreeSeed = {
  actions: ActionDataState;
  editorConfigs: Record<string, any[]>;
  pluginDependencyConfig: Record<string, DependencyMap>;
  widgets: CanvasWidgetsReduxState;
  widgetsMeta: MetaState;
  // pageList: Page[];
  appData: AppDataState;
  jsActions: JSCollectionDataState;
  theme: AppTheme["properties"];
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
    unEvalDataTree: EvalTree;
    entityConfigCollection: EntityConfigCollection;
  } {
    const dataTree: EvalTree = {};
    const entityConfigCollection: EntityConfigCollection = {};
    const start = performance.now();
    const startActions = performance.now();

    actions.forEach((action) => {
      const editorConfig = editorConfigs[action.config.pluginId];
      const dependencyConfig = pluginDependencyConfig[action.config.pluginId];
      const {
        dataTree: actionDataTree,
        entityConfig: actionEntityConfig,
      } = generateDataTreeAction(action, editorConfig, dependencyConfig);
      dataTree[action.config.name] = actionDataTree;
      entityConfigCollection[action.config.name] = actionEntityConfig;
    });
    const endActions = performance.now();

    const startJsActions = performance.now();

    jsActions.forEach((js) => {
      const {
        dataTree: jsActionDataTree,
        entityConfig: jsActionEntityConfig,
      } = generateDataTreeJSAction(js);
      dataTree[js.config.name] = jsActionDataTree;
      entityConfigCollection[js.config.name] = jsActionEntityConfig;
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

    // remove pageList
    // dataTree.pageList = pageList;

    dataTree.appsmith = {
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

    return { unEvalDataTree: dataTree, entityConfigCollection };
  }
}
