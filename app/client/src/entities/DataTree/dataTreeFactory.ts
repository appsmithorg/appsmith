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
import { ActionDraftsState } from "reducers/entityReducers/actionDraftsReducer";
import { Property } from "entities/Action";

export type ActionDescription<T> = {
  type: string;
  payload: T;
};

type ActionDispatcher<T, A extends string[]> = (
  ...args: A
) => ActionDescription<T>;

export enum ENTITY_TYPE {
  ACTION = "ACTION",
  WIDGET = "WIDGET",
}

export type RunActionPayload = {
  actionId: string;
  onSuccess: string;
  onError: string;
};

export interface DataTreeAction extends Omit<ActionData, "data"> {
  data: ActionResponse["body"];
  run: ActionDispatcher<RunActionPayload, [string, string]>;
  dynamicBindingPathList: Property[];
  ENTITY_TYPE: ENTITY_TYPE.ACTION;
}

export interface DataTreeUrl {
  queryParams: Record<string, string>;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  hash: string;
  href: string;
}

export interface DataTreeWidget extends WidgetProps {
  ENTITY_TYPE: ENTITY_TYPE.WIDGET;
}

export type DataTreeEntity =
  | DataTreeAction
  | DataTreeWidget
  | DataTreeUrl
  | PageListPayload
  | ActionDispatcher<any, any>;

export type DataTree = {
  [entityName: string]: DataTreeEntity;
} & { actionPaths?: string[] };

type DataTreeSeed = {
  actions: ActionDataState;
  actionDrafts: ActionDraftsState;
  widgets: CanvasWidgetsReduxState;
  widgetsMeta: MetaState;
  pageList: PageListPayload;
  url?: DataTreeUrl;
};

export class DataTreeFactory {
  static create({
    actions,
    actionDrafts,
    widgets,
    widgetsMeta,
    pageList,
  }: DataTreeSeed): DataTree {
    const dataTree: DataTree = {};
    dataTree.actionPaths = [
      "navigateTo",
      "showAlert",
      "showModal",
      "closeModal",
    ];
    actions.forEach(a => {
      const config =
        a.config.id in actionDrafts ? actionDrafts[a.config.id] : a.config;
      let dynamicBindingPathList: Property[] = [];
      // update paths
      if (
        config.dynamicBindingPathList &&
        config.dynamicBindingPathList.length
      ) {
        dynamicBindingPathList = config.dynamicBindingPathList.map(d => ({
          ...d,
          key: `config.${d.key}`,
        }));
      }
      dataTree[config.name] = {
        ...a,
        config: config,
        dynamicBindingPathList,
        data: a.data ? a.data.body : {},
        run: function(onSuccess: string, onError: string) {
          return {
            type: "RUN_ACTION",
            payload: {
              actionId: this.config.id,
              onSuccess: onSuccess ? `{{${onSuccess.toString()}}}` : "",
              onError: onError ? `{{${onError.toString()}}}` : "",
            },
          };
        },
        ENTITY_TYPE: ENTITY_TYPE.ACTION,
      };
      dataTree.actionPaths && dataTree.actionPaths.push(`${config.name}.run`);
    });
    Object.keys(widgets).forEach(w => {
      const widget = widgets[w];
      const widgetMetaProps = widgetsMeta[w];
      const defaultMetaProps = WidgetFactory.getWidgetMetaPropertiesMap(
        widget.type,
      );
      const derivedPropertyMap = WidgetFactory.getWidgetDerivedPropertiesMap(
        widget.type,
      );
      const derivedProps: any = {};
      const dynamicBindings = widget.dynamicBindings || {};
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
    dataTree.navigateTo = function(pageNameOrUrl: string, params: object) {
      return {
        type: "NAVIGATE_TO",
        payload: { pageNameOrUrl, params },
      };
    };

    dataTree.showAlert = function(message: string, style: string) {
      return {
        type: "SHOW_ALERT",
        payload: { message, style },
      };
    };

    // dataTree.url = url;
    dataTree.showModal = function(modalName: string) {
      return {
        type: "SHOW_MODAL_BY_NAME",
        payload: { modalName },
      };
    };
    dataTree.closeModal = function(modalName: string) {
      return {
        type: "CLOSE_MODAL",
        payload: { modalName },
      };
    };

    dataTree.pageList = pageList;
    return dataTree;
  }
}
