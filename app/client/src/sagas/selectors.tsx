import { AppState } from "reducers";
import { createSelector } from "reselect";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { WidgetProps } from "widgets/BaseWidget";
import _ from "lodash";
import { WidgetType } from "constants/WidgetConstants";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import { Page } from "constants/ReduxActionConstants";
import { getActions, getPlugins } from "../selectors/entitiesSelector";
import { Plugin } from "api/PluginApi";

export const getWidgets = (
  state: AppState,
): { [widgetId: string]: FlattenedWidgetProps } => {
  return state.entities.canvasWidgets;
};

export const getWidgetsMeta = (state: AppState) => state.entities.meta;
export const getWidgetMetaProps = (state: AppState, widgetId: string) =>
  state.entities.meta[widgetId];

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

export const getDefaultPageId = (state: AppState): string | undefined =>
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

export const getSelectedWidget = (state: AppState) => {
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
