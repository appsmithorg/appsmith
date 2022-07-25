import { AppState } from "reducers";
import { createSelector } from "reselect";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { WidgetProps } from "widgets/BaseWidget";
import _ from "lodash";
import {
  WidgetType,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import { Page } from "@appsmith/constants/ReduxActionConstants";
import { getActions, getPlugins } from "selectors/entitiesSelector";
import { Plugin } from "api/PluginApi";

export const getWidgets = (state: AppState): CanvasWidgetsReduxState => {
  return state.entities.canvasWidgets;
};

export const getWidgetsMeta = (state: AppState) => state.entities.meta;

export const getWidgetMetaProps = createSelector(
  [getWidgetsMeta, (_state: AppState, widgetId: string) => widgetId],
  (metaState, widgetId: string) => metaState[widgetId],
);

export const getWidgetByID = (widgetId: string) => {
  return createSelector(
    getWidgets,
    (canvasWidgets: { [widgetId: string]: FlattenedWidgetProps }) => {
      return canvasWidgets[widgetId];
    },
  );
};

export const getWidget = (state: AppState, widgetId: string): WidgetProps => {
  return state.entities.canvasWidgets[widgetId];
};

export const getWidgetIdsByType = (state: AppState, type: WidgetType) => {
  return Object.values(state.entities.canvasWidgets)
    .filter((widget: FlattenedWidgetProps) => widget.type === type)
    .map((widget: FlattenedWidgetProps) => widget.widgetId);
};

export const getWidgetOptionsTree = createSelector(getWidgets, (widgets) =>
  Object.values(widgets)
    .filter((w) => w.type !== "CANVAS_WIDGET" && w.type !== "BUTTON_WIDGET")
    .map((w) => {
      return {
        label: w.widgetName,
        id: w.widgetName,
        value: `"${w.widgetName}"`,
      };
    }),
);

export const getEditorConfigs = (
  state: AppState,
): { pageId: string; layoutId: string } | undefined => {
  const pageId = state.entities.pageList.currentPageId;
  const layoutId = state.ui.editor.currentLayoutId;
  if (!pageId || !layoutId) return undefined;
  return { pageId, layoutId };
};

export const getDefaultPageId = (state: AppState): string =>
  state.entities.pageList.defaultPageId;

export const getExistingWidgetNames = createSelector(
  getWidgets,
  (widgets: { [widgetId: string]: FlattenedWidgetProps }) => {
    return Object.values(widgets).map((widget) => widget.widgetName);
  },
);

export const currentPageId = (state: AppState) => {
  return state.entities.pageList.currentPageId;
};

export const getExistingActionNames = createSelector(
  getActions,
  currentPageId,
  (actions: ActionData[], pageId?: string) => {
    return _.compact(
      actions.map((action: ActionData) => {
        return action.config.pageId === pageId ? action.config.name : undefined;
      }),
    );
  },
);

export const getPluginIdToImageLocation = createSelector(
  getPlugins,
  (plugins) =>
    plugins.reduce((acc: any, p: Plugin) => {
      acc[p.id] = p.iconLocation;
      return acc;
    }, {}),
);

/**
 * returns a objects of existing page name in data tree
 *
 * @param state
 */
export const getExistingPageNames = (state: AppState) => {
  const map: Record<string, any> = {};

  state.entities.pageList.pages.map((page: Page) => {
    map[page.pageName] = page.pageName;
  });

  return map;
};

export const getWidgetByName = (
  state: AppState,
  widgetName: string,
): FlattenedWidgetProps | undefined => {
  const widgets = state.entities.canvasWidgets;
  return _.find(
    Object.values(widgets),
    (widget) => widget.widgetName === widgetName,
  );
};

export const getAllPageIds = (state: AppState) => {
  return state.entities.pageList.pages.map((page) => page.pageId);
};

export const getPluginIdOfPackageName = (
  state: AppState,
  name: string,
): string | undefined => {
  const plugins = state.entities.plugins.list;
  const plugin = _.find(plugins, { packageName: name });
  if (plugin) return plugin.id;
  return undefined;
};

export const getDragDetails = (state: AppState) => {
  return state.ui.widgetDragResize.dragDetails;
};

export const getSelectedWidget = (
  state: AppState,
): FlattenedWidgetProps | undefined => {
  const selectedWidgetId = state.ui.widgetDragResize.lastSelectedWidget;
  if (!selectedWidgetId) return;
  return state.entities.canvasWidgets[selectedWidgetId];
};

export const getFocusedWidget = (state: AppState) => {
  const focusedWidgetId = state.ui.widgetDragResize.focusedWidget;
  if (!focusedWidgetId) return;
  return state.entities.canvasWidgets[focusedWidgetId];
};

export const getWidgetImmediateChildren = createSelector(
  getWidget,
  (widget: WidgetProps) => {
    const childrenIds: string[] = [];
    if (widget === undefined) {
      return [];
    }
    const { children = [] } = widget;
    if (children && children.length) {
      for (const childIndex in children) {
        if (children.hasOwnProperty(childIndex)) {
          const child = children[childIndex];
          childrenIds.push(child);
        }
      }
    }
    return childrenIds;
  },
);

/**
 * get actual parent of widget based on widgetId
 * for button inside form, button's parent is form
 * for button on canvas, parent is main container
 */
export const getWidgetParent = (widgetId: string) => {
  return createSelector(
    getWidgets,
    (canvasWidgets: CanvasWidgetsReduxState) => {
      let widget = canvasWidgets[widgetId];
      // While this widget has a parent
      while (widget?.parentId) {
        // Get parent widget props
        const parent = _.get(canvasWidgets, widget.parentId, undefined);
        // keep walking up the tree to find the parent untill parent exist or parent is the main container
        if (parent?.parentId && parent.parentId !== MAIN_CONTAINER_WIDGET_ID) {
          widget = canvasWidgets[widget.parentId];
          continue;
        } else {
          return parent;
        }
      }
      return;
    },
  );
};
