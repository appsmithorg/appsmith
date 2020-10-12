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
import { PluginType, Property } from "entities/Action";
import { AppDataState } from "reducers/entityReducers/appReducer";
import _ from "lodash";

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
  pluginType: PluginType;
  name: string;
  run: ActionDispatcher<RunActionPayload, [string, string, string]> | {};
  dynamicBindingPathList: Property[];
  ENTITY_TYPE: ENTITY_TYPE.ACTION;
}

export interface DataTreeWidget extends WidgetProps {
  ENTITY_TYPE: ENTITY_TYPE.WIDGET;
}

export interface DataTreeAppsmith extends AppDataState {
  ENTITY_TYPE: ENTITY_TYPE.APPSMITH;
  store: Record<string, unknown>;
}

export type DataTreeEntity =
  | DataTreeAction
  | DataTreeWidget
  | PageListPayload
  | DataTreeAppsmith
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
    actions.forEach(action => {
      let dynamicBindingPathList: Property[] = [];
      // update paths
      if (
        action.config.dynamicBindingPathList &&
        action.config.dynamicBindingPathList.length
      ) {
        dynamicBindingPathList = action.config.dynamicBindingPathList.map(
          d => ({
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
        dynamicBindingPathList,
        data: action.data ? action.data.body : {},
        ENTITY_TYPE: ENTITY_TYPE.ACTION,
        isLoading: action.isLoading,
      };
    });
    Object.keys(widgets).forEach(w => {
      const widget = { ...widgets[w] };
      const widgetMetaProps = widgetsMeta[w];
      const defaultMetaProps = WidgetFactory.getWidgetMetaPropertiesMap(
        widget.type,
      );
      const derivedPropertyMap = WidgetFactory.getWidgetDerivedPropertiesMap(
        widget.type,
      );
      const derivedProps: any = {};
      const dynamicBindings = { ...widget.dynamicBindings } || {};
      Object.keys(dynamicBindings).forEach(propertyName => {
        if (_.isObject(widget[propertyName])) {
          // Stringify this because composite controls may have bindings in the sub controls
          widget[propertyName] = JSON.stringify(widget[propertyName]);
        }
      });
      Object.keys(derivedPropertyMap).forEach(propertyName => {
        derivedProps[propertyName] = derivedPropertyMap[propertyName].replace(
          /this./g,
          `${widget.widgetName}.`,
        );
        dynamicBindings[propertyName] = true;
      });
      dataTree[widget.widgetName] = {
        ...widget,
        ...defaultMetaProps,
        ...widgetMetaProps,
        ...derivedProps,
        dynamicBindings,
        ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      };
    });

    dataTree.pageList = pageList;
    dataTree.appsmith = { ...appData } as DataTreeAppsmith;
    (dataTree.appsmith as DataTreeAppsmith).ENTITY_TYPE = ENTITY_TYPE.APPSMITH;
    return dataTree;
  }
}
