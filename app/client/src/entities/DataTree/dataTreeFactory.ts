import {
  ActionData,
  ActionDataState,
} from "reducers/entityReducers/actionsReducer";
import { WidgetProps } from "widgets/BaseWidget";
import { ActionResponse } from "api/ActionAPI";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { MetaState } from "reducers/entityReducers/metaReducer";
import { PageListPayload } from "constants/ReduxActionConstants";
import { ActionConfig, PluginType } from "entities/Action";
import { AppDataState } from "reducers/entityReducers/appReducer";
import { DynamicPath } from "utils/DynamicBindingUtils";
import { generateDataTreeAction } from "entities/DataTree/dataTreeAction";
import { generateDataTreeWidget } from "entities/DataTree/dataTreeWidget";

export type ActionDescription<T> = {
  type: string;
  payload: T;
};

export type ActionDispatcher<T, A extends string[]> = (
  ...args: A
) => ActionDescription<T>;

export enum ENTITY_TYPE {
  ACTION = "ACTION",
  WIDGET = "WIDGET",
  APPSMITH = "APPSMITH",
}

export type RunActionPayload = {
  actionId: string;
  onSuccess: string;
  onError: string;
  params: Record<string, any> | string;
};

export interface DataTreeAction extends Omit<ActionData, "data" | "config"> {
  data: ActionResponse["body"];
  actionId: string;
  config: Partial<ActionConfig>;
  pluginType: PluginType;
  name: string;
  run:
    | ActionDispatcher<RunActionPayload, [string, string, string]>
    | Record<string, any>;
  dynamicBindingPathList: DynamicPath[];
  bindingPaths: Record<string, boolean>;
  ENTITY_TYPE: ENTITY_TYPE.ACTION;
}

export interface DataTreeWidget extends WidgetProps {
  bindingPaths: Record<string, boolean>;
  triggerPaths: Record<string, boolean>;
  ENTITY_TYPE: ENTITY_TYPE.WIDGET;
}

export interface DataTreeAppsmith extends Omit<AppDataState, "store"> {
  ENTITY_TYPE: ENTITY_TYPE.APPSMITH;
  store: Record<string, unknown>;
}

export type DataTreeObjectEntity =
  | DataTreeAction
  | DataTreeWidget
  | DataTreeAppsmith;

export type DataTreeEntity =
  | DataTreeObjectEntity
  | PageListPayload
  | ActionDispatcher<any, any>;

export type DataTree = {
  [entityName: string]: DataTreeEntity;
} & { actionPaths?: string[] };

type DataTreeSeed = {
  actions: ActionDataState;
  editorConfigs: Record<string, any[]>;
  widgets: CanvasWidgetsReduxState;
  widgetsMeta: MetaState;
  pageList: PageListPayload;
  appData: AppDataState;
};

export class DataTreeFactory {
  static create({
    actions,
    widgets,
    widgetsMeta,
    pageList,
    appData,
    editorConfigs,
  }: DataTreeSeed): DataTree {
    const dataTree: DataTree = {};
    actions.forEach((action) => {
      const editorConfig = editorConfigs[action.config.pluginId];
      dataTree[action.config.name] = generateDataTreeAction(
        action,
        editorConfig,
      );
    });
    Object.values(widgets).forEach((widget) => {
      dataTree[widget.widgetName] = generateDataTreeWidget(
        widget,
        widgetsMeta[widget.widgetId],
      );
    });

    dataTree.pageList = pageList;
    dataTree.appsmith = {
      ...appData,
      // combine both persistent and transient state with the transient state
      // taking precedence in case the key is the same
      store: { ...appData.store.persistent, ...appData.store.transient },
    } as DataTreeAppsmith;
    (dataTree.appsmith as DataTreeAppsmith).ENTITY_TYPE = ENTITY_TYPE.APPSMITH;
    return dataTree;
  }
}
