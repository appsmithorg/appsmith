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
import { ActionConfig, Property } from "entities/Action";
import { AuthUserState } from "@appsmith/reducers/entityReducers/authUserReducer";
import { UrlDataState } from "@appsmith/reducers/entityReducers/urlReducer";

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
  run: ActionDispatcher<RunActionPayload, [string, string, string]> | {};
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

export interface DataTreeAppsmith {
  user: AuthUserState;
  URL: UrlDataState;
  ENTITY_TYPE: ENTITY_TYPE.APPSMITH;
}

export type DataTreeEntity =
  | DataTreeAction
  | DataTreeWidget
  | DataTreeUrl
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
  url: DataTreeUrl;
  authUser: AuthUserState;
};

export class DataTreeFactory {
  static create(
    { actions, widgets, widgetsMeta, pageList, authUser, url }: DataTreeSeed,
    // TODO(hetu)
    // temporary fix for not getting functions while normal evals which crashes the app
    // need to remove this after we get a proper solve
    withFunctions?: boolean,
  ): DataTree {
    const dataTree: DataTree = {};
    const actionPaths = [];
    actions.forEach(a => {
      const config = a.config;
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
        actionId: config.id,
        config: config.actionConfiguration,
        dynamicBindingPathList,
        data: a.data ? a.data.body : {},
        run: withFunctions
          ? function(
              this: DataTreeAction,
              onSuccess: string,
              onError: string,
              params = "",
            ) {
              return {
                type: "RUN_ACTION",
                payload: {
                  actionId: this.actionId,
                  onSuccess: onSuccess ? `{{${onSuccess.toString()}}}` : "",
                  onError: onError ? `{{${onError.toString()}}}` : "",
                  params,
                },
              };
            }
          : {},
        ENTITY_TYPE: ENTITY_TYPE.ACTION,
      };
      if (withFunctions) {
        actionPaths.push(`${config.name}.run`);
      }
      dataTree.actionPaths && dataTree.actionPaths.push();
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

    if (withFunctions) {
      dataTree.navigateTo = function(pageNameOrUrl: string, params: object) {
        return {
          type: "NAVIGATE_TO",
          payload: { pageNameOrUrl, params },
        };
      };
      actionPaths.push("navigateTo");

      dataTree.showAlert = function(message: string, style: string) {
        return {
          type: "SHOW_ALERT",
          payload: { message, style },
        };
      };
      actionPaths.push("showAlert");

      // dataTree.url = url;
      dataTree.showModal = function(modalName: string) {
        return {
          type: "SHOW_MODAL_BY_NAME",
          payload: { modalName },
        };
      };
      actionPaths.push("showModal");

      dataTree.closeModal = function(modalName: string) {
        return {
          type: "CLOSE_MODAL",
          payload: { modalName },
        };
      };
      actionPaths.push("closeModal");
    }

    dataTree.pageList = pageList;
    dataTree.actionPaths = actionPaths;
    dataTree.appsmith = {
      ENTITY_TYPE: ENTITY_TYPE.APPSMITH,
      user: authUser,
      URL: url,
    };
    return dataTree;
  }
}
