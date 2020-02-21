import { ActionData } from "reducers/entityReducers/actionsReducer";
import { WidgetProps } from "widgets/BaseWidget";
import { AppState } from "reducers";
import { ActionResponse } from "api/ActionAPI";

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
  ENTITY_TYPE: ENTITY_TYPE.ACTION;
}

export interface DataTreeWidget extends WidgetProps {
  ENTITY_TYPE: ENTITY_TYPE.WIDGET;
}

export type DataTree = {
  [key: string]: DataTreeAction | DataTreeWidget | ActionDispatcher<any, any>;
} & { actionPaths?: string[] };

export class DataTreeFactory {
  static create(state: AppState): DataTree {
    const dataTree: DataTree = {};
    dataTree.actionPaths = ["navigateTo", "navigateToUrl", "showAlert"];
    state.entities.actions.forEach(a => {
      dataTree[a.config.name] = {
        ...a,
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
      dataTree.actionPaths && dataTree.actionPaths.push(`${a.config.name}.run`);
    });
    Object.keys(state.entities.canvasWidgets).forEach(w => {
      const widget = state.entities.canvasWidgets[w];
      const widgetMetaProps = state.entities.meta[w];
      dataTree[widget.widgetName] = {
        ...widget,
        ...widgetMetaProps,
        ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      };
    });
    dataTree.navigateTo = function(pageName: string) {
      return {
        type: "NAVIGATE_TO",
        payload: { pageName },
      };
    };

    dataTree.navigateToUrl = function(url: string) {
      return {
        type: "NAVIGATE_TO_URL",
        payload: { url },
      };
    };

    dataTree.showAlert = function(message: string, style: string) {
      return {
        type: "SHOW_ALERT",
        payload: { message, style },
      };
    };

    return dataTree;
  }
}
