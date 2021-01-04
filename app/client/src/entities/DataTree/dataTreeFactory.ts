import {
  ActionData,
  ActionDataState,
} from "reducers/entityReducers/actionsReducer";
import { WidgetProps } from "widgets/BaseWidget";
import { ActionResponse } from "api/ActionAPI";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { MetaState } from "reducers/entityReducers/metaReducer";
import { PageListPayload } from "constants/ReduxActionConstants";
import WidgetFactory from "utils/WidgetFactory";
import { ActionConfig, PluginType } from "entities/Action";
import { AppDataState } from "reducers/entityReducers/appReducer";
import _ from "lodash";
import {
  DynamicPath,
  getEntityDynamicBindingPathList,
} from "../../utils/DynamicBindingUtils";

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
  params: Record<string, any>;
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
  ENTITY_TYPE: ENTITY_TYPE.ACTION;
}

export interface DataTreeWidget extends WidgetProps {
  ENTITY_TYPE: ENTITY_TYPE.WIDGET;
}

export interface DataTreeAppsmith extends AppDataState {
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
  }: DataTreeSeed): DataTree {
    const dataTree: DataTree = {};
    actions.forEach((action) => {
      let dynamicBindingPathList: DynamicPath[] = [];
      // update paths
      if (
        action.config.dynamicBindingPathList &&
        action.config.dynamicBindingPathList.length
      ) {
        dynamicBindingPathList = action.config.dynamicBindingPathList.map(
          (d) => ({
            ...d,
            key: `config.${d.key}`,
          }),
        );
      }
      dataTree[action.config.name] = {
        run: {},
        actionId: action.config.id,
        name: action.config.name,
        pluginType: action.config.pluginType,
        config: action.config.actionConfiguration,
        dynamicBindingPathList,
        data: action.data ? action.data.body : {},
        ENTITY_TYPE: ENTITY_TYPE.ACTION,
        isLoading: action.isLoading,
      };
    });
    Object.keys(widgets).forEach((w) => {
      const widget = { ...widgets[w] };
      const widgetMetaProps = widgetsMeta[w];
      const defaultMetaProps = WidgetFactory.getWidgetMetaPropertiesMap(
        widget.type,
      );
      const derivedPropertyMap = WidgetFactory.getWidgetDerivedPropertiesMap(
        widget.type,
      );
      const derivedProps: any = {};
      const dynamicBindingPathList = getEntityDynamicBindingPathList(widget);
      dynamicBindingPathList.forEach((dynamicPath) => {
        const propertyPath = dynamicPath.key;
        const propertyValue = _.get(widget, propertyPath);
        if (_.isObject(propertyValue)) {
          // Stringify this because composite controls may have bindings in the sub controls
          _.set(widget, propertyPath, JSON.stringify(propertyValue));
        }
      });
      Object.keys(derivedPropertyMap).forEach((propertyName) => {
        derivedProps[propertyName] = derivedPropertyMap[propertyName].replace(
          /this./g,
          `${widget.widgetName}.`,
        );
        dynamicBindingPathList.push({
          key: propertyName,
        });
      });
      dataTree[widget.widgetName] = {
        ...widget,
        ...defaultMetaProps,
        ...widgetMetaProps,
        ...derivedProps,
        dynamicBindingPathList,
        ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      };
    });

    dataTree.pageList = pageList;
    dataTree.appsmith = { ...appData } as DataTreeAppsmith;
    (dataTree.appsmith as DataTreeAppsmith).ENTITY_TYPE = ENTITY_TYPE.APPSMITH;
    return dataTree;
  }
}
